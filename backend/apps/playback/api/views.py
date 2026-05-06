import logging
from typing import Iterator

import httpx
from django.core.exceptions import ImproperlyConfigured
from django.http import Http404, HttpResponse, StreamingHttpResponse
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Track
from apps.catalog.services import CatalogSyncService

from ..models import PlaybackState, PlayEvent
from .serializers import (
    PlaybackStateInputSerializer,
    PlaybackStateSerializer,
    PlayEventInputSerializer,
)

logger = logging.getLogger(__name__)

CHUNK_SIZE = 64 * 1024
UPSTREAM_TIMEOUT = httpx.Timeout(connect=5.0, read=30.0, write=5.0, pool=5.0)


class StreamView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request, track_id: int):
        track = Track.objects.filter(pk=track_id).first()
        if not track or track.is_unavailable:
            raise Http404("Track unavailable")

        try:
            upstream_url = CatalogSyncService().resolve_stream_url(track)
        except ImproperlyConfigured:
            return HttpResponse(status=503)

        if not upstream_url:
            return HttpResponse(status=410)

        return self._proxy(upstream_url, request)

    def head(self, request, track_id: int):
        return self.get(request, track_id)

    def _proxy(self, upstream_url: str, request) -> StreamingHttpResponse | HttpResponse:
        forward_headers = {}
        range_header = request.META.get("HTTP_RANGE")
        if range_header:
            forward_headers["Range"] = range_header

        client = httpx.Client(timeout=UPSTREAM_TIMEOUT, follow_redirects=True)
        try:
            upstream = client.send(
                client.build_request("GET", upstream_url, headers=forward_headers),
                stream=True,
            )
        except httpx.HTTPError as exc:
            client.close()
            logger.warning("Upstream stream failed: %s", exc)
            return HttpResponse(status=502)

        if upstream.status_code >= 400:
            status_code = upstream.status_code
            try:
                upstream.close()
            finally:
                client.close()
            return HttpResponse(status=status_code)

        def iterator() -> Iterator[bytes]:
            try:
                for chunk in upstream.iter_bytes(CHUNK_SIZE):
                    if chunk:
                        yield chunk
            finally:
                try:
                    upstream.close()
                finally:
                    client.close()

        response = StreamingHttpResponse(
            iterator(),
            status=upstream.status_code,
            content_type=upstream.headers.get("Content-Type", "audio/mpeg"),
        )
        response["Accept-Ranges"] = "bytes"
        response["Cache-Control"] = "private, no-store"

        for header in ("Content-Length", "Content-Range", "Last-Modified", "ETag"):
            value = upstream.headers.get(header)
            if value:
                response[header] = value

        return response


_INPUT_TO_MODEL_FIELDS = {
    "trackId": "track_id",
    "positionMs": "position_ms",
    "isPlaying": "is_playing",
    "volume": "volume",
    "isMuted": "is_muted",
    "repeatMode": "repeat_mode",
    "shuffleEnabled": "shuffle_enabled",
    "queueTrackIds": "queue_track_ids",
    "historyTrackIds": "history_track_ids",
    "contextType": "context_type",
    "contextId": "context_id",
}


class PlaybackStateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        state, _ = PlaybackState.objects.select_related("track__artist", "track__album__artist").get_or_create(
            user=request.user,
        )
        return Response(PlaybackStateSerializer(state, context={"request": request}).data)

    def post(self, request) -> Response:
        return self._upsert(request)

    def put(self, request) -> Response:
        return self._upsert(request)

    def _upsert(self, request) -> Response:
        serializer = PlaybackStateInputSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        state, _ = PlaybackState.objects.get_or_create(user=request.user)

        for input_key, model_field in _INPUT_TO_MODEL_FIELDS.items():
            if input_key in serializer.validated_data:
                value = serializer.validated_data[input_key]
                if input_key == "trackId":
                    state.track_id = value if value and Track.objects.filter(pk=value).exists() else None
                else:
                    setattr(state, model_field, value)

        state.save()
        state = (
            PlaybackState.objects.select_related("track__artist", "track__album__artist")
            .filter(user=request.user)
            .first()
        )
        return Response(PlaybackStateSerializer(state, context={"request": request}).data)


class PlayEventView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request) -> Response:
        serializer = PlayEventInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = PlayEvent.objects.create(
            user=request.user,
            track_id=serializer.validated_data["trackId"],
            ms_listened=serializer.validated_data["msListened"],
            source=serializer.validated_data["source"],
        )
        return Response({"id": event.id}, status=status.HTTP_201_CREATED)
