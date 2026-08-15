import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from convnext_service.main import app

def create_dummy_image_bytes():
    img = Image.new("RGB", (224, 224), color="green")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["model_loaded"] is True
        assert "model" in data

def test_model_info_endpoint():
    with TestClient(app) as client:
        response = client.get("/model-info")
        assert response.status_code == 200
        data = response.json()
        assert len(data["supported_crops"]) == 14
        assert data["status"] == "loaded"

def test_predict_supported_crop():
    image_bytes = create_dummy_image_bytes()
    with TestClient(app) as client:
        response = client.post(
            "/predict",
            files={"image": ("test_leaf.jpg", image_bytes, "image/jpeg")},
            data={"crop": "TOMATO"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "disease_name" in data
        assert "confidence" in data
        assert 0.0 <= data["confidence"] <= 1.0
        assert data["crop"] == "TOMATO"

def test_predict_unsupported_crop():
    image_bytes = create_dummy_image_bytes()
    with TestClient(app) as client:
        response = client.post(
            "/predict",
            files={"image": ("test_leaf.jpg", image_bytes, "image/jpeg")},
            data={"crop": "MANGO"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "Unsupported crop category" in data["detail"]

def test_predict_missing_image():
    with TestClient(app) as client:
        response = client.post(
            "/predict",
            data={"crop": "TOMATO"}
        )
        assert response.status_code == 422
