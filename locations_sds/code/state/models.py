from django.db import models
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
    
