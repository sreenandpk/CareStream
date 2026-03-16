from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):

    response = exception_handler(exc, context)

    # DRF handled error (400, 401, 403, 404)
    if response is not None:

        message = "Error"

        if isinstance(response.data, dict):

            if "detail" in response.data:
                message = response.data["detail"]

            else:
                # take first error message
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

    # Unhandled error (500)
    return Response(
        {
            "success": False,
            "message": "Internal server error",
            "errors": str(exc),
            "status_code": 500,
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )