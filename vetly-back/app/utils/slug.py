"""
Slug generation utilities for SEO-friendly URLs
"""

import re


def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from a name.
    Handles Greek characters by transliterating them.
    """
    greek_to_latin = {
        'α': 'a', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z',
        'η': 'i', 'θ': 'th', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm',
        'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's',
        'ς': 's', 'τ': 't', 'υ': 'y', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps',
        'ω': 'o', 'ά': 'a', 'έ': 'e', 'ή': 'i', 'ί': 'i', 'ό': 'o',
        'ύ': 'y', 'ώ': 'o', 'ϊ': 'i', 'ϋ': 'y', 'ΐ': 'i', 'ΰ': 'y',
    }

    name_lower = name.lower()
    result = []
    for char in name_lower:
        if char in greek_to_latin:
            result.append(greek_to_latin[char])
        else:
            result.append(char)

    slug = ''.join(result)
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s-]+', '-', slug).strip('-')
    return slug


def generate_unique_slug(db, name: str, vet_id=None) -> str:
    """Generate a unique slug, appending a number suffix if a collision exists."""
    from app.models.vet import Vet
    base_slug = generate_slug(name)
    slug = base_slug
    counter = 1
    while True:
        query = db.query(Vet).filter(Vet.slug == slug)
        if vet_id:
            query = query.filter(Vet.id != vet_id)
        if not query.first():
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1
