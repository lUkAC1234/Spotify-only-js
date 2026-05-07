from rest_framework import serializers

from apps.catalog.api.serializers import AlbumSerializer, ArtistSerializer, TrackSerializer
from apps.catalog.models import Track
from apps.library.models import (
    FollowedArtist,
    Playlist,
    PlaylistCollaborator,
    PlaylistItem,
    SavedAlbum,
    SavedTrack,
)


class SavedTrackSerializer(serializers.ModelSerializer):
    track = TrackSerializer(read_only=True)
    savedAt = serializers.DateTimeField(source="saved_at", read_only=True)

    class Meta:
        model = SavedTrack
        fields = ("id", "track", "savedAt")


class SavedAlbumSerializer(serializers.ModelSerializer):
    album = AlbumSerializer(read_only=True)
    savedAt = serializers.DateTimeField(source="saved_at", read_only=True)

    class Meta:
        model = SavedAlbum
        fields = ("id", "album", "savedAt")


class FollowedArtistSerializer(serializers.ModelSerializer):
    artist = ArtistSerializer(read_only=True)
    followedAt = serializers.DateTimeField(source="followed_at", read_only=True)

    class Meta:
        model = FollowedArtist
        fields = ("id", "artist", "followedAt")


class HistoryEntrySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    track = TrackSerializer(read_only=True)
    playedAt = serializers.DateTimeField(source="played_at", read_only=True)
    msListened = serializers.IntegerField(source="ms_listened", read_only=True)
    source = serializers.CharField(read_only=True)


class PlaylistOwnerSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    displayName = serializers.CharField(source="display_name", read_only=True)
    avatar = serializers.SerializerMethodField()

    def get_avatar(self, obj) -> str | None:
        request = self.context.get("request") if isinstance(self.context, dict) else None
        avatar = getattr(obj, "avatar", None)
        if not avatar:
            return None
        url = avatar.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url


class PlaylistItemSerializer(serializers.ModelSerializer):
    track = TrackSerializer(read_only=True)
    addedAt = serializers.DateTimeField(source="added_at", read_only=True)
    addedById = serializers.IntegerField(source="added_by_id", read_only=True)

    class Meta:
        model = PlaylistItem
        fields = ("id", "track", "position", "addedAt", "addedById")


class PlaylistCollaboratorSerializer(serializers.ModelSerializer):
    user = PlaylistOwnerSerializer(read_only=True)
    addedAt = serializers.DateTimeField(source="added_at", read_only=True)

    class Meta:
        model = PlaylistCollaborator
        fields = ("id", "user", "addedAt")


class PlaylistSummarySerializer(serializers.ModelSerializer):
    owner = PlaylistOwnerSerializer(read_only=True)
    cover = serializers.SerializerMethodField()
    isPublic = serializers.BooleanField(source="is_public", read_only=True)
    isCollaborative = serializers.BooleanField(source="is_collaborative", read_only=True)
    isSystem = serializers.BooleanField(source="is_system", read_only=True)
    totalTracks = serializers.SerializerMethodField()
    sortOrder = serializers.IntegerField(source="sort_order", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Playlist
        fields = (
            "id",
            "owner",
            "title",
            "slug",
            "description",
            "cover",
            "isPublic",
            "isCollaborative",
            "isSystem",
            "totalTracks",
            "sortOrder",
            "updatedAt",
        )

    def get_cover(self, obj: Playlist) -> str:
        request = self.context.get("request") if isinstance(self.context, dict) else None
        cover = obj.effective_cover or ""
        if cover.startswith("/") and request is not None:
            return request.build_absolute_uri(cover)
        return cover

    def get_totalTracks(self, obj: Playlist) -> int:
        cached = getattr(obj, "items_count", None)
        if cached is not None:
            return int(cached)
        return obj.items.count()


class PlaylistDetailSerializer(PlaylistSummarySerializer):
    items = PlaylistItemSerializer(many=True, read_only=True)
    collaborators = PlaylistCollaboratorSerializer(many=True, read_only=True)
    totalDurationMs = serializers.SerializerMethodField()
    canEdit = serializers.SerializerMethodField()

    class Meta(PlaylistSummarySerializer.Meta):
        fields = PlaylistSummarySerializer.Meta.fields + (
            "items",
            "collaborators",
            "totalDurationMs",
            "canEdit",
        )

    def get_totalDurationMs(self, obj: Playlist) -> int:
        items = list(obj.items.all()) if hasattr(obj, "items") else []
        return sum(int(item.track.duration_ms or 0) for item in items)

    def get_canEdit(self, obj: Playlist) -> bool:
        from apps.library.services import can_edit_playlist

        request = self.context.get("request") if isinstance(self.context, dict) else None
        user = getattr(request, "user", None) if request else None
        user_id = user.id if user is not None and getattr(user, "is_authenticated", False) else None
        return can_edit_playlist(user_id, obj)


class PlaylistCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=120)
    description = serializers.CharField(max_length=320, allow_blank=True, required=False)
    isPublic = serializers.BooleanField(required=False, default=True)


class PlaylistUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=120, required=False)
    description = serializers.CharField(max_length=320, allow_blank=True, required=False)
    isPublic = serializers.BooleanField(required=False)
    isCollaborative = serializers.BooleanField(required=False)


class PlaylistAddItemsSerializer(serializers.Serializer):
    trackIds = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        min_length=1,
        max_length=100,
    )

    def validate_trackIds(self, value: list[int]) -> list[int]:
        existing = set(Track.objects.filter(pk__in=value).values_list("pk", flat=True))
        return [pk for pk in value if pk in existing]


class PlaylistMoveItemSerializer(serializers.Serializer):
    position = serializers.IntegerField(min_value=1)


class PlaylistCollaboratorInputSerializer(serializers.Serializer):
    userId = serializers.IntegerField(min_value=1, required=False)
    username = serializers.CharField(max_length=30, required=False)
