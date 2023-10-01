from django.db import models

# Create your models here.
class TrackingEvent(models.Model):
    EVENT_TYPES = ( ('I','Arrival'),('O','Departure') )
    event_id = models.AutoField(primary_key=True)
    job_id = models.CharField(max_length=60)   # put max_length in config
    location = models.CharField(max_length=60) # separate table of locations
    event_type = models.CharField(max_length=1,choices=EVENT_TYPES)
    timestamp = models.DateTimeField()

    def __str__(self):
        return self.job_id
