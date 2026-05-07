from django.urls import path

from .views import (
    AlbumDetailView,
    ArtistDetailView,
    CatalogSearchView,
    DailyMixView,
    FeaturedPlaylistDetailView,
    FeaturedPlaylistsView,
    GenresView,
    GenreTrackingView,
    NewReleasesView,
    PopularTracksView,
    RecentlyPlayedView,
    RecentSearchDeleteView,
    RecentSearchesView,
    RecommendationsView,
    TrackDetailView,
)

app_name = "catalog"

urlpatterns = [
    path("search/", CatalogSearchView.as_view(), name="search"),
    path("track/<int:track_id>/", TrackDetailView.as_view(), name="track-detail"),
    path("album/<int:album_id>/", AlbumDetailView.as_view(), name="album-detail"),
    path("artist/<int:artist_id>/", ArtistDetailView.as_view(), name="artist-detail"),
    path("popular/", PopularTracksView.as_view(), name="popular"),
    path("new-releases/", NewReleasesView.as_view(), name="new-releases"),
    path("genres/", GenresView.as_view(), name="genres"),
    path("genre/<slug:slug>/", GenreTrackingView.as_view(), name="genre-detail"),
    path("featured-playlists/", FeaturedPlaylistsView.as_view(), name="featured-playlists"),
    path("playlist/<int:playlist_id>/", FeaturedPlaylistDetailView.as_view(), name="playlist-detail"),
    path("recently-played/", RecentlyPlayedView.as_view(), name="recently-played"),
    path("daily-mix/", DailyMixView.as_view(), name="daily-mix"),
    path("recommendations/", RecommendationsView.as_view(), name="recommendations"),
    path("recent-searches/", RecentSearchesView.as_view(), name="recent-searches"),
    path("recent-searches/<int:entry_id>/", RecentSearchDeleteView.as_view(), name="recent-search-delete"),
]
