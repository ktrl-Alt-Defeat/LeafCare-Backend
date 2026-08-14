# LeafCare AI & Plant Pathology Diagnostic Module

This module defines the architectural interfaces, DTOs, and contract definitions for integrating plant disease classification models into the LeafCare backend.

## Architectural Design

```
HTTP Client (Scan Request)
       ↓
[ AI Validation Middleware ] (Format, Size, Mime Check)
       ↓
[ AI Service Layer ] (src/modules/ai/ai.interfaces.ts)
       ↓
[ AI Model Provider ] (ONNX / TensorFlow Servings / Python Microservice)
```

## Contract Definitions

- `PlantDiagnosisRequestDTO`: Raw image payload + optional crop context.
- `PlantDiagnosisResponseDTO`: Identified disease ID, confidence score (0-100%), severity rating, and localized treatments.
- `IAIModelProvider`: Interface for pluggable AI model providers.
