import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, Form, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from convnext_service.config import settings
from convnext_service.model.loader import model_container
from convnext_service.model.predictor import predictor
from convnext_service.model.labels import is_crop_supported, SUPPORTED_CROPS
from convnext_service.schemas.response import (
    PredictResponse,
    HealthResponse,
    ModelInfoResponse,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s"
)
logger = logging.getLogger("convnext_service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up ConvNeXt inference service...")
    model_container.load()
    yield
    logger.info("Shutting down ConvNeXt inference service...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Production HTTP Inference API for ConvNeXt Plant Pathology Model",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
async def get_health():
    is_healthy = model_container.is_loaded and model_container.model is not None
    if not is_healthy:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not loaded or container is unhealthy."
        )
    return HealthResponse(
        status="healthy",
        model_loaded=True,
        model=f"ConvNeXt ({settings.MODEL_ARCH})",
        device=str(model_container.device)
    )

@app.get("/model-info", response_model=ModelInfoResponse)
async def get_model_info():
    return ModelInfoResponse(
        model_architecture=settings.MODEL_ARCH,
        number_of_classes=len(model_container.class_names),
        supported_crops=SUPPORTED_CROPS,
        device=str(model_container.device),
        status="loaded" if model_container.is_loaded else "not_loaded"
    )

@app.post("/predict", response_model=PredictResponse)
async def predict_disease(
    image: UploadFile = File(...),
    crop: str = Form(...)
):
    # 1. Validate crop input against supported crops
    crop_upper = crop.strip().upper()
    if not is_crop_supported(crop_upper):
        logger.warning(f"Prediction rejected for unsupported crop: {crop}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported crop category '{crop}'. ConvNeXt model supports 14 crop categories."
        )

    # 2. Validate image input
    if not image or not image.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image file is required."
        )

    image_bytes = await image.read()
    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image file is empty."
        )

    try:
        result = predictor.predict(image_bytes, crop_upper)
        return PredictResponse(
            disease_name=result["disease_name"],
            confidence=result["confidence"],
            crop=result["crop"]
        )
    except ValueError as ve:
        logger.warning(f"Image validation error during prediction: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Inference error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal ConvNeXt inference error occurred."
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("convnext_service.main:app", host=settings.MODEL_HOST, port=settings.MODEL_PORT, reload=False)
