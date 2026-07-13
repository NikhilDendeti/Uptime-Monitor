from django.urls import path

from monitor import views

urlpatterns = [
    path('api/health', views.health),
    path('api/urls', views.list_create_urls),
    path('api/urls/<int:id>', views.url_detail),
    path('api/urls/<int:id>/checks', views.url_checks),
]
