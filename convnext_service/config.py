import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "LeafCare ConvNeXt Disease Inference Service"
    APP_VERSION: str = "1.0.0"
    MODEL_ARCH: str = os.getenv("MODEL_ARCH", "convnext_tiny")
    MODEL_CHECKPOINT: str = os.getenv("MODEL_CHECKPOINT", "")
    MODEL_DEVICE: str = os.getenv("MODEL_DEVICE", "auto")
    MODEL_PORT: int = int(os.getenv("MODEL_PORT", "8000"))
    MODEL_HOST: str = os.getenv("MODEL_HOST", "0.0.0.0")

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
