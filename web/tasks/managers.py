from django.contrib.gis.db import models as geo_models


class TaskManager(geo_models.GeoManager):

    def tasks_for_user(self, person):
        return self.filter(person=person)