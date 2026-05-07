from rest_framework import serializers

from apps.catalog.api.serializers import TrackSerializer


class PublicUserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    displayName = serializers.CharField(source="display_name", read_only=True)
    bio = serializers.CharField(read_only=True)
    avatar = serializers.SerializerMethodField()
    followersCount = serializers.SerializerMethodField()
    followingCount = serializers.SerializerMethodField()
    isProfilePublic = serializers.BooleanField(source="is_profile_public", read_only=True)
    isListeningPublic = serializers.BooleanField(source="is_listening_public", read_only=True)
    isFollowing = serializers.SerializerMethodField()
    isSelf = serializers.SerializerMethodField()
    joinedAt = serializers.DateTimeField(source="date_joined", read_only=True)

    def get_avatar(self, obj) -> str | None:
        if not getattr(obj, "avatar", None):
            return None
        request = self.context.get("request") if isinstance(self.context, dict) else None
        url = obj.avatar.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url

    def get_followersCount(self, obj) -> int:
        cached = getattr(obj, "followers_count", None)
        return int(cached) if cached is not None else obj.follower_relations.count()

    def get_followingCount(self, obj) -> int:
        cached = getattr(obj, "following_count", None)
        return int(cached) if cached is not None else obj.following_relations.count()

    def get_isFollowing(self, obj) -> bool:
        request = self.context.get("request") if isinstance(self.context, dict) else None
        viewer = getattr(request, "user", None) if request else None
        if not viewer or not viewer.is_authenticated or viewer.id == obj.id:
            return False
        from apps.social.selectors import is_following

        return is_following(viewer.id, obj.id)

    def get_isSelf(self, obj) -> bool:
        request = self.context.get("request") if isinstance(self.context, dict) else None
        viewer = getattr(request, "user", None) if request else None
        if not viewer or not viewer.is_authenticated:
            return False
        return viewer.id == obj.id


class FollowEntrySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    user = serializers.SerializerMethodField()
    followedAt = serializers.DateTimeField(source="followed_at", read_only=True)

    def __init__(self, *args, side: str = "follower", **kwargs):
        self._side = side
        super().__init__(*args, **kwargs)

    def get_user(self, obj) -> dict:
        target = obj.follower if self._side == "follower" else obj.followed
        return PublicUserSerializer(target, context=self.context).data


class FriendListeningSerializer(serializers.Serializer):
    user = serializers.SerializerMethodField()
    track = TrackSerializer(read_only=True)
    isPlaying = serializers.BooleanField(source="is_playing", read_only=True)
    positionMs = serializers.IntegerField(source="position_ms", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    def get_user(self, obj) -> dict:
        return PublicUserSerializer(obj.user, context=self.context).data


class FeedEntrySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    user = serializers.SerializerMethodField()
    track = TrackSerializer(read_only=True)
    playedAt = serializers.DateTimeField(source="played_at", read_only=True)
    source = serializers.CharField(read_only=True)

    def get_user(self, obj) -> dict:
        return PublicUserSerializer(obj.user, context=self.context).data


class PrivacyInputSerializer(serializers.Serializer):
    isProfilePublic = serializers.BooleanField(required=False)
    isListeningPublic = serializers.BooleanField(required=False)
    isRecentHistoryPublic = serializers.BooleanField(required=False)
