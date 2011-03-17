from django.contrib import admin
from models import *

# class TaskInline(generic.GenericTabularInline):
#     model = Task


class HubAdmin(admin.ModelAdmin):
    pass
#     inlines = [
#         TaskInline,
#     ]




admin.site.register(Task)
admin.site.register(Hub, HubAdmin)
