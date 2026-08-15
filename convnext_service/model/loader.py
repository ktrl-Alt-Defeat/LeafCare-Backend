import os
import logging
import torch
import torchvision.models as models
import torchvision.transforms as transforms
from convnext_service.config import settings
from convnext_service.model.labels import ALL_CLASS_NAMES

logger = logging.getLogger(__name__)

class ModelContainer:
    def __init__(self):
        self.model = None
        self.device = None
        self.transform = None
        self.class_names = ALL_CLASS_NAMES
        self.is_loaded = False

    def select_device(self) -> torch.device:
        if settings.MODEL_DEVICE == "cuda" and torch.cuda.is_available():
            device = torch.device("cuda")
        elif settings.MODEL_DEVICE == "auto":
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            device = torch.device("cpu")
        return device

    def get_transforms(self):
        return transforms.Compose([
            transforms.Resize(236),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            ),
        ])

    def load(self):
        logger.info("Initializing ConvNeXt model loading...")
        self.device = self.select_device()
        logger.info(f"ConvNeXt inference device selected: {self.device}")

        self.transform = self.get_transforms()

        num_classes = len(self.class_names)
        arch = settings.MODEL_ARCH.lower()

        try:
          if arch == "convnext_small":
              model = models.convnext_small(weights=None)
              model.classifier[2] = torch.nn.Linear(model.classifier[2].in_features, num_classes)
          elif arch == "convnext_base":
              model = models.convnext_base(weights=None)
              model.classifier[2] = torch.nn.Linear(model.classifier[2].in_features, num_classes)
          else:
              # Default: convnext_tiny
              model = models.convnext_tiny(weights=None)
              model.classifier[2] = torch.nn.Linear(model.classifier[2].in_features, num_classes)

          if settings.MODEL_CHECKPOINT and os.path.exists(settings.MODEL_CHECKPOINT):
              logger.info(f"Loading checkpoint weights from: {settings.MODEL_CHECKPOINT}")
              state_dict = torch.load(settings.MODEL_CHECKPOINT, map_location=self.device)
              if "state_dict" in state_dict:
                  state_dict = state_dict["state_dict"]
              model.load_state_dict(state_dict)
          else:
              logger.info("No explicit checkpoint file path specified or found. Using pretrained ConvNeXt weights...")
              # Load pretrained ConvNeXt-Tiny weights from torchvision
              pretrained_model = models.convnext_tiny(weights=models.ConvNeXt_Tiny_Weights.DEFAULT)
              model.features = pretrained_model.features
              model.avgpool = pretrained_model.avgpool

          model.to(self.device)
          model.eval()

          self.model = model
          self.is_loaded = True
          logger.info(f"ConvNeXt model loaded successfully ({arch}, {num_classes} output classes, device: {self.device})")
        except Exception as e:
          logger.error(f"Failed to load ConvNeXt model: {e}", exc_info=True)
          raise RuntimeError(f"ConvNeXt model startup loading failed: {e}")

model_container = ModelContainer()
