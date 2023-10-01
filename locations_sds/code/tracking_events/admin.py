from django.contrib import admin
from django.http import HttpResponse
import csv
from .models import TrackingEvent

class ExportCsvMixin:
    def export_as_csv(self, request, queryset):

        meta = self.model._meta
        field_names = [field.name for field in meta.fields]

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename={}.csv'.format(meta)
        writer = csv.writer(response)

        writer.writerow(field_names)
        for obj in queryset:
            row = writer.writerow([getattr(obj, field) for field in field_names])

        return response

    export_as_csv.short_description = "Export Selected"

class TrackingAdmin(admin.ModelAdmin, ExportCsvMixin):
    list_display = ['job_id','location','timestamp']
    ordering = ['-timestamp']
    search_fields = ['job_id']
    list_filter = ['location']
    actions=["export_as_csv"]

admin.site.register(TrackingEvent,TrackingAdmin)
