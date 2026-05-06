from rest_framework import serializers

from apps.catalog.models import Album, Artist, Track


class ArtistSerializer(serializers.ModelSerializer):
    sourceId = serializers.CharField(source="source_id", read_only=True)
    monthlyListeners = serializers.IntegerField(source="monthly_listeners", read_only=True)

    class Meta:
        model = Artist
        fields = (
            "id",
            "source",
            "sourceId",
            "name",
            "slug",
            "image",
            "bio",
            "country",
            "monthlyListeners",
        )


class AlbumSerializer(serializers.ModelSerializer):
    artist = ArtistSerializer(read_only=True)
    sourceId = serializers.CharField(source="source_id", read_only=True)
    releaseDate = serializers.DateField(source="release_date", read_only=True)
    totalTracks = serializers.IntegerField(source="total_tracks", read_only=True)

    class Meta:
        model = Album
        fields = (
            "id",
            "source",
            "sourceId",
            "title",
            "slug",
            "artist",
            "cover",
            "releaseDate",
            "totalTracks",
            "type",
        )


class TrackSerializer(serializers.ModelSerializer):
    artist = ArtistSerializer(read_only=True)
    album = AlbumSerializer(read_only=True)
    sourceId = serializers.CharField(source="source_id", read_only=True)
    durationMs = serializers.IntegerField(source="duration_ms", read_only=True)
    trackNumber = serializers.IntegerField(source="track_number", read_only=True, allow_null=True)
    genres = serializers.SerializerMethodField()

    class Meta:
        model = Track
        fields = (
            "id",
            "source",
            "sourceId",
            "title",
            "slug",
            "artist",
            "album",
            "cover",
            "durationMs",
            "trackNumber",
            "explicit",
            "bpm",
            "genres",
        )

    def get_genres(self, obj: Track) -> list[str]:
        return [g.name for g in obj.genres.all()]


class SearchResultSerializer(serializers.Serializer):
    tracks = TrackSerializer(many=True, read_only=True)
    artists = ArtistSerializer(many=True, read_only=True)
    albums = AlbumSerializer(many=True, read_only=True)


class AlbumDetailSerializer(AlbumSerializer):
    tracks = TrackSerializer(many=True, read_only=True)

    class Meta(AlbumSerializer.Meta):
        fields = AlbumSerializer.Meta.fields + ("tracks",)


class ArtistDetailSerializer(ArtistSerializer):
    topTracks = serializers.SerializerMethodField()
    albums = AlbumSerializer(many=True, read_only=True)

    class Meta(ArtistSerializer.Meta):
        fields = ArtistSerializer.Meta.fields + ("topTracks", "albums")

    def get_topTracks(self, obj: Artist) -> list[dict]:
        qs = obj.tracks.select_related("artist", "album").order_by("-popularity")[:10]
        return TrackSerializer(qs, many=True).data
