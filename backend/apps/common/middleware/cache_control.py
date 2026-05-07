PRIVATE_PATH_PREFIXES = (
    "/api/v1/me/",
    "/api/v1/auth/me",
    "/api/v1/library/",
    "/api/v1/playback/state/",
    "/api/v1/playlists/me/",
)

PRIVATE_HEADER = "private, no-store, max-age=0, must-revalidate"


class MeCacheControlMiddleware:
    """Force `Cache-Control: private, no-store` on responses that include user-scoped data."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        path = request.path or ""
        if any(path.startswith(prefix) for prefix in PRIVATE_PATH_PREFIXES):
            response["Cache-Control"] = PRIVATE_HEADER
            response["Pragma"] = "no-cache"
        return response
