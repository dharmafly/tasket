import datetime

from django.db import models
from django.contrib.gis.db import models as geo_models
from django.core.exceptions import ValidationError

import managers

class Task(geo_models.Model):
    
    TIME_ESTIMATE = (
        (60*10, 'Ten Minutes'),
        (60*30, 'Half an Hour'),
        (60*60, 'One Hour'),
        (60*60*2, 'Two hours'),
        (60*60*4, 'Four hours'),
        (60*60*8, 'Eight hours'),
        (60*60*12, 'More than Eight hours'),
    )
    
    title = models.CharField(blank=True, max_length=255)
    person = models.ForeignKey('Person')
    organisation = models.ForeignKey('Organisation', blank=True, null=True)
    time_estimate = models.IntegerField(blank=True, null=True, choices=TIME_ESTIMATE)
    summary = models.TextField(blank=True, null=True)
    created = models.DateTimeField(blank=True, default=datetime.datetime.now)
    expires = models.DateTimeField(blank=True, default=datetime.datetime.now() + datetime.timedelta(30))
    location = geo_models.PointField(spatial_index=True, geography=True, null=True, blank=True)

    objects = managers.TaskManager()

    def __unicode__(self):
        return self.title

    def clean(self):
        existing_tasks = Task.objects.tasks_for_user(self.person)
        if len(existing_tasks) >= 8:
            raise ValidationError('You can only define 8 tasks per person')
    

class Person(geo_models.Model):
    name = models.CharField(blank=True, max_length=255)
    description = models.TextField(blank=True)
    location = geo_models.PointField(spatial_index=True, geography=True, null=True, blank=True)

    def __unicode__(self):
        return self.name


class Organisation(geo_models.Model):
    name = models.CharField(blank=True, max_length=255)
    description = models.TextField(blank=True)
    location = geo_models.PointField(spatial_index=True, geography=True, null=True, blank=True)

    def __unicode__(self):
        return self.name
