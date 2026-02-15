"""
File upload endpoints for photos
"""

from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.deps import get_db, get_current_vet, get_current_pet_owner
from app.db.base import Vet, PetOwner, Pet
from app.utils.upload import save_upload, delete_upload

router = APIRouter()


class UploadResponse(BaseModel):
    url: str


@router.post("/vet/photo", response_model=UploadResponse)
async def upload_vet_photo(
    file: UploadFile = File(...),
    current_vet: Vet = Depends(get_current_vet),
    db: Session = Depends(get_db),
) -> UploadResponse:
    """Upload a profile photo for the authenticated vet. Max 5MB, JPG/PNG."""
    delete_upload(current_vet.image_url)
    url = await save_upload(file, prefix="vet", max_size_bytes=5 * 1024 * 1024)
    current_vet.image_url = url
    db.commit()
    return UploadResponse(url=url)


@router.post("/owner/photo", response_model=UploadResponse)
async def upload_owner_photo(
    file: UploadFile = File(...),
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> UploadResponse:
    """Upload a profile photo for the authenticated pet owner. Max 5MB, JPG/PNG."""
    delete_upload(current_owner.image_url)
    url = await save_upload(file, prefix="owner", max_size_bytes=5 * 1024 * 1024)
    current_owner.image_url = url
    db.commit()
    return UploadResponse(url=url)


@router.post("/pet/{pet_id}/photo", response_model=UploadResponse)
async def upload_pet_photo(
    pet_id: UUID,
    file: UploadFile = File(...),
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> UploadResponse:
    """Upload a photo for a pet. Max 5MB, JPG/PNG. Pet must belong to the owner."""
    pet = db.scalar(
        select(Pet).where(Pet.id == pet_id, Pet.pet_owner_id == current_owner.id)
    )
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found",
        )
    delete_upload(pet.image_url)
    url = await save_upload(file, prefix="pet", max_size_bytes=5 * 1024 * 1024)
    pet.image_url = url
    db.commit()
    return UploadResponse(url=url)


@router.post("/pet/{pet_id}/cover", response_model=UploadResponse)
async def upload_pet_cover(
    pet_id: UUID,
    file: UploadFile = File(...),
    current_owner: PetOwner = Depends(get_current_pet_owner),
    db: Session = Depends(get_db),
) -> UploadResponse:
    """Upload a cover photo for a pet. Max 5MB, JPG/PNG. Pet must belong to the owner."""
    pet = db.scalar(
        select(Pet).where(Pet.id == pet_id, Pet.pet_owner_id == current_owner.id)
    )
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found",
        )
    delete_upload(pet.cover_image_url)
    url = await save_upload(file, prefix="pet_cover", max_size_bytes=5 * 1024 * 1024)
    pet.cover_image_url = url
    db.commit()
    return UploadResponse(url=url)
