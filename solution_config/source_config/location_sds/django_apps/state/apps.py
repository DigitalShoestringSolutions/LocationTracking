from django.apps import AppConfig
from django.db.models.signals import post_init

class StateConfig(AppConfig):
    name = 'state'

    def ready(self):
        pass