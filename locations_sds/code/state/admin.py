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

