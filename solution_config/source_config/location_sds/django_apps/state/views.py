from django.db.models import Q
from django.http import HttpResponse
from django.conf import settings as django_settings
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
import csv

from .models import (
    State,
    TransferEvent,
    ProductionEvent,
    ProductionEventInput,
    Setting,
    Status,
    ItemStatus,
    Note,
)
from .serializers import (
    StateSerializer,
    TransferEventSerializer,
    ProductionEventInputSerializer,
    ProductionEventSerializer,
    StatusSerializer,
    NoteSerializer,
)
import logging
import time
import requests

import event_handler

logger = logging.getLogger(__name__)


# @lru_cache(maxsize=32)  # beware adding a cache like this can cause recently created items to not be found by search!
def search_by_name_query(query):

    response = requests.get(
        f"http://{django_settings.ID_SERVICE_URL}/id/by-name", params={"q": query}
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

    qs = query_all_state(at, query)

    serializer = StateSerializer(qs, many=True)
    # logger.info(f"results: {serializer.data}")
    return Response(serializer.data)


def query_all_state(at, search_query):
    q = Q(end__isnull=True) & ~Q(quantity=0)

    if at:
        print(f"get all at {at}")
        at_dt = dateutil.parser.isoparse(at)  # parse "at" to datetime
        q = (q | Q(end__gte=at_dt)) & Q(start__lte=at_dt)

    if search_query:
        # fetch valid ids matching query
        valid_ids = search_by_name_query(search_query)
        # logger.info(f"search query '{query}' returned ids: {valid_ids}")
        q = q & Q(item_id__in=valid_ids)

    settings_dict = {
        s.key: s.value
        for s in Setting.objects.filter(
            key__in=["completed_location", "completed_duration_days"]
        )
    }
    completed_location = settings_dict.get("completed_location", None)
    filter_completed = completed_location is not None
    if filter_completed:
        __dt = -1 * (
            time.timezone if (time.localtime().tm_isdst == 0) else time.altzone
        )
        tz = datetime.timezone(datetime.timedelta(seconds=__dt))

        end_of_today = datetime.datetime.combine(
            datetime.datetime.now(tz=tz), datetime.datetime.min.time(), tzinfo=tz
        ) + datetime.timedelta(days=1)

        filter_days = int(settings_dict.get("completed_duration_days", 1))
        filter_completed_timestamp = end_of_today - datetime.timedelta(days=filter_days)

        q = q & (Q(quantity__isnull=False) | ~(
            Q(start__lte=filter_completed_timestamp)
            & Q(location_link__exact=completed_location)
        ))

    return State.objects.filter(q).order_by("-start")


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

    qs = query_all_events(t_start, t_end)

    serializer = TransferEventSerializer(qs, many=True)
    return Response(serializer.data)


def query_all_events(t_start, t_end):
    q = Q()

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q & Q(timestamp__gte=start_dt)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q & Q(timestamp__lte=end_dt)

    return TransferEvent.objects.filter(q).order_by("-timestamp")


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


@api_view(("GET", "POST"))
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

@api_view(("GET",))
@renderer_classes((JSONRenderer, BrowsableAPIRenderer))
def list_status_options(request):
    qs = Status.objects.all()
    serializer = StatusSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(("GET", "POST"))
@renderer_classes((JSONRenderer, BrowsableAPIRenderer))
def handle_status(request, id):
    item = get_item(id)

    if request.method == "GET":
        location = request.GET.get("location")

        q = Q(item_id=id)
        if location and item["individual"] != True:
            q = q & Q(location_link=location)

        qs = ItemStatus.objects.filter(q)

        if len(qs) > 1:
            logger.warning("Got multiple entries")

        if len(qs) == 0:
            status = None
        else:
            status = qs.first().status

        if status:
            serializer = StatusSerializer(status)
            return Response(serializer.data)
        else:
            return Response({"id": None, "label": "None", "icon": None, "color": None})
    elif request.method == "POST":
        raw_status = request.data.get("status")
        location = request.data.get("location")

        if item["individual"] == True:
            location = None

        if raw_status is not None:
            new_status = Status.objects.get(id=raw_status)
        else:
            new_status = None
        item_status, _created = ItemStatus.objects.get_or_create(
            item_id=id,
            location_link=location,
            defaults={
                "status": None,
                "timestamp": datetime.datetime.now(datetime.timezone.utc),
            },
        )
        item_status.status = new_status
        item_status.timestamp = datetime.datetime.now(datetime.timezone.utc)
        item_status.save()

        # send update
        update = event_handler.Event(
            f"location_state/status/{id}",
            {"item_id": id, "status": new_status.id if new_status else None},
        )
        event_handler.send_events([update])

        return Response()


@api_view(("GET", "POST", "DELETE"))
@renderer_classes((JSONRenderer, BrowsableAPIRenderer))
def handle_notes(request, id):
    if request.method == "GET":
        qs = Note.objects.filter(item_id=id).order_by("-timestamp")
        serializer = NoteSerializer(qs, many=True)
        return Response(serializer.data)
    elif request.method == "POST":
        note_id = request.data.get("note_id")
        location = request.data.get("location")
        text = request.data.get("text")

        if note_id:
            note = Note.objects.get(pk=note_id)
            note.text = text
            note.save()
        else:
            Note.objects.create(
                text=text,
                item_id=id,
                location_link=location,
                timestamp=datetime.datetime.now(datetime.timezone.utc),
            )

        return Response()


@api_view(("DELETE",))
@renderer_classes((JSONRenderer, BrowsableAPIRenderer))
def handle_note(request, note_id):
    if request.method == "DELETE":
        Note.objects.get(pk=note_id).delete()
        return Response()


@api_view(("GET",))
@renderer_classes((JSONRenderer, BrowsableAPIRenderer))
def report(request):
    type = request.GET.get("type")
    start = request.GET.get("start")
    end = request.GET.get("end")

    response = HttpResponse(
        content_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="somefilename.csv"'},
    )
    csvwriter = csv.writer(response)

    match (type):
        case "state":
            qs = query_all_state(end, None)
            serializer = StateSerializer(qs, many=True)
            details_needed = set()
            for entry in serializer.data:
                details_needed.add(entry["item_id"])
                details_needed.add(entry["location_link"])
            details_dict = get_all_details(list(details_needed))

            csvwriter.writerow(
                [
                    "Item ID",
                    "Item Type",
                    "Item Name",
                    "Parent ID",
                    "Parent Type",
                    "Parent Name",
                    "Quantity",
                ]
            )

            for entry in serializer.data:
                item_id = entry["item_id"]
                item_details = details_dict[item_id]

                parent_id = entry["location_link"]
                parent_details = details_dict[parent_id]
                csvwriter.writerow(
                    [
                        item_id,
                        item_details["type"],
                        item_details["name"],
                        parent_id,
                        parent_details["type"],
                        parent_details["name"],
                        entry["quantity"],
                    ]
                )
        case "transfer":
            qs = query_all_events(start, end)
            serializer = TransferEventSerializer(qs, many=True)

            details_needed = set()
            for entry in serializer.data:
                details_needed.add(entry["item_id"])
                details_needed.add(entry["from_location_link"])
                details_needed.add(entry["to_location_link"])
            details_dict = get_all_details(list(details_needed))

            csvwriter.writerow(
                [
                    "Item ID",
                    "Item Type",
                    "Item Name",
                    "From ID",
                    "From Type",
                    "From Name",
                    "To ID",
                    "To Type",
                    "To Name",
                    "Timestamp"
                    "Quantity",
                ]
            )

            for entry in serializer.data:
                item_id = entry["item_id"]
                item_details = details_dict[item_id]

                from_id = entry["from_location_link"]
                from_details = details_dict[from_id]

                to_id = entry["to_location_link"]
                to_details = details_dict[to_id]
                csvwriter.writerow(
                    [
                        item_id,
                        item_details["type"],
                        item_details["name"],
                        from_id,
                        from_details["type"] if from_id else "",
                        from_details["name"] if from_id else "",
                        to_id,
                        to_details["type"],
                        to_details["name"],
                        entry["timestamp"],
                        entry["quantity"],
                    ]
                )
        case "production":
            # q = Q()

            # if start:
            #     start_dt = dateutil.parser.isoparse(start)
            #     timeframe_q = timeframe_q & Q(timestamp__gte=start_dt)

            # if end:
            #     end_dt = dateutil.parser.isoparse(end)
            #     timeframe_q = timeframe_q & Q(timestamp__lte=end_dt)

            # qs = ProductionEvent.objects.filter(q)
            # serializer = ProductionEventSerializer
            # TODO: work out how best to present production events in csv format
            pass
    return response


@lru_cache
def get_item(id: str):
    response = requests.get(
        f"http://{django_settings.ID_SERVICE_URL}/id/{id}",
    )
    if response.status_code == 200:
        return response.json()
    else:
        return None


def get_all_details(ids: list[str]):
    response = requests.get(
        f"http://{django_settings.ID_SERVICE_URL}/id",
        params={"id": ids, "pretty": True},
    )
    if response.status_code == 200:
        details = {entry["id"]: entry for entry in response.json()}
    else:
        details = {}

    return {
        id: details.get(id, {"name": "Not Found", "type": "Not Found"}) for id in ids
    }
