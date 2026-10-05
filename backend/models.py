"""Validation models used by the API routes."""

from typing import Annotated, Literal, Optional

from pydantic import BaseModel, BeforeValidator, EmailStr, Field

PyObjectId = Annotated[str, BeforeValidator(str)]


class RegisterInput(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["student", "teacher"] = "student"


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class GradeInput(BaseModel):
    student_id: str = Field(min_length=1, max_length=100)
    course: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=160)
    score: float = Field(ge=0)
    max_score: float = Field(default=20.0, gt=0, le=100)
    coefficient: float = Field(default=1.0, gt=0, le=20)


class MessageInput(BaseModel):
    recipient_id: str = Field(min_length=1, max_length=100)
    content: str = Field(min_length=1, max_length=5000)


class CheckoutInput(BaseModel):
    fee_id: str = Field(min_length=1, max_length=100)
    origin_url: str = Field(min_length=1, max_length=500)


class BorrowInput(BaseModel):
    book_id: str = Field(min_length=1, max_length=100)


class CourseInput(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(min_length=1, max_length=5000)
    subject: str = Field(min_length=1, max_length=120)
    file_url: Optional[str] = Field(default=None, max_length=1000)
