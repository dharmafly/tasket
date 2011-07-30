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
from django.db.models import Sum
from django.db.models import signals
from django.dispatch import dispatcher

from django.conf import settings

from utils.fields import UnixTimestampField, TaskListField
import managers

from sorl.thumbnail import ImageField

class StarredModel(models.Model):
    """
    Abstract base class for models with stars attached to them.
    """
    
    class Meta:
        abstract = True
            
    def starred(self, user=None):
        """
        Returns a QuerySet of Star objects for this model.
        
        If a user object is supplied, then only return a single object that
        matches the user.
        """
        star_type = self._meta.verbose_name

        if not user:
            # All stars (for all users) for this object
            return Star.objects.filter(star_type=star_type, object_id=self.pk)
        
        # An object can only be starred once per user, so use. get to return a 
        # single object.
        try:
            star = Star.objects.get(star_type=star_type, object_id=self.pk, user=user)
            return star
        except Star.DoesNotExist:
            return None

class Task(StarredModel):
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
    estimate = models.IntegerField(blank=True, null=True)
    state = models.CharField(blank=False, null=False, choices=TASK_STATES, default=STATE_NEW, max_length=10)
    owner = models.ForeignKey('Profile', related_name='tasks_owned')
    claimedBy = models.ForeignKey('Profile', related_name='tasks_claimed', null=True, blank=True)
    verifiedBy = models.ForeignKey('Profile', related_name='tasks_verified', null=True, blank=True)
    createdTime = UnixTimestampField(blank=True, default=datetime.datetime.now)
    claimedTime = UnixTimestampField(blank=True, null=True)
    doneTime = UnixTimestampField(blank=True, null=True)
    verifiedTime = UnixTimestampField(blank=True, null=True)
    hub = models.ForeignKey('Hub')

    objects = managers.TaskManager()
    unverified = managers.UnverifiedTaskManager()
    
    def __unicode__(self):
        return self.description[:10]
    
    def format_timestamp(self, t):
        if t:
            if isinstance(t, int):
                return t
            return int(time.mktime(t.timetuple()))

    def as_dict(self, request_user=None):
        """
        Custom method for returning specifically formatted JSON.

        Handy for outputting related objects as a list, etc.
        
        """
        
        obj_dict = {
            "id": str(self.pk),
            "description": self.description.strip(),
            "state" : self.state,
            "owner" : str(self.owner.user.pk),
            "claimedBy" : None,
            "verifiedBy" : None,
            "createdTime" : self.format_timestamp(self.createdTime),
            "hub" : str(self.hub.pk),
        }
        
        if self.estimate:
            obj_dict["estimate"] = self.estimate
        if self.image:
            obj_dict["image"] = self.image.name
        if self.claimedBy:
            obj_dict["claimedBy"] = str(self.claimedBy.user.pk)
        if self.verifiedBy:
            obj_dict["verifiedBy"] = str(self.verifiedBy.user.pk)
        if self.claimedTime: 
            obj_dict["claimedTime"] = self.format_timestamp(self.claimedTime)
        if self.doneTime: 
            obj_dict["doneTime"] = self.format_timestamp(self.doneTime)
        if self.verifiedTime: 
            obj_dict["verifiedTime"] = self.format_timestamp(self.verifiedTime)
        
        if request_user and request_user.is_authenticated():
            star = self.starred(user=request_user)
            if star:
                obj_dict["starred"] = star.as_dict()
        
        if self.hub.archived_by:
            obj_dict['archived'] = True
        
        for k,v in obj_dict.items():
            if v == None:
                obj_dict[k] = ""
        return obj_dict

    def as_json(self, **kwargs):
        """
        Dumps the objects as_dict method in to JSON.
        """
        return json.dumps(self.as_dict(**kwargs))

def task_post_save(sender, instance, signal, *args, **kwargs):
    instance.hub.save()
models.signals.post_save.connect(task_post_save, sender=Task)



class Hub(StarredModel):
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
    createdTime = UnixTimestampField(blank=True, default=datetime.datetime.now)
    task_order = TaskListField(blank=True, null=True)
    archived_time = UnixTimestampField(blank=True, null=True)
    archived_by = models.ForeignKey('Profile', related_name="archived_hubs", null=True, blank=True)
    
    # objects = managers.HubManager()
    objects = managers.HubManager()
    unverified = managers.UnVerifiedHubManager()
    
    def __unicode__(self):
        return u"%s" % self.title

    class Meta:
        ordering = ('-id',)

    def update_task_list(self):
        task_order = []
        task_order_raw = self.task_order or []
        hub_task_ids = [str(o.pk) for o in self.task_set.all()]
        for t in task_order_raw:
            if t in hub_task_ids:
                task_order.append(t)
        self.task_order = task_order

    def save(self, *args, **kwargs):
        self.update_task_list()
        super(Hub, self).save(*args, **kwargs)
    
    def created_timestamp(self):
        return int(time.mktime(self.createdTime.timetuple()))

    def archived_timestamp(self):
        return int(time.mktime(self.archived_time.timetuple()))
    
    
    def as_dict(self, request_user=None):
        """
        Custom method for returning specifically formatted JSON.
    
        Handy for outputting related objects as a list, etc.
        """
        
        def format_estimate_list(qs):
            return qs.aggregate(estimate=Sum('estimate'))['estimate'] or 0

        def format_id_list(qs):
            return [str(o.pk) for o in qs]
        
        # Querysets for 'Tasks' and 'Estimates' properties.
        new_qs      = self.task_set.filter(state=Task.STATE_NEW)
        claimed_qs  = self.task_set.filter(state=Task.STATE_CLAIMED)
        done_qs     = self.task_set.filter(state=Task.STATE_DONE)
        verified_qs = self.task_set.filter(state=Task.STATE_VERIFIED)
        
        obj_dict = {
            "id": str(self.pk),
            "title": self.title.strip(),
            "description": self.description.strip(),
            "owner": str(self.owner.user.pk),
            "tasks": {
                        "new" : format_id_list(new_qs),
                        "claimed" : format_id_list(claimed_qs),
                        "done" : format_id_list(done_qs),
                        "verified" : format_id_list(verified_qs),
                     },
            "estimates": {
                        "new" : format_estimate_list(new_qs),
                        "claimed" : format_estimate_list(claimed_qs),
                        "done" : format_estimate_list(done_qs),
                        "verified" : format_estimate_list(verified_qs),
                     },
            "createdTime": self.created_timestamp(),
        }
        
        if self.image:
            obj_dict["image"] = self.image.name
        
        if self.task_order:
            obj_dict["tasks"]["order"] = self.task_order
        
        if request_user and request_user.is_authenticated():
            star = self.starred(user=request_user)
            if star:
                obj_dict["starred"] = star.as_json()
        
        if self.archived_time and self.archived_by:
            obj_dict['archived'] = {
                "timestamp" : self.archived_timestamp(),
                "archivedBy" : str(self.archived_by.pk),
            }
        
        for k,v in obj_dict.items():
            if v == None:
                obj_dict[k] = ""
        
        return obj_dict

    def as_json(self, **kwargs):
        """
        Dumps the objects as_dict method in to JSON.
        """
        return json.dumps(self.as_dict(**kwargs))


class Profile(StarredModel):
    user = models.OneToOneField(User, primary_key=True)
    name = models.CharField(blank=True, max_length=255)
    description = models.TextField(blank=True)
    location = models.CharField(blank=True, max_length=255)
    image = ImageField(upload_to='images/users/', null=True, blank=True)
    createdTime = UnixTimestampField(blank=True, default=datetime.datetime.now)
    admin = models.BooleanField(default=False)

    objects = managers.ProfileManager()

    def __unicode__(self):
        return u"%s" % self.user

    def created_timestamp(self):
        return int(time.mktime(self.createdTime.timetuple()))

    def as_dict(self, request_user=None):
        
        def format_estimate_list(qs):
            return qs.aggregate(estimate=Sum('estimate'))['estimate'] or 0

        def format_id_list(qs, id_attr='pk'):
            return [str(getattr(o, id_attr)) for o in qs]
        
        # Querysets for 'Tasks' and 'Estimates' properties.
        owned_new_qs      = self.tasks_owned.filter(state=Task.STATE_NEW)
        owned_claimed_qs  = self.tasks_owned.filter(state=Task.STATE_CLAIMED)
        owned_done_qs     = self.tasks_owned.filter(state=Task.STATE_DONE)
        owned_verified_qs = self.tasks_owned.filter(state=Task.STATE_VERIFIED)
        claimed_new_qs      = self.tasks_claimed.filter(state=Task.STATE_NEW)
        claimed_claimed_qs  = self.tasks_claimed.filter(state=Task.STATE_CLAIMED)
        claimed_done_qs     = self.tasks_claimed.filter(state=Task.STATE_DONE)
        claimed_verified_qs = self.tasks_claimed.filter(state=Task.STATE_VERIFIED)
        starred_tasks_qs    = self.star_set.filter(star_type='task')
        starred_hubs_qs    = self.star_set.filter(star_type='hub')
        starred_users_qs    = self.star_set.filter(star_type='profile')
        
        obj_dict = {
            "id": str(self.user.pk),
            "name": self.name.strip(),
            "username": self.user.username,
            "admin": self.admin,
            "description": self.description.strip(),
            "location": self.location.strip(),
            "hubs": {
                "owned": [str(h.pk) for h in self.owned_hubs.all()],
                "archived" : [str(h.pk) for h in self.owned_hubs.exclude(archived_by=None)]
                },
            "tasks" : {
                "owned": {
                    "new": format_id_list(owned_new_qs),
                    "claimed": format_id_list(owned_claimed_qs),
                    "done": format_id_list(owned_done_qs),
                    "verified": format_id_list(owned_verified_qs),
                },
                "claimed": {
                    "claimed": format_id_list(claimed_claimed_qs),
                    "done": format_id_list(claimed_done_qs),
                    "verified": format_id_list(claimed_verified_qs),
                },
            },
            "stars": {
                'tasks' : format_id_list(starred_tasks_qs, id_attr='object_id'),
                'hubs' : format_id_list(starred_hubs_qs, id_attr='object_id'),
                'users' : format_id_list(starred_users_qs, id_attr='object_id'),
            },
            "estimates" : {
                "owned": {
                    "new": format_estimate_list(owned_new_qs),
                    "claimed": format_estimate_list(owned_claimed_qs),
                    "done": format_estimate_list(owned_done_qs),
                    "verified": format_estimate_list(owned_verified_qs),
                },
                "claimed": {
                    "claimed": format_estimate_list(claimed_claimed_qs),
                    "done": format_estimate_list(claimed_done_qs),
                    "verified": format_estimate_list(claimed_done_qs),
                },
            },
            "createdTime": self.created_timestamp(),
        }
        
        if self.user == request_user:
            obj_dict["email"] = self.user.email
        
        if self.image:
            obj_dict["image"] = self.image.name

        if request_user and request_user.is_authenticated():
            star = self.starred(user=request_user)
            if star:
                obj_dict["starred"] = star.as_json()

        for k,v in obj_dict.items():
            if v == None:
                obj_dict[k] = ""
        return obj_dict
        
    def as_json(self, **kwargs):
        return json.dumps(self.as_dict(**kwargs))

def user_post_save(sender, instance, signal, *args, **kwargs):
    try:
        profile, new = Profile.objects.get_or_create(user=instance)
    except:
        pass
models.signals.post_save.connect(user_post_save, sender=User)


class Star(models.Model):

    # Types should match the verbose_name of the model they relate to.
    # TODO: some fancy auto discovery system for knowing what models can be 
    # starred.
    STAR_TYPES = (
        ('task', 'Task'),
        ('hub', 'Hub'),
        ('profile', 'User'),
    )
    
    star_type = models.CharField(blank=False, max_length=100, null=False, choices=STAR_TYPES)
    object_id = models.IntegerField(blank=False, null=False)
    user = models.ForeignKey(Profile)
    starred_time = UnixTimestampField(blank=True, default=datetime.datetime.now)
    
    objects = managers.StarredManager()
    
    def __unicode__(self):
        return u"%s-%s-%s" % (self.star_type, self.object_id, self.user)
    
    def created_timestamp(self):
        return int(time.mktime(self.starred_time.timetuple()))
    
    def as_dict(self):
        obj_dict = {
            'type' : self.star_type,
            'id' : self.object_id,
            'timestamp' : self.created_timestamp(),
        }
        return obj_dict
    
    def as_json(self):
        return json.dumps(self.as_dict())

