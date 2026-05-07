from django.urls import path

from .views import (
    FollowedArtistDetailView,
    FollowedArtistsLookupView,
    FollowedArtistsView,
    HistoryView,
    MyPlaylistsView,
    PlaylistCollaboratorDetailView,
    PlaylistCollaboratorsView,
    PlaylistCoverView,
    PlaylistDetailView,
    PlaylistItemDetailView,
    PlaylistItemsView,
    SavedAlbumDetailView,
    SavedAlbumsLookupView,
    SavedAlbumsView,
    SavedTrackDetailView,
    SavedTracksLookupView,
    SavedTracksView,
)

app_name = "library"

urlpatterns = [
    path("library/tracks/", SavedTracksView.as_view(), name="saved-tracks"),
    path("library/tracks/ids/", SavedTracksLookupView.as_view(), name="saved-track-ids"),
    path("library/tracks/<int:track_id>/", SavedTrackDetailView.as_view(), name="saved-track-detail"),
    path("library/albums/", SavedAlbumsView.as_view(), name="saved-albums"),
    path("library/albums/ids/", SavedAlbumsLookupView.as_view(), name="saved-album-ids"),
    path("library/albums/<int:album_id>/", SavedAlbumDetailView.as_view(), name="saved-album-detail"),
    path("library/artists/", FollowedArtistsView.as_view(), name="followed-artists"),
    path("library/artists/ids/", FollowedArtistsLookupView.as_view(), name="followed-artist-ids"),
    path("library/artists/<int:artist_id>/", FollowedArtistDetailView.as_view(), name="followed-artist-detail"),
    path("library/history/", HistoryView.as_view(), name="history"),

    path("playlists/me/", MyPlaylistsView.as_view(), name="my-playlists"),
    path("playlists/", MyPlaylistsView.as_view(), name="playlists-create"),
    path("playlists/<int:playlist_id>/", PlaylistDetailView.as_view(), name="playlist-detail"),
    path("playlists/<int:playlist_id>/cover/", PlaylistCoverView.as_view(), name="playlist-cover"),
    path("playlists/<int:playlist_id>/items/", PlaylistItemsView.as_view(), name="playlist-items"),
    path(
        "playlists/<int:playlist_id>/items/<int:item_id>/",
        PlaylistItemDetailView.as_view(),
        name="playlist-item-detail",
    ),
    path(
        "playlists/<int:playlist_id>/collaborators/",
        PlaylistCollaboratorsView.as_view(),
        name="playlist-collaborators",
    ),
    path(
        "playlists/<int:playlist_id>/collaborators/<int:user_id>/",
        PlaylistCollaboratorDetailView.as_view(),
        name="playlist-collaborator-detail",
    ),
]
