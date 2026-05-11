import logging

from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Album, Artist, Track
from apps.library.models import Playlist
from apps.library.selectors import (
    collaborators_for_playlist,
    followed_artist_ids_for_user,
    followed_artists_for_user,
    is_album_saved,
    is_artist_followed,
    is_track_saved,
    my_playlists,
    play_history_for_user,
    playlist_for_user,
    saved_album_ids_for_user,
    saved_albums_for_user,
    saved_track_ids_for_user,
    saved_tracks_for_user,
)
from apps.library.services import (
    add_collaborator,
    add_tracks_to_playlist,
    can_view_playlist,
    create_user_playlist,
    delete_user_playlist,
    follow_artist,
    move_playlist_item,
    remove_collaborator,
    remove_playlist_item,
    save_album,
    save_track,
    unfollow_artist,
    unsave_album,
    unsave_track,
    update_user_playlist,
)

from .serializers import (
    FollowedArtistSerializer,
    HistoryEntrySerializer,
    PlaylistAddItemsSerializer,
    PlaylistCollaboratorInputSerializer,
    PlaylistCollaboratorSerializer,
    PlaylistCreateSerializer,
    PlaylistDetailSerializer,
    PlaylistItemSerializer,
    PlaylistMoveItemSerializer,
    PlaylistSummarySerializer,
    PlaylistUpdateSerializer,
    SavedAlbumSerializer,
    SavedTrackSerializer,
)

logger = logging.getLogger(__name__)
User = get_user_model()


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


class SavedTracksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        limit = _parse_int(request.query_params.get("limit"), default=50, maximum=100)
        offset = _parse_offset(request.query_params.get("offset"))
        items, total = saved_tracks_for_user(request.user.id, limit=limit, offset=offset)
        return Response(
            {
                "items": SavedTrackSerializer(items, many=True, context={"request": request}).data,
                "total": total,
                "limit": limit,
                "offset": offset,
            }
        )


class SavedTrackDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, track_id: int) -> Response:
        return Response({"saved": is_track_saved(request.user.id, track_id)})

    def put(self, request, track_id: int) -> Response:
        track = Track.objects.filter(pk=track_id).first()
        if not track:
            return Response(
                {"code": "not_found", "message": "Track not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        save_track(request.user.id, track)
        return Response({"saved": True}, status=status.HTTP_201_CREATED)

    def delete(self, request, track_id: int) -> Response:
        unsave_track(request.user.id, track_id)
        return Response({"saved": False}, status=status.HTTP_200_OK)


class SavedTracksLookupView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        return Response({"trackIds": list(saved_track_ids_for_user(request.user.id))})


class SavedAlbumsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        limit = _parse_int(request.query_params.get("limit"), default=50, maximum=100)
        offset = _parse_offset(request.query_params.get("offset"))
        items, total = saved_albums_for_user(request.user.id, limit=limit, offset=offset)
        return Response(
            {
                "items": SavedAlbumSerializer(items, many=True, context={"request": request}).data,
                "total": total,
                "limit": limit,
                "offset": offset,
            }
        )


class SavedAlbumsLookupView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        return Response({"albumIds": list(saved_album_ids_for_user(request.user.id))})


class SavedAlbumDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, album_id: int) -> Response:
        return Response({"saved": is_album_saved(request.user.id, album_id)})

    def put(self, request, album_id: int) -> Response:
        album = Album.objects.filter(pk=album_id).first()
        if not album:
            return Response(
                {"code": "not_found", "message": "Album not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        save_album(request.user.id, album)
        return Response({"saved": True}, status=status.HTTP_201_CREATED)

    def delete(self, request, album_id: int) -> Response:
        unsave_album(request.user.id, album_id)
        return Response({"saved": False}, status=status.HTTP_200_OK)


class FollowedArtistsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        limit = _parse_int(request.query_params.get("limit"), default=50, maximum=100)
        offset = _parse_offset(request.query_params.get("offset"))
        items, total = followed_artists_for_user(request.user.id, limit=limit, offset=offset)
        return Response(
            {
                "items": FollowedArtistSerializer(items, many=True, context={"request": request}).data,
                "total": total,
                "limit": limit,
                "offset": offset,
            }
        )


class FollowedArtistsLookupView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        return Response({"artistIds": list(followed_artist_ids_for_user(request.user.id))})


class FollowedArtistDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, artist_id: int) -> Response:
        return Response({"following": is_artist_followed(request.user.id, artist_id)})

    def put(self, request, artist_id: int) -> Response:
        artist = Artist.objects.filter(pk=artist_id).first()
        if not artist:
            return Response(
                {"code": "not_found", "message": "Artist not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        follow_artist(request.user.id, artist)
        return Response({"following": True}, status=status.HTTP_201_CREATED)

    def delete(self, request, artist_id: int) -> Response:
        unfollow_artist(request.user.id, artist_id)
        return Response({"following": False}, status=status.HTTP_200_OK)


class HistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        limit = _parse_int(request.query_params.get("limit"), default=50, maximum=100)
        before_raw = request.query_params.get("before")
        before_id: int | None = None
        if before_raw:
            try:
                before_id = int(before_raw)
            except ValueError:
                before_id = None
        items = play_history_for_user(request.user.id, limit=limit, before_id=before_id)
        next_cursor = items[-1].pk if items and len(items) == limit else None
        return Response(
            {
                "items": HistoryEntrySerializer(items, many=True).data,
                "nextBefore": next_cursor,
            }
        )


class MyPlaylistsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        playlists = my_playlists(request.user.id)
        return Response(
            {
                "items": PlaylistSummarySerializer(
                    playlists, many=True, context={"request": request}
                ).data
            }
        )

    def post(self, request) -> Response:
        serializer = PlaylistCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        playlist = create_user_playlist(
            request.user.id,
            serializer.validated_data["title"],
            description=serializer.validated_data.get("description", ""),
            is_public=bool(serializer.validated_data.get("isPublic", True)),
        )
        return Response(
            PlaylistDetailSerializer(playlist, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class PlaylistDetailView(APIView):
    permission_classes = [AllowAny]

    def _resolve(self, request, playlist_id: int) -> Playlist | None:
        user_id = request.user.id if request.user.is_authenticated else None
        return playlist_for_user(user_id, playlist_id)

    def get(self, request, playlist_id: int) -> Response:
        playlist = self._resolve(request, playlist_id)
        if not playlist:
            return Response(
                {"code": "not_found", "message": "Playlist not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if not can_view_playlist(
            request.user.id if request.user.is_authenticated else None, playlist
        ):
            return Response(
                {"code": "permission_denied", "message": "Playlist is private"},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(PlaylistDetailSerializer(playlist, context={"request": request}).data)

    def patch(self, request, playlist_id: int) -> Response:
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        playlist = self._resolve(request, playlist_id)
        if not playlist:
            return Response(
                {"code": "not_found", "message": "Playlist not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = PlaylistUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            playlist = update_user_playlist(
                request.user.id,
                playlist,
                title=serializer.validated_data.get("title"),
                description=serializer.validated_data.get("description"),
                is_public=serializer.validated_data.get("isPublic"),
                is_collaborative=serializer.validated_data.get("isCollaborative"),
            )
        except PermissionDenied as exc:
            return Response(
                {"code": "permission_denied", "message": str(exc)},
                status=status.HTTP_403_FORBIDDEN,
            )
        playlist = self._resolve(request, playlist_id) or playlist
        return Response(PlaylistDetailSerializer(playlist, context={"request": request}).data)

    def delete(self, request, playlist_id: int) -> Response:
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        playlist = self._resolve(request, playlist_id)
        if not playlist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            delete_user_playlist(request.user.id, playlist)
        except PermissionDenied as exc:
            return Response(
                {"code": "permission_denied", "message": str(exc)},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlaylistCoverView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, playlist_id: int) -> Response:
        playlist = playlist_for_user(request.user.id, playlist_id)
        if not playlist:
            return Response(
                {"code": "not_found", "message": "Playlist not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if playlist.owner_id != request.user.id:
            return Response(
                {"code": "permission_denied", "message": "Only the owner can change the cover"},
                status=status.HTTP_403_FORBIDDEN,
            )
        upload = request.FILES.get("cover")
        if not upload:
            return Response(
                {"code": "missing_file", "message": "Provide an image as 'cover'"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if upload.size > 5 * 1024 * 1024:
            return Response(
                {"code": "too_large", "message": "Image must be smaller than 5 MB"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not (upload.content_type or "").startswith("image/"):
            return Response(
                {"code": "invalid_type", "message": "File must be an image"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if playlist.cover_image:
            playlist.cover_image.delete(save=False)
        playlist.cover_image = upload
        playlist.save(update_fields=["cover_image", "updated_at"])
        return Response(PlaylistDetailSerializer(playlist, context={"request": request}).data)

    def delete(self, request, playlist_id: int) -> Response:
        playlist = playlist_for_user(request.user.id, playlist_id)
        if not playlist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if playlist.owner_id != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)
        if playlist.cover_image:
            playlist.cover_image.delete(save=False)
            playlist.cover_image = None
            playlist.save(update_fields=["cover_image", "updated_at"])
        return Response(PlaylistDetailSerializer(playlist, context={"request": request}).data)


class PlaylistItemsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, playlist_id: int) -> Response:
        playlist = playlist_for_user(request.user.id, playlist_id)
        if not playlist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = PlaylistAddItemsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        track_ids = serializer.validated_data["trackIds"]
        tracks = list(
            Track.objects.filter(pk__in=track_ids).select_related("artist", "album__artist")
        )
        ordered = sorted(tracks, key=lambda t: track_ids.index(t.pk))
        try:
            items = add_tracks_to_playlist(request.user.id, playlist, ordered)
        except PermissionDenied as exc:
            return Response(
                {"code": "permission_denied", "message": str(exc)},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(
            {
                "added": PlaylistItemSerializer(items, many=True).data,
            },
            status=status.HTTP_201_CREATED,
        )


class PlaylistItemDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, playlist_id: int, item_id: int) -> Response:
        playlist = playlist_for_user(request.user.id, playlist_id)
        if not playlist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = PlaylistMoveItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            item = move_playlist_item(
                request.user.id,
                playlist,
                item_id,
                serializer.validated_data["position"],
            )
        except PermissionDenied as exc:
            return Response(
                {"code": "permission_denied", "message": str(exc)},
                status=status.HTTP_403_FORBIDDEN,
            )
        except ValueError:
            return Response(
                {"code": "not_found", "message": "Item not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(PlaylistItemSerializer(item).data)

    def delete(self, request, playlist_id: int, item_id: int) -> Response:
        playlist = playlist_for_user(request.user.id, playlist_id)
        if not playlist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            removed = remove_playlist_item(request.user.id, playlist, item_id)
        except PermissionDenied as exc:
            return Response(
                {"code": "permission_denied", "message": str(exc)},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not removed:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlaylistCollaboratorsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, playlist_id: int) -> Response:
        playlist = playlist_for_user(request.user.id, playlist_id)
        if not playlist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        entries = collaborators_for_playlist(playlist)
        return Response(
            {
                "items": PlaylistCollaboratorSerializer(
                    entries, many=True, context={"request": request}
                ).data
            }
        )

    def post(self, request, playlist_id: int) -> Response:
        playlist = playlist_for_user(request.user.id, playlist_id)
        if not playlist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = PlaylistCollaboratorInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target = self._resolve_user(serializer.validated_data)
        if target is None:
            return Response(
                {"code": "not_found", "message": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            entry = add_collaborator(request.user.id, playlist, target.id)
        except PermissionDenied as exc:
            return Response(
                {"code": "permission_denied", "message": str(exc)},
                status=status.HTTP_403_FORBIDDEN,
            )
        except ValueError as exc:
            return Response(
                {"code": "validation_error", "message": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            PlaylistCollaboratorSerializer(entry, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @staticmethod
    def _resolve_user(payload: dict):
        user_id = payload.get("userId")
        username = (payload.get("username") or "").strip()
        if user_id:
            return User.objects.filter(pk=user_id, is_active=True).first()
        if username:
            return User.objects.filter(username__iexact=username, is_active=True).first()
        return None


class PlaylistCollaboratorDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, playlist_id: int, user_id: int) -> Response:
        playlist = playlist_for_user(request.user.id, playlist_id)
        if not playlist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            removed = remove_collaborator(request.user.id, playlist, user_id)
        except PermissionDenied as exc:
            return Response(
                {"code": "permission_denied", "message": str(exc)},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not removed:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
