from django.apps import AppConfig
from django.db.models.signals import post_init, post_migrate

class StateConfig(AppConfig):
    name = 'state'

    def ready(self):
        post_migrate.connect(create_default_settings, sender=self)

def create_default_settings(sender, **kwargs):
    from .models import Setting

    default_settings = {
        "completed_location": "loc@4",
        "completed_duration_days": "7"
    }

    for key, value in default_settings.items():
        Setting.objects.get_or_create(key=key, defaults={"value": value})
