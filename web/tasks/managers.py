# from django.contrib.gis.db import models as geo_models
from django.db import models


class TaskManager(models.Manager):

    def tasks_for_user(self, person):
        return self.filter(person=person)

    def hub_options_for_user(self, user):
        return self.filter(person=person)
