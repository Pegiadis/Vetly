"""
Blog Post model
"""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import BaseModel


class BlogPost(BaseModel):
    """
    Blog Post model
    Represents educational blog content
    """
    
    __tablename__ = "blog_posts"
    
    # Content
    title = Column(String(255), nullable=False)
    excerpt = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    
    # Metadata
    author = Column(String(255), nullable=False)  # Author name for non-vet authors (admin posts)
    author_id = Column(
        UUID(as_uuid=True),
        ForeignKey("vets.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    image_url = Column(String(500), nullable=True)
    category = Column(String(100), nullable=False, index=True)
    read_time = Column(String(50), nullable=True)  # e.g., "5 min read"

    # Publishing
    published_at = Column(DateTime, nullable=False, index=True)

    # Relationships
    author_vet = relationship("Vet", back_populates="blog_posts")

    def __repr__(self):
        return f"<BlogPost(id={self.id}, title={self.title}, category={self.category})>"
