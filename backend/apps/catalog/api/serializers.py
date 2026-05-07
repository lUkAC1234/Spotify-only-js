from rest_framework import serializers

from apps.catalog.models import Album, Artist, Genre, Track


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
    tracks = serializers.SerializerMethodField()
    totalDurationMs = serializers.SerializerMethodField()
    year = serializers.SerializerMethodField()
    relatedAlbums = serializers.SerializerMethodField()

    class Meta(AlbumSerializer.Meta):
        fields = AlbumSerializer.Meta.fields + ("tracks", "totalDurationMs", "year", "relatedAlbums")

    def get_tracks(self, obj: Album) -> list[dict]:
        qs = obj.tracks.select_related("artist", "album__artist").order_by(
            "track_number", "id"
        )
        return TrackSerializer(qs, many=True).data

    def get_totalDurationMs(self, obj: Album) -> int:
        return int(sum(t.duration_ms or 0 for t in obj.tracks.all()))

    def get_year(self, obj: Album) -> int | None:
        if not obj.release_date:
            return None
        return obj.release_date.year

    def get_relatedAlbums(self, obj: Album) -> list[dict]:
        from apps.catalog.selectors import related_albums

        return AlbumSerializer(related_albums(obj, limit=6), many=True).data


class ArtistDetailSerializer(ArtistSerializer):
    topTracks = serializers.SerializerMethodField()
    albums = serializers.SerializerMethodField()
    relatedArtists = serializers.SerializerMethodField()
    totalTracks = serializers.SerializerMethodField()

    class Meta(ArtistSerializer.Meta):
        fields = ArtistSerializer.Meta.fields + (
            "topTracks",
            "albums",
            "relatedArtists",
            "totalTracks",
        )

    def get_topTracks(self, obj: Artist) -> list[dict]:
        from apps.catalog.selectors import top_tracks_for_artist

        return TrackSerializer(top_tracks_for_artist(obj.pk, limit=5), many=True).data

    def get_albums(self, obj: Artist) -> list[dict]:
        from apps.catalog.selectors import discography_for_artist

        return AlbumSerializer(discography_for_artist(obj.pk), many=True).data

    def get_relatedArtists(self, obj: Artist) -> list[dict]:
        from apps.catalog.selectors import related_artists

        return ArtistSerializer(related_artists(obj, limit=6), many=True).data

    def get_totalTracks(self, obj: Artist) -> int:
        return obj.tracks.count()


class GenreSerializer(serializers.ModelSerializer):
    trackCount = serializers.IntegerField(source="track_count", read_only=True)

    class Meta:
        model = Genre
        fields = ("id", "slug", "name", "trackCount")


class FeaturedPlaylistSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(read_only=True)
    slug = serializers.CharField(read_only=True)
    description = serializers.CharField(read_only=True)
    cover = serializers.CharField(read_only=True)
    isSystem = serializers.BooleanField(source="is_system", read_only=True)
    isPublic = serializers.BooleanField(source="is_public", read_only=True)
    isCollaborative = serializers.BooleanField(source="is_collaborative", read_only=True)
    totalTracks = serializers.SerializerMethodField()
    ownerName = serializers.SerializerMethodField()
    sortOrder = serializers.IntegerField(source="sort_order", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    def get_totalTracks(self, obj) -> int:
        cached = getattr(obj, "items_count", None)
        if cached is not None:
            return int(cached)
        return obj.items.count()

    def get_ownerName(self, obj) -> str:
        owner = obj.owner
        return owner.display_name or owner.username


class FeaturedPlaylistDetailSerializer(FeaturedPlaylistSerializer):
    tracks = serializers.SerializerMethodField()
    totalDurationMs = serializers.SerializerMethodField()

    def get_tracks(self, obj) -> list[dict]:
        items = obj.items.all() if hasattr(obj, "items") else []
        prefetched = list(items)
        prefetched.sort(key=lambda item: item.position)
        tracks = [item.track for item in prefetched]
        return TrackSerializer(tracks, many=True).data

    def get_totalDurationMs(self, obj) -> int:
        items = list(obj.items.all()) if hasattr(obj, "items") else []
        return sum(int(item.track.duration_ms or 0) for item in items)


class RecentSearchSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    query = serializers.CharField(read_only=True)
    searchedAt = serializers.DateTimeField(source="searched_at", read_only=True)


class RecentSearchInputSerializer(serializers.Serializer):
    query = serializers.CharField(max_length=120, trim_whitespace=True)

    def validate_query(self, value: str) -> str:
        cleaned = (value or "").strip()
        if not cleaned:
            raise serializers.ValidationError("Query cannot be empty")
        return cleaned
