"""
Authoritative crop definitions and plant pathology class mappings for LeafCare ConvNeXt Model.
"""

SUPPORTED_CROPS = [
    "TOMATO",
    "SOYBEAN",
    "ORANGE",
    "PEACH",
    "SQUASH",
    "APPLE",
    "BLUEBERRY",
    "BELL_PEPPER",
    "GRAPE",
    "CORN",
    "STRAWBERRY",
    "POTATO",
    "CHERRY",
    "RASPBERRY",
]

# Canonical PlantVillage / LeafCare disease labels mapped by crop category
CROP_DISEASE_CLASSES = {
    "TOMATO": [
        "Tomato___Bacterial_spot",
        "Tomato___Early_blight",
        "Tomato___Late_blight",
        "Tomato___Leaf_Mold",
        "Tomato___Septoria_leaf_spot",
        "Tomato___Spider_mites_Two-spotted_spider_mite",
        "Tomato___Target_Spot",
        "Tomato___Yellow_Leaf_Curl_Virus",
        "Tomato___Tomato_mosaic_virus",
        "Tomato___healthy",
    ],
    "SOYBEAN": [
        "Soybean___caterpillar",
        "Soybean___diabrotica",
        "Soybean___powdery_mildew",
        "Soybean___rust",
        "Soybean___healthy",
    ],
    "ORANGE": [
        "Orange___Haunglongbing_(Citrus_greening)",
        "Orange___healthy",
    ],
    "PEACH": [
        "Peach___Bacterial_spot",
        "Peach___healthy",
    ],
    "SQUASH": [
        "Squash___Powdery_mildew",
        "Squash___healthy",
    ],
    "APPLE": [
        "Apple___Apple_scab",
        "Apple___Black_rot",
        "Apple___Cedar_apple_rust",
        "Apple___healthy",
    ],
    "BLUEBERRY": [
        "Blueberry___rust",
        "Blueberry___healthy",
    ],
    "BELL_PEPPER": [
        "Pepper,_bell___Bacterial_spot",
        "Pepper,_bell___healthy",
    ],
    "GRAPE": [
        "Grape___Black_rot",
        "Grape___Esca_(Black_Measles)",
        "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
        "Grape___healthy",
    ],
    "CORN": [
        "Corn_(maize)___Cercospora_leaf_spot_Gray_leaf_spot",
        "Corn_(maize)___Common_rust_",
        "Corn_(maize)___Northern_Leaf_Blight",
        "Corn_(maize)___healthy",
    ],
    "STRAWBERRY": [
        "Strawberry___Leaf_scorch",
        "Strawberry___healthy",
    ],
    "POTATO": [
        "Potato___Early_blight",
        "Potato___Late_blight",
        "Potato___healthy",
    ],
    "CHERRY": [
        "Cherry_(including_sour)___Powdery_mildew",
        "Cherry_(including_sour)___healthy",
    ],
    "RASPBERRY": [
        "Raspberry___leaf_spot",
        "Raspberry___healthy",
    ],
}

# Full global class list (38 classes)
ALL_CLASS_NAMES = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot_Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites_Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]

def is_crop_supported(crop: str) -> bool:
    return crop in SUPPORTED_CROPS

def get_disease_classes_for_crop(crop: str) -> list[str]:
    return CROP_DISEASE_CLASSES.get(crop, ALL_CLASS_NAMES)
