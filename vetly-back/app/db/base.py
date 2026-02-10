"""
Import all models here for Alembic migrations
This ensures all models are registered with SQLAlchemy
"""

from app.db.base_class import Base, BaseModel  # noqa

# Import all models
from app.models.pet_owner import PetOwner  # noqa
from app.models.vet import Vet  # noqa
from app.models.pet import Pet  # noqa
from app.models.medical_event import MedicalEvent  # noqa
from app.models.weight_history import WeightHistory  # noqa
from app.models.medication import Medication  # noqa
from app.models.appointment import Appointment  # noqa
from app.models.review import Review  # noqa
from app.models.notification import Notification  # noqa
from app.models.blog_post import BlogPost  # noqa
