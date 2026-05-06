from django.conf import settings
from django.conf.urls.i18n import i18n_patterns
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

api_v1_patterns = [
    path("auth/", include("apps.accounts.api.urls")),
    path("catalog/", include("apps.catalog.api.urls")),
    path("", include("apps.playback.api.urls")),
    path("", include("apps.library.api.urls")),
    path("", include("apps.social.api.urls")),
]

urlpatterns = [
    path("i18n/", include("django.conf.urls.i18n")),
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_v1_patterns)),
]

urlpatterns += i18n_patterns()

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
