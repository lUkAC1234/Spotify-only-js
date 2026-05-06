from django.urls import path

from .views import (
    AlbumDetailView,
    ArtistDetailView,
    CatalogSearchView,
    NewReleasesView,
    PopularTracksView,
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
]
