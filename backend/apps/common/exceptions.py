import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from rest_framework import exceptions as drf_exceptions
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)

ERROR_CODE_MAP = {
    drf_exceptions.NotAuthenticated: "not_authenticated",
    drf_exceptions.AuthenticationFailed: "authentication_failed",
    drf_exceptions.PermissionDenied: "permission_denied",
    drf_exceptions.NotFound: "not_found",
    drf_exceptions.MethodNotAllowed: "method_not_allowed",
    drf_exceptions.NotAcceptable: "not_acceptable",
    drf_exceptions.UnsupportedMediaType: "unsupported_media_type",
    drf_exceptions.Throttled: "throttled",
    drf_exceptions.ParseError: "parse_error",
    drf_exceptions.ValidationError: "validation_error",
    Http404: "not_found",
}


def _resolve_code(exc: Exception) -> str:
    for exc_type, code in ERROR_CODE_MAP.items():
        if isinstance(exc, exc_type):
            return code
    return "server_error"


def _resolve_message(exc: Exception, default: str) -> str:
    detail = getattr(exc, "detail", None)
    if isinstance(detail, str):
        return detail
    if isinstance(detail, list) and detail:
        return str(detail[0])
    if isinstance(detail, dict):
        first_value = next(iter(detail.values()), None)
        if isinstance(first_value, list) and first_value:
            return str(first_value[0])
        if isinstance(first_value, str):
            return first_value
    return default


def api_exception_handler(exc, context):
    if isinstance(exc, DjangoValidationError):
        exc = drf_exceptions.ValidationError(detail=exc.message_dict if hasattr(exc, "message_dict") else exc.messages)

    response = drf_exception_handler(exc, context)

    if response is None:
        logger.exception("Unhandled exception in API view", extra={"path": context.get("request") and context["request"].path})
        return Response(
            {"code": "server_error", "message": "Internal server error"},
            status=500,
        )

    request = context.get("request") if context else None
    if isinstance(exc, (drf_exceptions.NotAuthenticated, drf_exceptions.AuthenticationFailed)):
        response.status_code = 401
    elif (
        isinstance(exc, drf_exceptions.PermissionDenied)
        and request is not None
        and getattr(request, "user", None) is not None
        and not request.user.is_authenticated
    ):
        response.status_code = 401
        exc = drf_exceptions.NotAuthenticated()

    code = _resolve_code(exc)
    message = _resolve_message(exc, default=response.status_text or "Error")

    payload = {"code": code, "message": message}
    if isinstance(response.data, (list, dict)):
        payload["details"] = response.data

    response.data = payload
    return response
