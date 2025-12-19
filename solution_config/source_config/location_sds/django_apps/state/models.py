from django.db import models

class TransferEvent(models.Model):
    event_id = models.BigAutoField(primary_key=True)
    item_id = models.CharField(max_length=32)
    from_location_link = models.CharField(max_length=32,blank=True,null=True)
    to_location_link = models.CharField(max_length=32)
    quantity = models.IntegerField(blank=True, null=True)
    timestamp = models.DateTimeField()

    def __str__(self):
        return self.item_id

    class Meta:
        verbose_name_plural = 'Transfer Event Records'


class ProductionEvent(models.Model):
    event_id = models.BigAutoField(primary_key=True)
    item_id = models.CharField(max_length=32)
    from_location_link = models.CharField(max_length=32, blank=True, null=True)
    location_link = models.CharField(max_length=32)
    quantity = models.IntegerField(blank=True, null=True)
    timestamp = models.DateTimeField()

    class Meta:
        verbose_name_plural = "Production Event Records"


class ProductionEventInput(models.Model):
    item_id = models.CharField(max_length=32)
    location_link = models.CharField(max_length=32)
    quantity = models.IntegerField(blank=True, null=True)
    production_event = models.ForeignKey(
        ProductionEvent, on_delete=models.CASCADE, related_name="inputs"
    )
    timestamp = models.DateTimeField()


class State(models.Model):
    record_id = models.BigAutoField(primary_key=True)
    item_id = models.CharField(max_length=32)
    location_link = models.CharField(max_length=32)
    start = models.DateTimeField()
    end = models.DateTimeField(blank=True, null=True)
    quantity = models.IntegerField(blank=True, null=True)

    def __str__(self):
        return self.item_id

    class Meta:
        verbose_name_plural = 'State Records'
        indexes = [
            models.Index(fields=['item_id',],name="item_idx"),
            models.Index(fields=['location_link',"item_id","end"], name="loc_link_idx"),
            models.Index(fields=['-start','-end'], name="timestamp_idx"),
        ]

class Setting(models.Model):
    key = models.CharField(max_length=64, primary_key=True)
    value = models.CharField(max_length=256)

    def __str__(self):
        return f"{self.key}: {self.value}"

    class Meta:
        verbose_name_plural = 'Settings'

class Status(models.Model):
    id = models.BigAutoField(primary_key=True)
    label = models.CharField(max_length=64)
    icon = models.CharField(max_length=64, blank=True, null=True)
    color = models.CharField(max_length=16, blank=True, null=True)

    def __str__(self):
        return self.label

    class Meta:
        verbose_name_plural = "Available Statuses"


class ItemStatus(models.Model):
    auto_id = models.BigAutoField(primary_key=True)
    item_id = models.CharField(max_length=32)
    location_link = models.CharField(max_length=32, blank=True, null=True)
    status = models.ForeignKey(Status, on_delete=models.CASCADE, blank=True,null=True)
    timestamp = models.DateTimeField()

    def __str__(self):
        return f"Status of {self.item_id} at {self.timestamp}"

    class Meta:
        verbose_name_plural = 'Item Status Records'
        indexes = [
            models.Index(fields=['item_id',],name="item_status_item_idx"),
            models.Index(fields=['location_link',],name="item_status_loc_link_idx"),
            models.Index(fields=['-timestamp'], name="item_status_timestamp_idx"),
        ]

class Note(models.Model):
    note_id = models.BigAutoField(primary_key=True)
    item_id = models.CharField(max_length=32)
    location_link = models.CharField(max_length=32, blank=True, null=True)
    timestamp = models.DateTimeField()
    text = models.TextField()

    def __str__(self):
        return f"Note on {self.item_id} at {self.timestamp}"

    class Meta:
        verbose_name_plural = "Notes"
        indexes = [
            models.Index(
                fields=[
                    "item_id",
                ],
                name="note_item_idx",
            ),
            models.Index(
                fields=[
                    "location_link",
                ],
                name="note_loc_link_idx",
            ),
            models.Index(fields=["-timestamp"], name="note_timestamp_idx"),
        ]
