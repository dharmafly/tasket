# -*- coding: utf-8 -*-
import datetime
import time
import json

from django.db import models
# from django.contrib.gis.db import models as geo_models
from django.core.exceptions import ValidationError
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic
from django.contrib.auth.models import User

from django.conf import settings

import managers

from sorl.thumbnail import ImageField

class Task(models.Model):
    """
    A task's JSON object should look like this:
    
        {
            "id": "task_id",          *required (assigned by server on creation)
            "description": null,
            "image": null,
            "estimate": null,
            "state": "new",
            "owner": "user_id",       *required
            "claimedBy": "user_id",
            "verifiedBy": "user_id",
            "createdTime": 1298567873
            "hub": "hub_id",          *required
        }
        
    """
    
    TIME_ESTIMATE = (
        (60*10, 'Ten Minutes'),
        (60*30, 'Half an Hour'),
        (60*60, 'One Hour'),
        (60*60*2, 'Two hours'),
        (60*60*4, 'Four hours'),
        (60*60*8, 'Eight hours'),
        (60*60*12, 'More than Eight hours'),
    )
    
    STATE_NEW       = 'new'
    STATE_CLAIMED   = 'claimed'
    STATE_DONE      = 'done'
    STATE_VERIFIED  = 'verified'
    
    TASK_STATES = (
        (STATE_NEW, 'New'),
        (STATE_CLAIMED, 'Claimed'),
        (STATE_DONE, 'Done'),
        (STATE_VERIFIED, 'Verified'),
    )
    
    description = models.TextField(blank=True, null=True)
    image = ImageField(upload_to="images/tasks/", blank=True, null=True)
    estimate = models.IntegerField(blank=True, null=True, choices=TIME_ESTIMATE)
    state = models.CharField(blank=False, null=False, choices=TASK_STATES, default=STATE_NEW, max_length=10)
    owner = models.ForeignKey('Profile', related_name='tasks_owned')
    claimedBy = models.ForeignKey('Profile', related_name='tasks_claimed', null=True, blank=True)
    verifiedBy = models.ForeignKey('Profile', related_name='tasks_verified', null=True, blank=True)
    createdTime = models.DateTimeField(blank=True, default=datetime.datetime.now)
    claimedTime = models.DateTimeField(blank=True, null=True)
    doneTime = models.DateTimeField(blank=True, null=True)
    verifiedTime = models.DateTimeField(blank=True, null=True)
    hub = models.ForeignKey('Hub')

    objects = managers.TaskManager()
    unverified = managers.UnverifiedTaskManager()

    def __unicode__(self):
        return self.description[:10]
    
    def format_timestamp(self, t):
        if t:
            return int(time.mktime(t.timetuple()))
    

    def as_dict(self):
        """
        Custom method for returning specifically formatted JSON.

        Handy for outputting related objects as a list, etc.
        
        """
        obj_dict = {
            "id": str(self.pk),
            "description": self.description.strip(),
            "estimate": self.estimate,
            "state" : self.state,
            "owner" : str(self.owner.user.pk),
            "claimedBy" : None,
            "verifiedBy" : None,
            "createdTime" : self.format_timestamp(self.createdTime),
            "claimedTime" : self.format_timestamp(self.claimedTime),
            "doneTime" : self.format_timestamp(self.doneTime),
            "verifiedTime" : self.format_timestamp(self.verifiedTime),
            "hub" : str(self.hub.pk),
        }
        
        if self.image:
            obj_dict["image"] = self.image.url

        if self.claimedBy:
            obj_dict["claimedBy"] = str(self.claimedBy.user.pk)
        if self.verifiedBy:
            obj_dict["verifiedBy"] = str(self.verifiedBy.user.pk)
        
        for k,v in obj_dict.items():
            if v == None:
                obj_dict[k] = ""
        return obj_dict

    def as_json(self):
        """
        Dumps the objects as_dict method in to JSON.
        """
        return json.dumps(self.as_dict())


class Hub(models.Model):
    """
    Stores collections of tasks.  A 'hub' JSON object should look like this:
    
        {
        "id": "hub_id",         *required (assigned by server on creation)
        "title": null,          *required
        "description": null,
        "image": null,
        "owner": "user_id"      *required
        "tasks": [/* unverified task ids */]
        "createdTime": 1298567873
        }
    """
    
    title = models.CharField(blank=False, max_length=255)
    description = models.TextField(blank=True, null=True)
    image = ImageField(upload_to='images/hubs/', null=True, blank=True)
    owner = models.ForeignKey('Profile', related_name="owned_hubs")
    createdTime = models.DateTimeField(blank=True, default=datetime.datetime.now)
    
    # objects = managers.HubManager()
    objects = managers.HubManager()
    unverified = managers.UnVerifiedHubManager()
    
    def __unicode__(self):
        return u"%s" % self.title

    class Meta:
        ordering = ('-id',)

    def created_timestamp(self):
        return int(time.mktime(self.createdTime.timetuple()))

    def as_dict(self):
        """
        Custom method for returning specifically formatted JSON.
    
        Handy for outputting related objects as a list, etc.
        """
        obj_dict = {
            "id": str(self.pk),
            "title": self.title.strip(),
            "description": self.description.strip(),
            "owner": str(self.owner.user.pk),
            "tasks": [str(t.pk) for t in self.task_set.all()],
            "createdTime": self.created_timestamp(),
        }
        
        if self.image:
            obj_dict["image"] = self.image.url

        for k,v in obj_dict.items():
            if v == None:
                obj_dict[k] = ""
        
        return obj_dict

    def as_json(self):
        """
        Dumps the objects as_dict method in to JSON.
        """
        return json.dumps(self.as_dict())



class Profile(models.Model):
    user = models.OneToOneField(User, primary_key=True)
    name = models.CharField(blank=True, max_length=255)
    description = models.TextField(blank=True)
    location = models.CharField(blank=True, max_length=255)
    image = ImageField(upload_to='images/users/', null=True, blank=True)
    createdTime = models.DateTimeField(blank=True, default=datetime.datetime.now)
    admin = models.BooleanField(default=False)

    objects = managers.ProfileManager()

    def __unicode__(self):
        return u"%s" % self.user

    def created_timestamp(self):
        return int(time.mktime(self.createdTime.timetuple()))

    def as_dict(self):
        obj_dict = {
            "id": str(self.user.pk),
            "name": self.name.strip(),
            "admin": self.admin,
            "description": self.description.strip(),
            "location": self.location.strip(),
            "hubs": {
                "owned": [str(h.pk) for h in self.owned_hubs.all()],
                },
            "tasks" : {
                "owned": {
                    "new": [str(t.pk) for t in self.tasks_owned.filter(state=Task.STATE_NEW)],
                    "claimed": [str(t.pk) for t in self.tasks_owned.filter(state=Task.STATE_CLAIMED)],
                    "done": [str(t.pk) for t in self.tasks_owned.filter(state=Task.STATE_DONE)],
                    "verified": [str(t.pk) for t in self.tasks_owned.filter(state=Task.STATE_VERIFIED)],
                },
                "claimed": {
                    "claimed": [str(t.pk) for t in self.tasks_claimed.filter(state=Task.STATE_CLAIMED)],
                    "done": [str(t.pk) for t in self.tasks_claimed.filter(state=Task.STATE_DONE)],
                    "verified": [str(t.pk) for t in self.tasks_claimed.filter(state=Task.STATE_VERIFIED)],
                },
            },
            "createdTime": self.created_timestamp(),
        }
        
        if self.image:
            obj_dict["image"] = self.image.url

        for k,v in obj_dict.items():
            if v == None:
                obj_dict[k] = ""
        return obj_dict
        
    def as_json(self):
        return json.dumps(self.as_dict())
        