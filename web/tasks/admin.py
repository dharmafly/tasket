from django.contrib.gis import admin
from models import *

class TaskInline(generic.GenericTabularInline):
    model = Task


class PersonAdmin(admin.GeoModelAdmin):
    pass

class OrganisationAdmin(admin.GeoModelAdmin):
    pass

class HubAdmin(admin.ModelAdmin):
    inlines = [
        TaskInline,
    ]




admin.site.register(Task)
admin.site.register(HubMember, HubAdmin)
admin.site.register(Person, PersonAdmin)
admin.site.register(Organisation, OrganisationAdmin)