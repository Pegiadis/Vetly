"""
Blog Post model
"""

from sqlalchemy import Column, String, Text, DateTime

from app.models.base import BaseModel


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
    author = Column(String(255), nullable=False)
    image_url = Column(String(500), nullable=True)
    category = Column(String(100), nullable=False, index=True)
    read_time = Column(String(50), nullable=True)  # e.g., "5 min read"
    
    # Publishing
    published_at = Column(DateTime, nullable=False, index=True)
    
    def __repr__(self):
        return f"<BlogPost(id={self.id}, title={self.title}, category={self.category})>"
