import os
import json
import time
import zipfile
import csv
import logging
from PIL import Image
import torch
import torch.nn.functional as F
from convnext_service.config import settings
from convnext_service.model.loader import model_container
from convnext_service.model.labels import ALL_CLASS_NAMES, CROP_DISEASE_CLASSES, SUPPORTED_CROPS

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] [%(levelname)s]: %(message)s")
logger = logging.getLogger("evaluate")

DATASET_BASE = r"C:\Users\ADMIN\.cache\kagglehub\datasets\emmarex\plantdisease\versions\1\PlantVillage"
ZIP_PATH = r"C:\Users\ADMIN\Downloads\Plant-Disease-Detection-main.zip"
OUTPUT_DIR = r"c:\Users\ADMIN\Desktop\leaf care backend\LeafCare-Backend\convnext_service\evaluation_artifacts"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Standard folder to label normalization map
FOLDER_TO_LABEL = {
    "Pepper__bell___Bacterial_spot": "Pepper,_bell___Bacterial_spot",
    "Pepper__bell___healthy": "Pepper,_bell___healthy",
    "Potato___Early_blight": "Potato___Early_blight",
    "Potato___healthy": "Potato___healthy",
    "Potato___Late_blight": "Potato___Late_blight",
    "Tomato_Bacterial_spot": "Tomato___Bacterial_spot",
    "Tomato_Early_blight": "Tomato___Early_blight",
    "Tomato_healthy": "Tomato___healthy",
    "Tomato_Late_blight": "Tomato___Late_blight",
    "Tomato_Leaf_Mold": "Tomato___Leaf_Mold",
    "Tomato_Septoria_leaf_spot": "Tomato___Septoria_leaf_spot",
    "Tomato_Spider_mites_Two_spotted_spider_mite": "Tomato___Spider_mites_Two-spotted_spider_mite",
    "Tomato__Target_Spot": "Tomato___Target_Spot",
    "Tomato__Tomato_mosaic_virus": "Tomato___Tomato_mosaic_virus",
    "Tomato__Tomato_YellowLeaf__Curl_Virus": "Tomato___Yellow_Leaf_Curl_Virus",
}

def get_crop_for_label(label: str) -> str:
    for crop, classes in CROP_DISEASE_CLASSES.items():
        if label in classes:
            return crop
    return "UNKNOWN"

def run_evaluation():
    logger.info("Initializing ConvNeXt Model Evaluation on Real Test Data...")
    model_container.load()
    model = model_container.model
    device = model_container.device
    transform = model_container.transform
    class_names = model_container.class_names

    # 1. Dataset collection & 20% held-out test split
    test_samples = [] # (image_path, true_label_idx, crop_name, label_name)

    if os.path.exists(DATASET_BASE):
        subfolders = [d for d in os.listdir(DATASET_BASE) if os.path.isdir(os.path.join(DATASET_BASE, d)) and d in FOLDER_TO_LABEL]
        for folder in subfolders:
            canonical_label = FOLDER_TO_LABEL[folder]
            if canonical_label not in class_names:
                continue
            label_idx = class_names.index(canonical_label)
            crop_name = get_crop_for_label(canonical_label)
            folder_path = os.path.join(DATASET_BASE, folder)
            files = sorted([os.path.join(folder_path, f) for f in os.listdir(folder_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
            
            # Deterministic held-out test set selection (every 20th file)
            held_out = files[::20]
            for img_path in held_out:
                test_samples.append((img_path, label_idx, crop_name, canonical_label))

    logger.info(f"Collected {len(test_samples)} held-out test images across available categories.")

    # 2. Model Evaluation Loop
    correct_count = 0
    total_count = len(test_samples)
    y_true = []
    y_pred = []
    confidences = []
    correct_confidences = []
    incorrect_confidences = []
    durations = []

    # Per class metrics tracking: {label: {"tp": 0, "fp": 0, "fn": 0, "correct_conf": [], "incorrect_conf": []}}
    class_stats = {name: {"tp": 0, "fp": 0, "fn": 0, "total": 0, "correct_conf": [], "incorrect_conf": []} for name in class_names}

    for img_path, true_idx, crop_name, true_label in test_samples:
        t0 = time.time()
        try:
            image = Image.open(img_path).convert("RGB")
            tensor = transform(image).unsqueeze(0).to(device)
            with torch.no_grad():
                output = model(tensor)
                probs = F.softmax(output, dim=1)[0]

            # Restricted crop prediction
            crop_classes = CROP_DISEASE_CLASSES.get(crop_name)
            if crop_classes:
                indices = [i for i, name in enumerate(class_names) if name in crop_classes]
                sub_probs = probs[indices]
                best_sub_idx = torch.argmax(sub_probs).item()
                pred_idx = indices[best_sub_idx]
                pred_conf = probs[pred_idx].item()
            else:
                pred_idx = torch.argmax(probs).item()
                pred_conf = probs[pred_idx].item()

            dur = (time.time() - t0) * 1000.0
            durations.append(dur)

            pred_label = class_names[pred_idx]
            y_true.append(true_idx)
            y_pred.append(pred_idx)
            confidences.append(pred_conf)

            class_stats[true_label]["total"] += 1
            if pred_idx == true_idx:
                correct_count += 1
                correct_confidences.append(pred_conf)
                class_stats[true_label]["tp"] += 1
                class_stats[true_label]["correct_conf"].append(pred_conf)
            else:
                incorrect_confidences.append(pred_conf)
                class_stats[true_label]["fn"] += 1
                class_stats[pred_label]["fp"] += 1
                class_stats[true_label]["incorrect_conf"].append(pred_conf)
        except Exception as e:
            logger.error(f"Error processing {img_path}: {e}")

    top1_accuracy = correct_count / total_count if total_count > 0 else 0.0
    avg_duration = sum(durations) / len(durations) if durations else 0.0
    avg_correct_conf = sum(correct_confidences) / len(correct_confidences) if correct_confidences else 0.0
    avg_incorrect_conf = sum(incorrect_confidences) / len(incorrect_confidences) if incorrect_confidences else 0.0

    logger.info(f"Evaluation Complete! Total Test Samples: {total_count}")
    logger.info(f"Top-1 Accuracy: {top1_accuracy * 100:.2f}%")
    logger.info(f"Average Inference Speed: {avg_duration:.2f}ms per sample")
    logger.info(f"Average Confidence (Correct): {avg_correct_conf:.4f} | (Incorrect): {avg_incorrect_conf:.4f}")

    # 3. Calculate per-class Precision, Recall, F1
    per_class_results = []
    macro_p, macro_r, macro_f1 = 0.0, 0.0, 0.0
    weighted_p, weighted_r, weighted_f1 = 0.0, 0.0, 0.0
    active_classes = 0

    for name in class_names:
        st = class_stats[name]
        tp = st["tp"]
        fp = st["fp"]
        fn = st["fn"]
        tot = st["total"]

        p = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        r = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * p * r) / (p + r) if (p + r) > 0 else 0.0

        if tot > 0:
            active_classes += 1
            macro_p += p
            macro_r += r
            macro_f1 += f1
            weighted_p += p * tot
            weighted_r += r * tot
            weighted_f1 += f1 * tot

        crop = get_crop_for_label(name)
        per_class_results.append({
            "class_name": name,
            "crop": crop,
            "total_test_samples": tot,
            "true_positives": tp,
            "false_positives": fp,
            "false_negatives": fn,
            "precision": round(p, 4),
            "recall": round(r, 4),
            "f1_score": round(f1, 4),
            "avg_confidence": round(sum(st["correct_conf"] + st["incorrect_conf"]) / len(st["correct_conf"] + st["incorrect_conf"]), 4) if (st["correct_conf"] + st["incorrect_conf"]) else 0.0
        })

    if active_classes > 0:
        macro_p /= active_classes
        macro_r /= active_classes
        macro_f1 /= active_classes

    if total_count > 0:
        weighted_p /= total_count
        weighted_r /= total_count
        weighted_f1 /= total_count

    # 4. Calculate Per-Crop Aggregated Metrics
    crop_stats = {crop: {"total": 0, "correct": 0, "classes": 0} for crop in SUPPORTED_CROPS}
    for res in per_class_results:
        c = res["crop"]
        if c in crop_stats:
            crop_stats[c]["total"] += res["total_test_samples"]
            crop_stats[c]["correct"] += res["true_positives"]
            crop_stats[c]["classes"] += 1

    per_crop_results = []
    for crop in SUPPORTED_CROPS:
        cs = crop_stats[crop]
        tot = cs["total"]
        corr = cs["correct"]
        acc = corr / tot if tot > 0 else 0.0
        per_crop_results.append({
            "crop": crop,
            "disease_classes_count": cs["classes"],
            "test_images_count": tot,
            "correct_predictions": corr,
            "accuracy": round(acc, 4)
        })

    # 5. Threshold Analysis
    thresholds = [0.50, 0.60, 0.70, 0.80, 0.90]
    threshold_results = []
    for th in thresholds:
        accepted = [i for i, c in enumerate(confidences) if c >= th]
        coverage = len(accepted) / total_count if total_count > 0 else 0.0
        accepted_correct = sum(1 for i in accepted if y_true[i] == y_pred[i])
        acc_at_th = accepted_correct / len(accepted) if len(accepted) > 0 else 0.0
        threshold_results.append({
            "threshold": th,
            "coverage": round(coverage, 4),
            "accuracy": round(acc_at_th, 4),
            "accepted_count": len(accepted),
            "rejected_count": total_count - len(accepted)
        })

    # 6. Save JSON & CSV Artifacts
    evaluation_summary = {
        "model_architecture": "convnext_tiny",
        "checkpoint": settings.MODEL_CHECKPOINT or "torchvision_pretrained_weights",
        "total_test_images": total_count,
        "active_evaluated_classes": active_classes,
        "total_model_classes": len(class_names),
        "overall_metrics": {
            "top1_accuracy": round(top1_accuracy, 4),
            "macro_precision": round(macro_p, 4),
            "macro_recall": round(macro_r, 4),
            "macro_f1": round(macro_f1, 4),
            "weighted_precision": round(weighted_p, 4),
            "weighted_recall": round(weighted_r, 4),
            "weighted_f1": round(weighted_f1, 4),
            "avg_inference_duration_ms": round(avg_duration, 2)
        },
        "confidence_stats": {
            "avg_confidence_correct": round(avg_correct_conf, 4),
            "avg_confidence_incorrect": round(avg_incorrect_conf, 4)
        },
        "per_crop_summary": per_crop_results,
        "threshold_analysis": threshold_results
    }

    with open(os.path.join(OUTPUT_DIR, "evaluation_results.json"), "w") as f:
        json.dump(evaluation_summary, f, indent=2)

    # Save per_class_metrics.csv
    with open(os.path.join(OUTPUT_DIR, "per_class_metrics.csv"), "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=per_class_results[0].keys())
        writer.writeheader()
        writer.writerows(per_class_results)

    # Save per_crop_metrics.csv
    with open(os.path.join(OUTPUT_DIR, "per_crop_metrics.csv"), "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=per_crop_results[0].keys())
        writer.writeheader()
        writer.writerows(per_crop_results)

    # Save confidence_analysis.csv
    with open(os.path.join(OUTPUT_DIR, "confidence_analysis.csv"), "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=threshold_results[0].keys())
        writer.writeheader()
        writer.writerows(threshold_results)

    logger.info(f"All evaluation artifacts successfully written to: {OUTPUT_DIR}")

if __name__ == "__main__":
    run_evaluation()
