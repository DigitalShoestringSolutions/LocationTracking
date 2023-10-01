from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import TrackingEvent
from .serializers import TrackingEventSerializer
from datetime import datetime
import dateutil.parser as dtparser

class Search(viewsets.ReadOnlyModelViewSet):
    serializer_class = TrackingEventSerializer

    def get_queryset(self):
        from_param = self.request.query_params.get('from',None)
        to_param = self.request.query_params.get('to',None)
        job_param = self.request.query_params.get('job',None)
        job_contains_param = self.request.query_params.get('jobc',None)
        job_re_param = self.request.query_params.get('jobre',None)
        
        if from_param:
            from_ts = dtparser.parse(from_param)
        if to_param:
            to_ts = dtparser.parse(to_param)

        events = TrackingEvent.objects.all()
        
        if to_param and from_param:
            events = events.filter(timestamp__range=(from_ts,to_ts))
        elif to_param:
            events = events.filter(timestamp__lt=to_ts)
        elif from_param:
            events = events.filter(timestamp__gt=from_ts)

        if job_param:
            events = events.filter(job_id__iexact=job_param)
        elif job_contains_param:
            events = events.filter(job_id__icontains=job_contains_param)
        elif job_re_param:
            events = events.filter(job_id__iregex=job_re_param)
            
        events.order_by('-timestamp')
        return events


