from datetime import datetime

from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.library.api.serializers import PlaylistSummarySerializer
from apps.social.selectors import (
    feed_for,
    followers_of,
    following_of,
    friends_listening,
    get_public_user,
    public_playlists_for,
    yearly_recap,
)
from apps.social.services import follow_user, unfollow_user, update_privacy

from .serializers import (
    FeedEntrySerializer,
    FollowEntrySerializer,
    FriendListeningSerializer,
    PrivacyInputSerializer,
    PublicUserSerializer,
)


class PublicProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, user_id: int) -> Response:
        target = get_public_user(user_id)
        if not target:
            return Response(
                {"code": "not_found", "message": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        viewer_id = request.user.id if request.user.is_authenticated else None
        if not target.is_profile_public and viewer_id != target.id:
            return Response(
                {"code": "permission_denied", "message": "Profile is private"},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(PublicUserSerializer(target, context={"request": request}).data)


class PublicPlaylistsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, user_id: int) -> Response:
        target = get_public_user(user_id)
        if not target:
            return Response(status=status.HTTP_404_NOT_FOUND)
        viewer_id = request.user.id if request.user.is_authenticated else None
        if not target.is_profile_public and viewer_id != target.id:
            return Response(
                {"code": "permission_denied", "message": "Profile is private"},
                status=status.HTTP_403_FORBIDDEN,
            )
        playlists = public_playlists_for(target.id)
        return Response(
            {
                "items": PlaylistSummarySerializer(
                    playlists, many=True, context={"request": request}
                ).data
            }
        )


class FollowToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id: int) -> Response:
        from apps.social.selectors import is_following

        return Response({"following": is_following(request.user.id, user_id)})

    def put(self, request, user_id: int) -> Response:
        try:
            follow_user(request.user.id, user_id)
        except ValidationError as exc:
            message = exc.message if hasattr(exc, "message") else str(exc)
            return Response(
                {"code": "validation_error", "message": str(message)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"following": True}, status=status.HTTP_201_CREATED)

    def delete(self, request, user_id: int) -> Response:
        unfollow_user(request.user.id, user_id)
        return Response({"following": False}, status=status.HTTP_200_OK)


def _parse_int(raw: str | None, *, default: int, maximum: int) -> int:
    try:
        value = int(raw) if raw is not None else default
    except (TypeError, ValueError):
        value = default
    return max(1, min(value, maximum))


def _parse_offset(raw: str | None) -> int:
    try:
        value = int(raw) if raw is not None else 0
    except (TypeError, ValueError):
        value = 0
    return max(0, min(value, 10_000))


class FollowersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, user_id: int) -> Response:
        target = get_public_user(user_id)
        if not target:
            return Response(status=status.HTTP_404_NOT_FOUND)
        limit = _parse_int(request.query_params.get("limit"), default=50, maximum=100)
        offset = _parse_offset(request.query_params.get("offset"))
        items, total = followers_of(target.id, limit=limit, offset=offset)
        serializer = FollowEntrySerializer(
            items, many=True, side="follower", context={"request": request}
        )
        return Response({"items": serializer.data, "total": total, "limit": limit, "offset": offset})


class FollowingView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, user_id: int) -> Response:
        target = get_public_user(user_id)
        if not target:
            return Response(status=status.HTTP_404_NOT_FOUND)
        limit = _parse_int(request.query_params.get("limit"), default=50, maximum=100)
        offset = _parse_offset(request.query_params.get("offset"))
        items, total = following_of(target.id, limit=limit, offset=offset)
        serializer = FollowEntrySerializer(
            items, many=True, side="followed", context={"request": request}
        )
        return Response({"items": serializer.data, "total": total, "limit": limit, "offset": offset})


class FriendsActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        states = friends_listening(request.user.id)
        return Response(
            {
                "items": FriendListeningSerializer(
                    states, many=True, context={"request": request}
                ).data
            }
        )


class FeedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        limit = _parse_int(request.query_params.get("limit"), default=30, maximum=100)
        events = feed_for(request.user.id, limit=limit)
        return Response(
            {
                "items": FeedEntrySerializer(events, many=True, context={"request": request}).data,
            }
        )


class PrivacyView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request) -> Response:
        serializer = PrivacyInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        update_privacy(
            request.user,
            is_profile_public=data.get("isProfilePublic"),
            is_listening_public=data.get("isListeningPublic"),
            is_recent_history_public=data.get("isRecentHistoryPublic"),
        )
        return Response(
            {
                "isProfilePublic": request.user.is_profile_public,
                "isListeningPublic": request.user.is_listening_public,
                "isRecentHistoryPublic": request.user.is_recent_history_public,
            }
        )


class RecapView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        raw = request.query_params.get("year")
        try:
            year = int(raw) if raw else datetime.utcnow().year
        except (TypeError, ValueError):
            year = datetime.utcnow().year
        return Response(yearly_recap(request.user.id, year))
