from django.urls import path, include
from rest_framework import routers
from . import views

urlpatterns = [
    path("", views.list_status_options),
    path("<str:id>", views.handle_status),
    path("notes/<str:id>", views.handle_notes),
    path("note/<str:note_id>", views.handle_note),
]
