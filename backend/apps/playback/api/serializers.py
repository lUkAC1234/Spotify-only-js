from rest_framework import serializers

from apps.catalog.api.serializers import TrackSerializer
from apps.catalog.models import Track

from ..models import PlaybackState, PlayEvent


class PlaybackStateSerializer(serializers.ModelSerializer):
    track = TrackSerializer(read_only=True)
    queueTrackIds = serializers.ListField(
        source="queue_track_ids",
        child=serializers.IntegerField(),
        required=False,
    )
    historyTrackIds = serializers.ListField(
        source="history_track_ids",
        child=serializers.IntegerField(),
        required=False,
    )
    positionMs = serializers.IntegerField(source="position_ms", required=False, min_value=0)
    isPlaying = serializers.BooleanField(source="is_playing", required=False)
    isMuted = serializers.BooleanField(source="is_muted", required=False)
    repeatMode = serializers.ChoiceField(
        source="repeat_mode",
        choices=("off", "all", "one"),
        required=False,
    )
    shuffleEnabled = serializers.BooleanField(source="shuffle_enabled", required=False)
    contextType = serializers.CharField(source="context_type", required=False, allow_blank=True, max_length=24)
    contextId = serializers.CharField(source="context_id", required=False, allow_blank=True, max_length=128)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = PlaybackState
        fields = (
            "track",
            "positionMs",
            "isPlaying",
            "volume",
            "isMuted",
            "repeatMode",
            "shuffleEnabled",
            "queueTrackIds",
            "historyTrackIds",
            "contextType",
            "contextId",
            "updatedAt",
        )


class PlaybackStateInputSerializer(serializers.Serializer):
    trackId = serializers.IntegerField(required=False, allow_null=True)
    positionMs = serializers.IntegerField(required=False, min_value=0)
    isPlaying = serializers.BooleanField(required=False)
    volume = serializers.FloatField(required=False, min_value=0, max_value=1)
    isMuted = serializers.BooleanField(required=False)
    repeatMode = serializers.ChoiceField(choices=("off", "all", "one"), required=False)
    shuffleEnabled = serializers.BooleanField(required=False)
    queueTrackIds = serializers.ListField(child=serializers.IntegerField(), required=False)
    historyTrackIds = serializers.ListField(child=serializers.IntegerField(), required=False)
    contextType = serializers.CharField(required=False, allow_blank=True, max_length=24)
    contextId = serializers.CharField(required=False, allow_blank=True, max_length=128)


class PlayEventInputSerializer(serializers.Serializer):
    trackId = serializers.IntegerField()
    msListened = serializers.IntegerField(min_value=0)
    source = serializers.ChoiceField(choices=PlayEvent.Source.choices, default=PlayEvent.Source.TRACK)

    def validate_trackId(self, value: int) -> int:
        if not Track.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Track does not exist")
        return value
