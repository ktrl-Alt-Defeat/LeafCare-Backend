from pydantic import BaseModel, Field, ConfigDict

class PredictResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    disease_name: str = Field(..., json_schema_extra={"example": "Tomato___Early_blight"})
    confidence: float = Field(..., json_schema_extra={"example": 0.9432})
    crop: str = Field(..., json_schema_extra={"example": "TOMATO"})

class HealthResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    status: str = Field(..., json_schema_extra={"example": "healthy"})
    model_loaded: bool = Field(..., json_schema_extra={"example": True})
    model: str = Field(..., json_schema_extra={"example": "ConvNeXt-Tiny"})
    device: str = Field(..., json_schema_extra={"example": "cpu"})

class ModelInfoResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    model_architecture: str = Field(..., json_schema_extra={"example": "convnext_tiny"})
    number_of_classes: int = Field(..., json_schema_extra={"example": 38})
    supported_crops: list[str]
    device: str
    status: str
