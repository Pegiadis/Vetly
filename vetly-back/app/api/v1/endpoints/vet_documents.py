"""
Vet Document Generation API endpoints
Provides PDF downloads for prescriptions, medical records, and vaccination certificates
"""

from uuid import UUID
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_vet
from app.db.base import Vet
from app.services.document import DocumentService

router = APIRouter()


@router.get("/prescription/{appointment_id}", summary="Λήψη ιατρικής συνταγής PDF")
def download_prescription(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    current_vet: Vet = Depends(get_current_vet),
):
    """
    Generate and download a prescription PDF for a completed appointment.

    The appointment must belong to the authenticated vet and have status 'completed'.
    """
    pdf_buffer = DocumentService.generate_prescription_pdf(db, appointment_id, current_vet.id)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=prescription_{appointment_id}.pdf"
        },
    )


@router.get("/medical-record/{pet_id}", summary="Λήψη ιατρικού ιστορικού PDF")
def download_medical_record(
    pet_id: UUID,
    db: Session = Depends(get_db),
    current_vet: Vet = Depends(get_current_vet),
):
    """
    Generate and download a complete medical history PDF for a pet.

    The vet must have had at least one appointment with this pet.
    """
    pdf_buffer = DocumentService.generate_medical_record_pdf(db, pet_id, current_vet.id)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=medical_record_{pet_id}.pdf"
        },
    )


@router.get("/vaccination-certificate/{pet_id}", summary="Λήψη πιστοποιητικού εμβολιασμού PDF")
def download_vaccination_certificate(
    pet_id: UUID,
    db: Session = Depends(get_db),
    current_vet: Vet = Depends(get_current_vet),
):
    """
    Generate and download a vaccination certificate PDF for a pet.

    Includes all medical events categorised as vaccinations.
    The vet must have had at least one appointment with this pet.
    """
    pdf_buffer = DocumentService.generate_vaccination_certificate_pdf(db, pet_id, current_vet.id)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=vaccination_certificate_{pet_id}.pdf"
        },
    )
