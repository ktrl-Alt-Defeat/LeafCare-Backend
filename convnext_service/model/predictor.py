import io
import logging
import torch
import torch.nn.functional as F
from PIL import Image
from convnext_service.model.loader import model_container
from convnext_service.model.labels import CROP_DISEASE_CLASSES

logger = logging.getLogger(__name__)

class Predictor:
    def predict(self, image_bytes: bytes, crop: str) -> dict:
        if not model_container.is_loaded or model_container.model is None:
            raise RuntimeError("ConvNeXt model is not loaded.")

        # Load image via PIL
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as e:
            raise ValueError(f"Invalid or unreadable image file: {e}")

        # Preprocess tensor
        input_tensor = model_container.transform(image).unsqueeze(0).to(model_container.device)

        # Deterministic inference
        with torch.no_grad():
            outputs = model_container.model(input_tensor)
            probabilities = F.softmax(outputs, dim=1)[0]

        # Filter indices relevant to the specified crop if mapped
        crop_classes = CROP_DISEASE_CLASSES.get(crop)
        if crop_classes:
            indices = [i for i, name in enumerate(model_container.class_names) if name in crop_classes]
            if indices:
                sub_probs = probabilities[indices]
                best_sub_idx = torch.argmax(sub_probs).item()
                top_idx = indices[best_sub_idx]
                top_confidence = probabilities[top_idx].item()
            else:
                top_idx = torch.argmax(probabilities).item()
                top_confidence = probabilities[top_idx].item()
        else:
            top_idx = torch.argmax(probabilities).item()
            top_confidence = probabilities[top_idx].item()

        disease_name = model_container.class_names[top_idx]
        confidence = float(round(top_confidence, 4))

        logger.info(f"ConvNeXt predict for crop '{crop}': disease='{disease_name}', confidence={confidence}")

        return {
            "disease_name": disease_name,
            "confidence": confidence,
            "crop": crop
        }

predictor = Predictor()
