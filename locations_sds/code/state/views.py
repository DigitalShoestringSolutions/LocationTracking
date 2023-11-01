from django.db.models import Q
from django.http import HttpResponse
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes, renderer_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.renderers import JSONRenderer, BrowsableAPIRenderer
from rest_framework.response import Response
from rest_framework_csv.renderers import CSVRenderer
import datetime
import dateutil.parser

from .models import State, Event
from .serializers import StateSerializer, EventSerializer

@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def getAll(request):
    at = request.GET.get('t', None)
    q = Q(end__isnull=True) & ~Q(quantity=0)

    if at:
        print(f"get all at {at}")
        at_dt = dateutil.parser.isoparse(at) #parse "at" to datetime
        q = ( q | Q(end__gte=at_dt) ) & Q(start__lte=at_dt)
    qs = State.objects.filter(q).order_by('-start')
    serializer = StateSerializer(qs,many=True)
    return Response(serializer.data)

@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def forItem(request,item_id):
    at = request.GET.get('t', None)
    q = Q(end__isnull=True)

    if at:
        print(f"get all at {at}")
        at_dt = dateutil.parser.isoparse(at) #parse "at" to datetime
        q = ( q | Q(end__gte=at_dt) ) & Q(start__lte=at_dt)
    q = q & Q(item_id__exact=item_id)
    qs = State.objects.filter(q).order_by('-start')
    serializer = StateSerializer(qs,many=True)
    return Response(serializer.data)

@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def atLocLink(request,location_link):
    at = request.GET.get('t', None)
    q = Q(end__isnull=True)

    if at:
        print(f"get all at {at}")
        at_dt = dateutil.parser.isoparse(at) #parse "at" to datetime
        q = ( q | Q(end__gte=at_dt) ) & Q(start__lte=at_dt)
    q = q & Q(location_link__exact=location_link)
    qs = State.objects.filter(q).order_by('-start')
    serializer = StateSerializer(qs,many=True)
    return Response(serializer.data)

@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def historyAll(request):
    t_start = request.GET.get('from', None)
    t_end = request.GET.get('to', None)
    print(f"history {t_start}>{t_end}")
    
    q = Q()

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q&Q(end__gte=start_dt)|Q(end__isnull=True)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q&Q(start__lte=end_dt)
        
    qs = State.objects.filter(q).order_by('-start')
    serializer = StateSerializer(qs,many=True)
    return Response(serializer.data)

@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def historyFor(request,item_id):
    t_start = request.GET.get('from', None)
    t_end = request.GET.get('to', None)
    print(f"history {t_start}>{t_end}")
    
    q = Q()

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q&Q(end__gte=start_dt)|Q(end__isnull=True)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q&Q(start__lte=end_dt)
        
    q = q & Q(item_id__exact=item_id)
    qs = State.objects.filter(q).order_by('-start')
    serializer = StateSerializer(qs,many=True)
    return Response(serializer.data)

@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def historyAt(request,location_link):
    t_start = request.GET.get('from', None)
    t_end = request.GET.get('to', None)
    print(f"history {t_start}>{t_end}")
    
    q = Q()

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q&Q(end__gte=start_dt)|Q(end__isnull=True)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q&Q(start__lte=end_dt)
        
    q = q & Q(location_link__exact=location_link)
    qs = State.objects.filter(q).order_by('-start')
    serializer = StateSerializer(qs,many=True)
    return Response(serializer.data)

@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def getAllEvents(request):
    t_start = request.GET.get('from', None)
    t_end = request.GET.get('to', None)
    print(f"all events {t_start}>{t_end}")
    
    q = Q()

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q&Q(timestamp__gte=start_dt)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q&Q(timestamp__lte=end_dt)
        
    qs = Event.objects.filter(q).order_by('-timestamp')
    serializer = EventSerializer(qs,many=True)
    return Response(serializer.data)

 
@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def eventsForItem(request,item_id):
    t_start = request.GET.get('from', None)
    t_end = request.GET.get('to', None)
    print(f"all events {t_start}>{t_end}")
    
    q = Q(item_id__exact=item_id)

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q&Q(timestamp__gte=start_dt)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q&Q(timestamp__lte=end_dt)
        
    qs = Event.objects.filter(q).order_by('-timestamp')
    serializer = EventSerializer(qs,many=True)
    return Response(serializer.data)


@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def eventsToLocLink(request,location_link):
    t_start = request.GET.get('from', None)
    t_end = request.GET.get('to', None)
    print(f"all events {t_start}>{t_end}")
    
    q = Q(to_location_link__exact=location_link)

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q&Q(timestamp__gte=start_dt)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q&Q(timestamp__lte=end_dt)
        
    qs = Event.objects.filter(q).order_by('-timestamp')
    serializer = EventSerializer(qs,many=True)
    return Response(serializer.data)


@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def eventsFromLocLink(request,location_link):
    t_start = request.GET.get('from', None)
    t_end = request.GET.get('to', None)
    print(f"all events {t_start}>{t_end}")
    
    q = Q(from_location_link__exact=location_link)

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q&Q(timestamp__gte=start_dt)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q&Q(timestamp__lte=end_dt)
        
    qs = Event.objects.filter(q).order_by('-timestamp')
    serializer = EventSerializer(qs,many=True)
    return Response(serializer.data)

 
@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def eventsAtLocLink(request,location_link):
    t_start = request.GET.get('from', None)
    t_end = request.GET.get('to', None)
    print(f"all events {t_start}>{t_end}")
    
    q = (Q(from_location_link__exact=location_link)|Q(to_location_link__exact=location_link))

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q&Q(timestamp__gte=start_dt)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q&Q(timestamp__lte=end_dt)
        
    qs = Event.objects.filter(q).order_by('-timestamp')
    serializer = EventSerializer(qs,many=True)
    return Response(serializer.data)

 
