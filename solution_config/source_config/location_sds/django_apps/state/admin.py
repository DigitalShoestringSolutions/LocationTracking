from django.contrib import admin
from . import models
# from adminsortable.admin import SortableAdmin
import datetime
import time

@admin.register(models.State)
class StateAdmin(admin.ModelAdmin):
    list_display = ['record_id','item_id','location_link','start','end','quantity']
    fields = ('record_id','item_id','location_link','start','end','quantity')
    readonly_fields = ('record_id',)
    list_filter = ['location_link']
    ordering = ['item_id']

@admin.register(models.TransferEvent)
class TransferEventAdmin(admin.ModelAdmin):
    list_display = ['event_id','item_id','from_location_link','to_location_link','timestamp','quantity']
    fields = ('event_id','item_id','from_location_link','to_location_link','timestamp','quantity')
    readonly_fields = ('event_id',)
    list_filter = ['item_id','to_location_link']
    ordering = ['event_id']


class InputsInline(admin.TabularInline):
    model = models.ProductionEventInput
    extra = 0


@admin.register(models.ProductionEvent)
class ProductionEventAdmin(admin.ModelAdmin):
    list_display = [
        "event_id",
        "item_id",
        "location_link",
        "timestamp",
        "quantity",
    ]
    fields = (
        "event_id",
        "item_id",
        "location_link",
        "timestamp",
        "quantity"
    )
    readonly_fields = ("event_id",)
    list_filter = ["item_id", "location_link"]
    ordering = ["event_id"]
    inlines = [InputsInline]

@admin.register(models.Setting)
class SettingAdmin(admin.ModelAdmin):
    list_display = ['key','value']
    fields = ('key','value')
    ordering = ['key']

from .admin_form import StatusForm

@admin.register(models.Status)
class StatusAdmin(admin.ModelAdmin):
    # look at change_list_template and https://github.com/django/django/blob/main/django/contrib/admin/templates/admin/change_list.html to add color representation in list view
    form = StatusForm
    list_display = ['label','color','icon']

@admin.register(models.ItemStatus)
class ItemStatusAdmin(admin.ModelAdmin):
    list_display = ['item_id','location_link','status']

@admin.register(models.Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ['note_id','item_id','location_link']
