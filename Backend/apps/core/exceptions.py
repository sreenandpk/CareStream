from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django_ratelimit.exceptions import Ratelimited

def custom_exception_handler(exc, context):
    # Handle django-ratelimit's Ratelimited exception
    if isinstance(exc, Ratelimited):
        return Response(
            {
                "success": False,
                "message": "Too many login attempts. Please try again in a few minutes for security reasons.",
                "errors": {"detail": "Rate limit exceeded. Too many attempts from this IP."},
                "status_code": 429,
            },
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    response = exception_handler(exc, context)
    if response is not None:
        message = "Error"
        if isinstance(response.data, dict):
            if "detail" in response.data:
                message = response.data["detail"]
            else:
                first_key = list(response.data.keys())[0]
                message = response.data[first_key][0]
        return Response(
            {
                "success": False,
                "message": message,
                "errors": response.data,
                "status_code": response.status_code,
            },
            status=response.status_code,
        )
    return Response(
        {
            "success": False,
            "message": "Internal server error",
            "errors": str(exc),
            "status_code": 500,
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )