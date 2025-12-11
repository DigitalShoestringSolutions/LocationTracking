from django.db.models import Q
from django.http import HttpResponse
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import (
    action,
    api_view,
    permission_classes,
    renderer_classes,
)
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.renderers import JSONRenderer, BrowsableAPIRenderer
from rest_framework.response import Response
from rest_framework_csv.renderers import CSVRenderer
import datetime
import dateutil.parser
from functools import lru_cache 

from .models import State, TransferEvent, ProductionEvent, ProductionEventInput, Setting
from .serializers import (
    StateSerializer,
    TransferEventSerializer,
    ProductionEventInputSerializer,
    ProductionEventSerializer,
)
import logging
import time

logger = logging.getLogger(__name__)

# @lru_cache(maxsize=32)  # beware adding a cache like this can cause recently created items to not be found by search!
def search_by_name_query(query):
    import requests

    response = requests.get(
        f"http://{settings.ID_SERVICE_URL}/id/by-name", params={"q": query}
    )
    if response.status_code == 200:
        return [entry["id"] for entry in response.json()]
    else:
        return []

@api_view(("GET",))
@renderer_classes((JSONRenderer, BrowsableAPIRenderer, CSVRenderer))
def getAll(request):
    at = request.GET.get("t", None)
    query = request.GET.get("q", None)
    q = Q(end__isnull=True) & ~Q(quantity=0)

    if at:
        print(f"get all at {at}")
        at_dt = dateutil.parser.isoparse(at)  # parse "at" to datetime
        q = (q | Q(end__gte=at_dt)) & Q(start__lte=at_dt)

    if query:
        # fetch valid ids matching query
        valid_ids = search_by_name_query(query)
        # logger.info(f"search query '{query}' returned ids: {valid_ids}")
        q = q & Q(item_id__in=valid_ids)

    settings_dict = {s.key: s.value for s in Setting.objects.filter(key__in=["completed_location","completed_duration_days"])}
    completed_location = settings_dict.get("completed_location",None)
    filter_completed = completed_location is not None
    if filter_completed:
        __dt = -1 * (time.timezone if (time.localtime().tm_isdst == 0) else time.altzone)
        tz = datetime.timezone(datetime.timedelta(seconds=__dt))

        end_of_today = datetime.datetime.combine(
            datetime.datetime.now(tz=tz), datetime.datetime.min.time(),tzinfo=tz
        )+ datetime.timedelta(days=1)

        filter_days = int(settings_dict.get("completed_duration_days",1))
        filter_completed_timestamp = end_of_today - datetime.timedelta(days=filter_days)

        q = q & (Q(quantity__isnull=True) | ~(
            Q(start__lte=filter_completed_timestamp)
            & Q(location_link__exact=completed_location)
        ))

    qs = State.objects.filter(q).order_by("-start")
    serializer = StateSerializer(qs, many=True)
    # logger.info(f"results: {serializer.data}")
    return Response(serializer.data)


@api_view(("GET",))
@renderer_classes((JSONRenderer, BrowsableAPIRenderer, CSVRenderer))
def forItem(request, item_id):
    at = request.GET.get("t", None)
    q = Q(end__isnull=True)

    if at:
        print(f"get all at {at}")
        at_dt = dateutil.parser.isoparse(at)  # parse "at" to datetime
        q = (q | Q(end__gte=at_dt)) & Q(start__lte=at_dt)
    q = q & Q(item_id__exact=item_id)
    qs = State.objects.filter(q).order_by("-start")
    serializer = StateSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(("GET",))
@renderer_classes((JSONRenderer, BrowsableAPIRenderer, CSVRenderer))
def atLocLink(request, location_link):
    at = request.GET.get("t", None)
    q = Q(end__isnull=True)

    if at:
        print(f"get all at {at}")
        at_dt = dateutil.parser.isoparse(at)  # parse "at" to datetime
        q = (q | Q(end__gte=at_dt)) & Q(start__lte=at_dt)
    q = q & Q(location_link__exact=location_link)
    qs = State.objects.filter(q).order_by("-start")
    serializer = StateSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(("GET",))
@renderer_classes((JSONRenderer, BrowsableAPIRenderer, CSVRenderer))
def historyAll(request):
    t_start = request.GET.get("from", None)
    t_end = request.GET.get("to", None)
    print(f"history {t_start}>{t_end}")

    q = Q()

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q & (Q(end__gte=start_dt) | Q(end__isnull=True))

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q & Q(start__lte=end_dt)

    qs = State.objects.filter(q).order_by("-start")
    serializer = StateSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(("GET",))
@renderer_classes((JSONRenderer, BrowsableAPIRenderer, CSVRenderer))
def historyFor(request, item_id):
    t_start = request.GET.get("from", None)
    t_end = request.GET.get("to", None)
    print(f"history {t_start}>{t_end}")

    q = Q()

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q & (Q(end__gte=start_dt) | Q(end__isnull=True))

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q & Q(start__lte=end_dt)

    q = q & Q(item_id__exact=item_id)
    qs = State.objects.filter(q).order_by("-start")
    serializer = StateSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(("GET",))
@renderer_classes((JSONRenderer, BrowsableAPIRenderer, CSVRenderer))
def historyAt(request, location_link):
    t_start = request.GET.get("from", None)
    t_end = request.GET.get("to", None)
    print(f"history {t_start}>{t_end}")

    q = Q()

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q & (Q(end__gte=start_dt) | Q(end__isnull=True))

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q & Q(start__lte=end_dt)

    q = q & Q(location_link__exact=location_link)
    qs = State.objects.filter(q).order_by("-start")
    serializer = StateSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(("GET",))
@renderer_classes((JSONRenderer, BrowsableAPIRenderer, CSVRenderer))
def getAllEvents(request):
    t_start = request.GET.get("from", None)
    t_end = request.GET.get("to", None)
    print(f"all events {t_start}>{t_end}")

    q = Q()

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q & Q(timestamp__gte=start_dt)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q & Q(timestamp__lte=end_dt)

    qs = TransferEvent.objects.filter(q).order_by("-timestamp")
    serializer = TransferEventSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(("GET",))
@renderer_classes((JSONRenderer, BrowsableAPIRenderer, CSVRenderer))
def eventsForItem(request, item_id):
    t_start = request.GET.get("from", None)
    t_end = request.GET.get("to", None)
    print(f"all events {t_start}>{t_end}")

    q = Q(item_id__exact=item_id)

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q & Q(timestamp__gte=start_dt)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q & Q(timestamp__lte=end_dt)

    qs = TransferEvent.objects.filter(q).order_by("-timestamp")
    serializer = TransferEventSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(("GET",))
@renderer_classes((JSONRenderer, BrowsableAPIRenderer, CSVRenderer))
def eventsToLocLink(request, location_link):
    t_start = request.GET.get("from", None)
    t_end = request.GET.get("to", None)
    print(f"all events {t_start}>{t_end}")

    q = Q(to_location_link__exact=location_link)

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q & Q(timestamp__gte=start_dt)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q & Q(timestamp__lte=end_dt)

    qs = TransferEvent.objects.filter(q).order_by("-timestamp")
    serializer = TransferEventSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(("GET",))
@renderer_classes((JSONRenderer, BrowsableAPIRenderer, CSVRenderer))
def eventsFromLocLink(request, location_link):
    t_start = request.GET.get("from", None)
    t_end = request.GET.get("to", None)
    print(f"all events {t_start}>{t_end}")

    q = Q(from_location_link__exact=location_link)

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q & Q(timestamp__gte=start_dt)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q & Q(timestamp__lte=end_dt)

    qs = TransferEvent.objects.filter(q).order_by("-timestamp")
    serializer = TransferEventSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(("GET",))
@renderer_classes((JSONRenderer, BrowsableAPIRenderer, CSVRenderer))
def eventsAtLocLink(request, location_link):
    t_start = request.GET.get("from", None)
    t_end = request.GET.get("to", None)
    print(f"all events {t_start}>{t_end}")

    transfer_q = Q(from_location_link__exact=location_link) | Q(
        to_location_link__exact=location_link
    )
    timeframe_q = Q()

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        timeframe_q = timeframe_q & Q(timestamp__gte=start_dt)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        timeframe_q = timeframe_q & Q(timestamp__lte=end_dt)

    qs = TransferEvent.objects.filter(transfer_q & timeframe_q)
    transfer_serializer = TransferEventSerializer(qs, many=True)

    qs_prod = ProductionEvent.objects.filter(
        (
            Q(location_link__exact=location_link)
            | Q(from_location_link__exact=location_link)
        )
        & timeframe_q
    )
    produced_serializer = ProductionEventSerializer(qs_prod, many=True)

    qs_cons = ProductionEventInput.objects.filter(
        Q(location_link__exact=location_link) & timeframe_q
    )
    consumed_serializer = ProductionEventInputSerializer(qs_cons, many=True)

    all = [{**transfer, "type": "transfer"} for transfer in transfer_serializer.data]
    all.extend(
        [{**produced, "type": "produced"} for produced in produced_serializer.data]
    )
    all.extend(
        [{**consumed, "type": "consumed"} for consumed in consumed_serializer.data]
    )

    all.sort(key=lambda entry: entry["timestamp"])

    return Response(all)

@api_view(("GET","POST"))
@renderer_classes((JSONRenderer, BrowsableAPIRenderer))
def settings(request, key):
    if request.method == "GET":
        if key is None or key == "":
            qs = Setting.objects.all()
        else:
            qs = Setting.objects.filter(key=key)
        settings_dict = {s.key: s.value for s in qs}
        return Response(settings_dict)
    elif request.method == "POST":
        for key, value in request.data.items():
            setting_obj, created = Setting.objects.update_or_create(
                key=key, defaults={"value": value}
            )
        qs = Setting.objects.all()
        settings_dict = {s.key: s.value for s in qs}
        return Response(settings_dict)
