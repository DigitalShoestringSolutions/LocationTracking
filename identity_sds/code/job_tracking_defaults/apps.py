from django.apps import AppConfig
from django.db.models.signals import post_migrate


class JobTrackingDefaultsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "job_tracking_defaults"

    def ready(self):
        post_migrate.connect(create_defaults, sender=self)


def create_defaults(sender, **kwargs):
    from identity_manager.models import IdentityType, IdentifierType, IdentifierPattern,IdentityEntry

    location_idtype, location_idtype_created = IdentityType.objects.get_or_create(
        tag="loc", defaults={"title": "Location", "individual": True}
    )
    product_type_idtype, product_type_created = IdentityType.objects.get_or_create(
        tag="prodtype", defaults={"title": "Product Type", "individual": False}
    )
    product_indv_idtype, product_indv_created = IdentityType.objects.get_or_create(
        tag="product", defaults={"title": "Individual Product", "individual": True}
    )

    barcode_identifier_type, _created = IdentifierType.objects.get_or_create(
        tag="barcode", defaults={"title": "Barcode"}
    )

    if location_idtype_created:
        print("Location ID Type created - adding defaults for New and Complete")
        IdentityEntry.objects.create(auto_id=1, name="New", type=location_idtype)
        IdentityEntry.objects.create(auto_id=2, name="Location 1", type=location_idtype)
        IdentityEntry.objects.create(auto_id=3, name="Location 2", type=location_idtype)
        IdentityEntry.objects.create(auto_id=4, name="Complete", type=location_idtype)

    if product_type_created:
        IdentifierPattern.objects.get_or_create(
            identifier_type=barcode_identifier_type,
            id_type= product_type_idtype,
            defaults={
                "pattern": "%(?P<name>.*)",
                "defaults": {"description": ""},
                "label": "Auto generated default mapping for barcodes to ids for product types",
            },
        )

    if product_indv_created:
        IdentifierPattern.objects.get_or_create(
            identifier_type=barcode_identifier_type,
            id_type=product_indv_idtype,
            defaults={
                "pattern": "#(?P<name>.*)",
                "defaults": {"description": ""},
                "label": "Auto generated default mapping for barcodes to ids for individual products",
            },
        )
