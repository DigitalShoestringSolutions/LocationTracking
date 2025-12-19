from django.apps import AppConfig
from django.db.models.signals import post_init, post_migrate


class StateConfig(AppConfig):
    name = "state"

    def ready(self):
        post_migrate.connect(create_default_settings, sender=self)
        post_migrate.connect(create_default_statuses, sender=self)


def create_default_settings(sender, **kwargs):
    from .models import Setting

    default_settings = {"completed_location": "loc@4", "completed_duration_days": "7"}

    for key, value in default_settings.items():
        Setting.objects.get_or_create(key=key, defaults={"value": value})


def create_default_statuses(sender, **kwargs):
    from .models import Status

    if len(Status.objects.all()) == 0:
        Status.objects.create(label="Delayed", icon="clock-fill", color="#e7a536")
        Status.objects.create(label="Blocked", icon="dash-circle-fill", color="#fe301f")
        Status.objects.create(
            label="Urgent",
            icon="exclamation-circle-fill",
            color="#29f9fe",
        )
