from django.contrib.gis import admin
from models import *


class PersonAdmin(admin.GeoModelAdmin):
    pass

class OrganisationAdmin(admin.GeoModelAdmin):
    pass




admin.site.register(Task)
admin.site.register(Person, PersonAdmin)
admin.site.register(Organisation, OrganisationAdmin)