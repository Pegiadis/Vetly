"""
Document generation service - PDF prescriptions, medical records, vaccination certificates
"""

from io import BytesIO
from datetime import date, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.appointment import Appointment, AppointmentStatus
from app.models.medical_event import MedicalEvent
from app.models.medication import Medication
from app.models.pet import Pet
from app.models.vet import Vet
from app.models.weight_history import WeightHistory
from app.services.scheduling import ATHENS


# ── ReportLab imports ─────────────────────────────────────────────────────────
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
    HRFlowable,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import logging
import os
from xml.sax.saxutils import escape

# ── Colours ───────────────────────────────────────────────────────────────────
TEAL = colors.HexColor("#0d9488")
TEAL_LIGHT = colors.HexColor("#ccfbf1")
GREY_LIGHT = colors.HexColor("#f9fafb")
GREY_MID = colors.HexColor("#e5e7eb")
DARK = colors.HexColor("#111827")
TEXT_GREY = colors.HexColor("#6b7280")

# ── Font registration (Greek support) ─────────────────────────────────────────
logger = logging.getLogger(__name__)
_FONT_REGISTERED = False

# (regular, bold) pairs, first match wins. The Docker image installs DejaVu
# (fonts-dejavu-core); the others cover development on Windows and macOS.
_FONT_CANDIDATES = [
    ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ("/usr/share/fonts/dejavu/DejaVuSans.ttf", "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf"),
    (os.path.join(os.path.dirname(__file__), "..", "..", "fonts", "DejaVuSans.ttf"),
     os.path.join(os.path.dirname(__file__), "..", "..", "fonts", "DejaVuSans-Bold.ttf")),
    ("C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/arialbd.ttf"),
    ("/System/Library/Fonts/Supplemental/Arial.ttf", "/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
    ("/Library/Fonts/Arial.ttf", "/Library/Fonts/Arial Bold.ttf"),
]


def _ensure_font() -> str:
    """Register a font that has Greek glyphs and return its family name.

    The standard PDF fonts (Helvetica) have no Greek, so a document built with them is
    unreadable. Without a suitable font the request fails instead of producing that.
    """
    global _FONT_REGISTERED
    if _FONT_REGISTERED:
        return "DejaVu"
    for regular, bold in _FONT_CANDIDATES:
        if not os.path.isfile(regular):
            continue
        try:
            pdfmetrics.registerFont(TTFont("DejaVu", regular))
            pdfmetrics.registerFont(TTFont("DejaVu-Bold", bold if os.path.isfile(bold) else regular))
            pdfmetrics.registerFontFamily("DejaVu", normal="DejaVu", bold="DejaVu-Bold", italic="DejaVu", boldItalic="DejaVu-Bold")
            _FONT_REGISTERED = True
            return "DejaVu"
        except Exception:
            logger.exception("Could not register PDF font %s", regular)
    logger.error("No Greek-capable font found for PDF documents (install fonts-dejavu-core)")
    raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Η δημιουργία εγγράφων δεν είναι διαθέσιμη αυτή τη στιγμή.")


def _x(value) -> str:
    """Escape text typed by people before it goes into ReportLab's paragraph markup."""
    return escape("" if value is None else str(value))


SPECIES_GR = {"Dog": "Σκύλος", "Cat": "Γάτα", "Bird": "Πτηνό", "Rabbit": "Κουνέλι", "Hamster": "Χάμστερ",
              "Fish": "Ψάρι", "Reptile": "Ερπετό", "Other": "Άλλο"}
GENDER_GR = {"Male": "Αρσενικό", "Female": "Θηλυκό"}


def _species(pet) -> str:
    return SPECIES_GR.get(pet.type.value, pet.type.value) if pet.type else "-"


def _gender(pet) -> str:
    return GENDER_GR.get(pet.gender.value, pet.gender.value) if pet.gender else "-"


# ── Helper: build paragraph styles ────────────────────────────────────────────
def _make_styles(font: str):
    base = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "DocTitle",
        fontName=f"{font}-Bold" if font != "Helvetica" else "Helvetica-Bold",
        fontSize=18,
        textColor=TEAL,
        spaceAfter=4,
        leading=22,
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        fontName=font,
        fontSize=11,
        textColor=TEXT_GREY,
        spaceAfter=2,
    )
    section_style = ParagraphStyle(
        "Section",
        fontName=f"{font}-Bold" if font != "Helvetica" else "Helvetica-Bold",
        fontSize=11,
        textColor=TEAL,
        spaceBefore=10,
        spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "Body",
        fontName=font,
        fontSize=10,
        textColor=DARK,
        leading=14,
    )
    small_style = ParagraphStyle(
        "Small",
        fontName=font,
        fontSize=8,
        textColor=TEXT_GREY,
        leading=12,
    )
    footer_style = ParagraphStyle(
        "Footer",
        fontName=font,
        fontSize=8,
        textColor=TEXT_GREY,
        alignment=1,  # center
    )
    return {
        "title": title_style,
        "subtitle": subtitle_style,
        "section": section_style,
        "body": body_style,
        "small": small_style,
        "footer": footer_style,
    }


# ── Helper: standard table style ─────────────────────────────────────────────
def _table_style(font: str, has_header: bool = True) -> TableStyle:
    bold = f"{font}-Bold" if font != "Helvetica" else "Helvetica-Bold"
    commands = [
        ("FONTNAME", (0, 0), (-1, -1), font),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUND", (0, 0), (-1, -1), [colors.white, GREY_LIGHT]),
        ("GRID", (0, 0), (-1, -1), 0.5, GREY_MID),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]
    if has_header:
        commands += [
            ("BACKGROUND", (0, 0), (-1, 0), TEAL),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), bold),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
        ]
    return TableStyle(commands)


# ── Helper: data table whose cells wrap inside their column ────────────────────
def _data_table(rows: list[list], col_widths, font: str) -> Table:
    bold = f"{font}-Bold"
    head = ParagraphStyle("CellHead", fontName=bold, fontSize=9, textColor=colors.white, leading=11)
    cell = ParagraphStyle("Cell", fontName=font, fontSize=9, textColor=DARK, leading=11)
    wrapped = [[Paragraph(_x(value), head if index == 0 else cell) for value in row] for index, row in enumerate(rows)]
    table = Table(wrapped, colWidths=col_widths, repeatRows=1)
    table.setStyle(_table_style(font))
    return table


# ── Helper: info grid (label / value pairs) ───────────────────────────────────
def _info_table(rows: list[tuple[str, str]], font: str, col_widths=None) -> Table:
    bold = f"{font}-Bold" if font != "Helvetica" else "Helvetica-Bold"
    if col_widths is None:
        col_widths = [5 * cm, 12 * cm]
    value_style = ParagraphStyle("InfoValue", fontName=font, fontSize=9, textColor=DARK, leading=12)
    rows = [(label, Paragraph(_x(value), value_style)) for label, value in rows]
    table = Table(rows, colWidths=col_widths)
    table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), bold),
                ("FONTNAME", (1, 0), (1, -1), font),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("TEXTCOLOR", (0, 0), (0, -1), TEXT_GREY),
                ("TEXTCOLOR", (1, 0), (1, -1), DARK),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return table


# ── Helper: document header block ────────────────────────────────────────────
def _build_header(title: str, subtitle: str, vet: Vet, styles: dict) -> list:
    elements = []

    # Logo / branding row (simple text-based)
    header_data = [
        [
            Paragraph(f"<b>Vetly</b>", ParagraphStyle(
                "Logo",
                fontName=styles["title"].fontName,
                fontSize=20,
                textColor=TEAL,
            )),
            Paragraph(
                f"<b>{title}</b>",
                ParagraphStyle(
                    "HeaderTitle",
                    fontName=styles["title"].fontName,
                    fontSize=14,
                    textColor=DARK,
                    alignment=2,  # right
                ),
            ),
        ]
    ]
    header_table = Table(header_data, colWidths=[9 * cm, 9 * cm])
    header_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    elements.append(header_table)
    elements.append(HRFlowable(width="100%", thickness=2, color=TEAL, spaceAfter=8))

    if subtitle:
        elements.append(Paragraph(subtitle, styles["subtitle"]))
        elements.append(Spacer(1, 0.3 * cm))

    return elements


# ── Helper: document footer ───────────────────────────────────────────────────
def _build_footer(vet: Vet, doc_date: date, styles: dict) -> list:
    elements = []
    elements.append(Spacer(1, 1 * cm))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=GREY_MID))
    elements.append(Spacer(1, 0.3 * cm))

    sig_data = [
        [
            Paragraph("Υπογραφή Κτηνιάτρου", styles["small"]),
            Paragraph(f"Ημερομηνία: {doc_date.strftime('%d/%m/%Y')}", styles["small"]),
        ],
        [
            Paragraph(f"<b>{_x(vet.name)}</b>", styles["body"]),
            Paragraph("", styles["small"]),
        ],
        [
            Paragraph(f"ΑΜ: {_x(vet.license_number)}", styles["small"]),
            Paragraph("", styles["small"]),
        ],
    ]
    sig_table = Table(sig_data, colWidths=[9 * cm, 9 * cm])
    sig_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    elements.append(sig_table)
    elements.append(Spacer(1, 0.4 * cm))
    elements.append(
        Paragraph(
            "Δημιουργήθηκε από το Vetly - Πλατφόρμα Διαχείρισης Κτηνιατρείου",
            styles["footer"],
        )
    )
    return elements


# ═══════════════════════════════════════════════════════════════════════════════
# DocumentService
# ═══════════════════════════════════════════════════════════════════════════════


class DocumentService:
    """Service for generating veterinary PDF documents"""

    # ── Prescription ──────────────────────────────────────────────────────────

    @staticmethod
    def generate_prescription_pdf(db: Session, appointment_id: UUID, vet_id: UUID) -> BytesIO:
        """Generate a prescription PDF for a completed appointment."""
        font = _ensure_font()
        styles = _make_styles(font)

        # Fetch appointment with all relations
        appointment = db.scalar(
            select(Appointment)
            .options(
                joinedload(Appointment.vet),
                joinedload(Appointment.pet).joinedload(Pet.owner),
                joinedload(Appointment.pet_owner),
            )
            .where(
                Appointment.id == appointment_id,
                Appointment.vet_id == vet_id,
            )
        )
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ραντεβού δεν βρέθηκε",
            )
        if appointment.status != AppointmentStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Η συνταγή είναι διαθέσιμη μόνο για ολοκληρωμένες εξετάσεις",
            )

        vet = appointment.vet
        pet = appointment.pet
        owner = appointment.pet_owner
        exam_date = appointment.scheduled_at.date()

        # Medications created around the appointment date (±1 day)
        meds = db.scalars(
            select(Medication)
            .where(
                Medication.pet_id == pet.id,
                Medication.start_date >= exam_date - timedelta(days=1),
                Medication.start_date <= exam_date + timedelta(days=1),
            )
            .order_by(Medication.start_date)
        ).all()

        # Medical event on / around the appointment date
        med_events = db.scalars(
            select(MedicalEvent)
            .where(
                MedicalEvent.pet_id == pet.id,
                MedicalEvent.vet_id == vet_id,
                MedicalEvent.date >= exam_date - timedelta(days=1),
                MedicalEvent.date <= exam_date + timedelta(days=1),
            )
            .order_by(MedicalEvent.date.desc())
        ).all()

        diagnosis = (
            med_events[0].title if med_events else (appointment.notes or "Δεν αναφέρεται διάγνωση")
        )
        exam_notes = med_events[0].notes if med_events else appointment.notes

        # ── Build PDF ────────────────────────────────────────────────────────
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=2 * cm,
            rightMargin=2 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
        )
        elements = []

        elements += _build_header("ΙΑΤΡΙΚΗ ΣΥΝΤΑΓΗ", "", vet, styles)

        # Vet info
        elements.append(Paragraph("Στοιχεία Κτηνιάτρου", styles["section"]))
        elements.append(
            _info_table(
                [
                    ("Ονοματεπώνυμο:", vet.name),
                    ("Ειδικότητα:", vet.specialty),
                    ("ΑΜ Κτηνιάτρου:", vet.license_number),
                    ("Τηλέφωνο:", vet.phone),
                    ("Διεύθυνση:", vet.address),
                ],
                font,
            )
        )

        elements.append(Spacer(1, 0.4 * cm))

        # Pet + owner info
        elements.append(Paragraph("Στοιχεία Ζώου", styles["section"]))
        pet_age_str = f"{pet.age} {'έτος' if pet.age == 1 else 'έτη'}"
        elements.append(
            _info_table(
                [
                    ("Όνομα:", pet.name),
                    ("Είδος:", _species(pet)),
                    ("Φυλή:", pet.breed),
                    ("Ηλικία:", pet_age_str),
                    ("Βάρος:", f"{pet.weight} kg"),
                    ("Αρ. Μικροτσίπ:", pet.chip_number or "-"),
                    ("Ιδιοκτήτης:", owner.name if owner else "-"),
                    ("Τηλέφωνο Ιδιοκτήτη:", owner.phone or "-" if owner else "-"),
                ],
                font,
            )
        )

        elements.append(Spacer(1, 0.4 * cm))

        # Diagnosis
        elements.append(Paragraph("Διάγνωση", styles["section"]))
        elements.append(Paragraph(f"<b>{_x(diagnosis)}</b>", styles["body"]))
        if exam_notes:
            elements.append(Spacer(1, 0.2 * cm))
            elements.append(Paragraph(_x(exam_notes).replace(chr(10), "<br/>"), styles["body"]))

        elements.append(Spacer(1, 0.4 * cm))

        # Medications
        elements.append(Paragraph("Φαρμακευτική Αγωγή", styles["section"]))
        if meds:
            bold = f"{font}-Bold" if font != "Helvetica" else "Helvetica-Bold"
            med_rows = [["Φάρμακο", "Δόση", "Συχνότητα", "Από", "Έως", "Σημειώσεις"]]
            for m in meds:
                freq_map = {"daily": "Καθημερινά", "weekly": "Εβδομαδιαία", "once": "Εφάπαξ"}
                freq_gr = freq_map.get(m.frequency.value if m.frequency else "", m.frequency.value if m.frequency else "-")
                med_rows.append(
                    [
                        m.name,
                        m.dosage,
                        freq_gr,
                        m.start_date.strftime("%d/%m/%Y") if m.start_date else "-",
                        m.end_date.strftime("%d/%m/%Y") if m.end_date else "Αορίστου",
                        m.notes or "-",
                    ]
                )
            col_widths = [3.5 * cm, 2 * cm, 2.5 * cm, 2 * cm, 2 * cm, 5 * cm]
            med_table = _data_table(med_rows, col_widths, font)
            elements.append(med_table)
        else:
            elements.append(Paragraph("Δεν καταγράφηκε φαρμακευτική αγωγή.", styles["body"]))

        elements += _build_footer(vet, exam_date, styles)

        doc.build(elements)
        buffer.seek(0)
        return buffer

    # ── Medical Record ────────────────────────────────────────────────────────

    @staticmethod
    def generate_medical_record_pdf(db: Session, pet_id: UUID, vet_id: UUID) -> BytesIO:
        """Generate a complete medical history PDF for a pet."""
        font = _ensure_font()
        styles = _make_styles(font)

        # Verify vet has had an appointment with this pet's owner
        vet = db.get(Vet, vet_id)
        if not vet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Κτηνίατρος δεν βρέθηκε")

        pet = db.scalar(
            select(Pet)
            .options(
                joinedload(Pet.owner),
                joinedload(Pet.medical_events).joinedload(MedicalEvent.vet),
                joinedload(Pet.medications),
                joinedload(Pet.weight_history),
            )
            .where(Pet.id == pet_id, Pet.deleted_at.is_(None))
        )
        if not pet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ζώο δεν βρέθηκε")

        # Check vet has treated this pet (has an appointment)
        has_access = db.scalar(
            select(Appointment.id)
            .where(
                Appointment.pet_id == pet_id,
                Appointment.vet_id == vet_id,
            )
            .limit(1)
        )
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Δεν έχετε πρόσβαση στο ιατρικό ιστορικό αυτού του ζώου",
            )

        owner = pet.owner
        today = datetime.now(ATHENS).date()

        # ── Build PDF ────────────────────────────────────────────────────────
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=2 * cm,
            rightMargin=2 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
        )
        elements = []

        elements += _build_header(
            "ΙΑΤΡΙΚΟ ΙΣΤΟΡΙΚΟ",
            f"Εκδόθηκε: {today.strftime('%d/%m/%Y')}",
            vet,
            styles,
        )

        # Pet details
        elements.append(Paragraph("Στοιχεία Ζώου", styles["section"]))
        pet_age_str = f"{pet.age} {'έτος' if pet.age == 1 else 'έτη'}"
        elements.append(
            _info_table(
                [
                    ("Όνομα:", pet.name),
                    ("Είδος:", _species(pet)),
                    ("Φυλή:", pet.breed),
                    ("Φύλο:", _gender(pet)),
                    ("Ηλικία:", pet_age_str),
                    ("Βάρος:", f"{pet.weight} kg"),
                    ("Αρ. Μικροτσίπ:", pet.chip_number or "-"),
                    ("Ιδιοκτήτης:", owner.name if owner else "-"),
                    ("Τηλέφωνο Ιδιοκτήτη:", owner.phone or "-" if owner else "-"),
                ],
                font,
            )
        )

        elements.append(Spacer(1, 0.5 * cm))

        # Medical events table
        elements.append(Paragraph("Ιατρικά Συμβάντα", styles["section"]))
        events = sorted(pet.medical_events, key=lambda e: e.date, reverse=True)
        if events:
            ev_rows = [["Ημερομηνία", "Τύπος", "Τίτλος", "Σημειώσεις", "Κτηνίατρος"]]
            for ev in events:
                ev_rows.append(
                    [
                        ev.date.strftime("%d/%m/%Y"),
                        ev.event_type,
                        ev.title,
                        ev.notes or "-",
                        ev.vet.name if ev.vet else "-",
                    ]
                )
            col_widths = [2.3 * cm, 3.3 * cm, 3.9 * cm, 4.3 * cm, 3.2 * cm]
            ev_table = _data_table(ev_rows, col_widths, font)
            elements.append(ev_table)
        else:
            elements.append(Paragraph("Δεν υπάρχουν καταγεγραμμένα ιατρικά συμβάντα.", styles["body"]))

        elements.append(Spacer(1, 0.5 * cm))

        # Current medications table
        elements.append(Paragraph("Τρέχουσα Φαρμακευτική Αγωγή", styles["section"]))
        active_meds = [m for m in pet.medications if m.is_active]
        if active_meds:
            med_rows = [["Φάρμακο", "Δόση", "Συχνότητα", "Έναρξη", "Λήξη"]]
            for m in active_meds:
                freq_map = {"daily": "Καθημερινά", "weekly": "Εβδομαδιαία", "once": "Εφάπαξ"}
                freq_gr = freq_map.get(m.frequency.value if m.frequency else "", m.frequency.value if m.frequency else "-")
                med_rows.append(
                    [
                        m.name,
                        m.dosage,
                        freq_gr,
                        m.start_date.strftime("%d/%m/%Y") if m.start_date else "-",
                        m.end_date.strftime("%d/%m/%Y") if m.end_date else "Αορίστου",
                    ]
                )
            col_widths = [4.5 * cm, 2.5 * cm, 3 * cm, 2.5 * cm, 2.5 * cm]
            med_table = _data_table(med_rows, col_widths, font)
            elements.append(med_table)
        else:
            elements.append(Paragraph("Δεν υπάρχει ενεργή φαρμακευτική αγωγή.", styles["body"]))

        elements.append(Spacer(1, 0.5 * cm))

        # Weight history table
        elements.append(Paragraph("Ιστορικό Βάρους", styles["section"]))
        weight_records = sorted(pet.weight_history, key=lambda w: w.recorded_at, reverse=True)
        if weight_records:
            wt_rows = [["Ημερομηνία", "Βάρος (kg)"]]
            for w in weight_records:
                wt_rows.append(
                    [
                        w.recorded_at.strftime("%d/%m/%Y"),
                        f"{w.weight:.2f}",
                    ]
                )
            col_widths = [5 * cm, 5 * cm]
            wt_table = _data_table(wt_rows, col_widths, font)
            elements.append(wt_table)
        else:
            elements.append(Paragraph("Δεν υπάρχει ιστορικό βάρους.", styles["body"]))

        elements += _build_footer(vet, today, styles)

        doc.build(elements)
        buffer.seek(0)
        return buffer

    # ── Vaccination Certificate ───────────────────────────────────────────────

    @staticmethod
    def generate_vaccination_certificate_pdf(db: Session, pet_id: UUID, vet_id: UUID) -> BytesIO:
        """Generate a vaccination certificate PDF for a pet."""
        font = _ensure_font()
        styles = _make_styles(font)

        vet = db.get(Vet, vet_id)
        if not vet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Κτηνίατρος δεν βρέθηκε")

        pet = db.scalar(
            select(Pet)
            .options(
                joinedload(Pet.owner),
                joinedload(Pet.medical_events).joinedload(MedicalEvent.vet),
            )
            .where(Pet.id == pet_id, Pet.deleted_at.is_(None))
        )
        if not pet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ζώο δεν βρέθηκε")

        # Check vet has access (has appointment with this pet)
        has_access = db.scalar(
            select(Appointment.id)
            .where(
                Appointment.pet_id == pet_id,
                Appointment.vet_id == vet_id,
            )
            .limit(1)
        )
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Δεν έχετε πρόσβαση σε αυτό το ζώο",
            )

        # Filter vaccination events
        vaccinations = [
            ev
            for ev in pet.medical_events
            if "vaccination" in ev.event_type.lower() or "εμβολ" in ev.event_type.lower()
        ]
        vaccinations = sorted(vaccinations, key=lambda e: e.date)

        owner = pet.owner
        today = datetime.now(ATHENS).date()

        # ── Build PDF ────────────────────────────────────────────────────────
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=2 * cm,
            rightMargin=2 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
        )
        elements = []

        elements += _build_header(
            "ΠΙΣΤΟΠΟΙΗΤΙΚΟ ΕΜΒΟΛΙΑΣΜΟΥ",
            f"Εκδόθηκε: {today.strftime('%d/%m/%Y')}",
            vet,
            styles,
        )

        # Pet details
        elements.append(Paragraph("Στοιχεία Ζώου", styles["section"]))
        elements.append(
            _info_table(
                [
                    ("Όνομα:", pet.name),
                    ("Είδος:", _species(pet)),
                    ("Φυλή:", pet.breed),
                    ("Αρ. Μικροτσίπ:", pet.chip_number or "-"),
                    ("Ιδιοκτήτης:", owner.name if owner else "-"),
                ],
                font,
            )
        )

        elements.append(Spacer(1, 0.5 * cm))

        # Vaccinations table
        elements.append(Paragraph("Εμβολιασμοί", styles["section"]))
        if vaccinations:
            vac_rows = [["Ημερομηνία", "Τύπος Εμβολιασμού", "Σημειώσεις", "Κτηνίατρος"]]
            for ev in vaccinations:
                vac_rows.append(
                    [
                        ev.date.strftime("%d/%m/%Y"),
                        ev.title,
                        ev.notes or "-",
                        ev.vet.name if ev.vet else "-",
                    ]
                )
            col_widths = [2.5 * cm, 5 * cm, 6 * cm, 3.5 * cm]
            vac_table = _data_table(vac_rows, col_widths, font)
            elements.append(vac_table)
        else:
            elements.append(Paragraph("Δεν υπάρχουν καταγεγραμμένοι εμβολιασμοί.", styles["body"]))

        elements.append(Spacer(1, 0.8 * cm))

        # Certification text
        elements.append(HRFlowable(width="100%", thickness=0.5, color=GREY_MID))
        elements.append(Spacer(1, 0.4 * cm))
        cert_text = (
            f"Βεβαιώνεται ότι το ζώο <b>{_x(pet.name)}</b> ({_x(_species(pet))} - {_x(pet.breed)}), "
            f"που ανήκει στον/ην <b>{_x(owner.name) if owner else '-'}</b>, "
            f"έχει υποβληθεί στους εμβολιασμούς που αναγράφονται στο παρόν πιστοποιητικό, "
            f"σύμφωνα με τα στοιχεία του ιατρικού φακέλου."
        )
        elements.append(Paragraph(cert_text, styles["body"]))

        elements += _build_footer(vet, today, styles)

        doc.build(elements)
        buffer.seek(0)
        return buffer
