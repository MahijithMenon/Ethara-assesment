from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError


class AppError(Exception):
    """Base application error mapped to an HTTP status code."""

    status_code: int = status.HTTP_400_BAD_REQUEST
    code: str = "app_error"

    def __init__(self, message: str, *, code: str | None = None):
        super().__init__(message)
        self.message = message
        if code:
            self.code = code


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "not_found"


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT
    code = "conflict"


class ValidationError(AppError):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    code = "validation_error"


class InsufficientStockError(AppError):
    status_code = status.HTTP_409_CONFLICT
    code = "insufficient_stock"


def _payload(message: str, code: str, **extra) -> dict:
    body = {"error": {"code": code, "message": message}}
    if extra:
        body["error"].update(extra)
    return body


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content=_payload(exc.message, exc.code),
        )

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(_: Request, exc: IntegrityError):
        # Surface unique-constraint violations as 409 without leaking SQL.
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=_payload(
                "Database integrity constraint violated (likely a duplicate value).",
                "integrity_error",
            ),
        )
