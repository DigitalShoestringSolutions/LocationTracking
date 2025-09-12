from django.apps import AppConfig
from django.db.models.signals import post_migrate

class IdentityManagerConfig(AppConfig):
    name = 'identity_manager'
    
    def ready(self):
        pass
        # post_migrate.connect(create_default_admin,sender=self)
        # post_migrate.connect(create_default_locations,sender=self)




# def create_default_locations(sender, **kwargs):
#     from . import models
#     if models.Location.objects.all().count() == 0:
#         for name in ["Location 1","Location 2","Location 3","Complete"]:
#             _, created = models.Location.objects.get_or_create(name=name)
#             if created:
#                 print(f'Added location "{name}"')
#             else:
#                 print(f'Location "{name}" already exists')

