from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request) -> Response:
        return Response(
            {
                "status": "ok",
                "version": getattr(settings, "APP_VERSION", "0.1.0"),
            }
        )
