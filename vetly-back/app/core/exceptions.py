"""
Custom exceptions for the Vetly API
"""

from fastapi import HTTPException, status


class VetlyException(Exception):
    """Base exception for Vetly application"""
    pass


class NotFoundException(VetlyException):
    """Raised when a resource is not found"""
    def __init__(self, resource: str, resource_id: str):
        self.resource = resource
        self.resource_id = resource_id
        self.message = f"{resource} with id '{resource_id}' not found"
        super().__init__(self.message)


class UnauthorizedException(VetlyException):
    """Raised when user is not authorized"""
    def __init__(self, message: str = "Not authorized"):
        self.message = message
        super().__init__(self.message)


class ValidationException(VetlyException):
    """Raised when validation fails"""
    def __init__(self, field: str, message: str):
        self.field = field
        self.message = f"Validation error for '{field}': {message}"
        super().__init__(self.message)


class DuplicateException(VetlyException):
    """Raised when trying to create a duplicate resource"""
    def __init__(self, resource: str, field: str, value: str):
        self.resource = resource
        self.field = field
        self.value = value
        self.message = f"{resource} with {field} '{value}' already exists"
        super().__init__(self.message)


def not_found_exception(resource: str, resource_id: str) -> HTTPException:
    """Create a 404 HTTP exception"""
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource} with id '{resource_id}' not found"
    )


def unauthorized_exception(message: str = "Not authorized") -> HTTPException:
    """Create a 401 HTTP exception"""
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=message,
        headers={"WWW-Authenticate": "Bearer"},
    )


def forbidden_exception(message: str = "Forbidden") -> HTTPException:
    """Create a 403 HTTP exception"""
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=message
    )


def validation_exception(field: str, message: str) -> HTTPException:
    """Create a 422 HTTP exception"""
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=f"Validation error for '{field}': {message}"
    )


def duplicate_exception(resource: str, field: str, value: str) -> HTTPException:
    """Create a 409 HTTP exception"""
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=f"{resource} with {field} '{value}' already exists"
    )
