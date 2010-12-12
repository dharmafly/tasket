import datetime

from django.db import models
# from django.contrib.gis.db import models as geo_models
from django.core.exceptions import ValidationError
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic
from django.contrib.auth.models import User


import managers

class Task(models.Model):
    
    TIME_ESTIMATE = (
        (60*10, 'Ten Minutes'),
        (60*30, 'Half an Hour'),
        (60*60, 'One Hour'),
        (60*60*2, 'Two hours'),
        (60*60*4, 'Four hours'),
        (60*60*8, 'Eight hours'),
        (60*60*12, 'More than Eight hours'),
    )
    
    title = models.CharField(blank=False, max_length=255)
    content_type = models.ForeignKey(ContentType)
    object_id = models.CharField(blank=False, null=False, max_length=100)
    hub = generic.GenericForeignKey('content_type', 'object_id')
    time_estimate = models.IntegerField(blank=True, null=True, choices=TIME_ESTIMATE)
    summary = models.TextField(blank=True, null=True)
    created = models.DateTimeField(blank=True, default=datetime.datetime.now)
    expires = models.DateTimeField(blank=True, default=datetime.datetime.now() + datetime.timedelta(30))
    # location = geo_models.PointField(spatial_index=True, geography=True, null=True, blank=True)

    objects = managers.TaskManager()

    def __unicode__(self):
        return self.title

    # def clean(self):
    #     existing_tasks = Task.objects.tasks_for_user(self.person)
    #     if len(existing_tasks) >= 8:
    #         raise ValidationError('You can only have 8 tasks at a time')

class HubMember(models.Model):
    name = models.CharField(blank=True, max_length=255)
    tasks = generic.GenericRelation(Task)

class Person(HubMember):

    user = models.OneToOneField(User)
    description = models.TextField(blank=True)
    # location = geo_models.PointField(spatial_index=True, geography=True, null=True, blank=True)

    def __unicode__(self):
        return self.name
        
    def hub_name(self):
        return self.name

class Organisation(HubMember):
    description = models.TextField(blank=True)
    # location = geo_models.PointField(spatial_index=True, geography=True, null=True, blank=True)

    def __unicode__(self):
        return self.name

    def hub_name(self):
        return self.name

