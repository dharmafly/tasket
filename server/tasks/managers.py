import json

from django.db import models
import models as task_models

class JsonQuerySet(models.query.QuerySet):
    """
    Adds a 'json' attribute to any model that calls 'as_json()' when creatig a 
    query.
    
    The json attribute is a JSON string containing a list of each 'dict' 
    returned by the models as_dict attriibute.
    
    An 'AttributeError' is raised if the model doesn't have an 'as_dict' 
    attribute.
    """
    
    def as_json(self, *args, **kwargs):
        
        return json.dumps([m.as_dict(**kwargs) for m in self])


class JsonManager(models.Manager):
    """
    Base subclass for json querysets.
    
    Subclass this to add a custom manager to a model, or simply add this as the 
    models manager directly.
    
    """
    def get_query_set(self): 
            model = models.get_model(self.model._meta.app_label, 
                                     self.model._meta.module_name)
            return JsonQuerySet(model)

    def __getattr__(self, attr, *args):
        try:
            return getattr(self.__class__, attr, *args)
        except AttributeError:
            return getattr(self.get_query_set(), attr, *args)


class HubManager(JsonManager): 
    def private(self, user=None):
        in_list = [0,]
        if user and user.is_authenticated():
            in_list.append(user.profile)
        return self.filter(private_to__in=in_list)
        
class UnVerifiedHubManager(JsonManager):
    """
    Returns only hubs that have unverfied tasks.
    """
    
    use_for_related_fields = True

    def get_query_set(self):
        qs = super(UnVerifiedHubManager, self).get_query_set()
        qs = qs.exclude(task__state=task_models.Task.STATE_VERIFIED) 
        return qs

class TaskManager(JsonManager):
    def private(self, user=None):
        in_list = [0,]
        if user and user.is_authenticated():
            in_list.append(user.profile)
        return self.filter(hub__private_to__in=in_list)
    

class UnverifiedTaskManager(JsonManager):
    use_for_related_fields = True
    def get_query_set(self):
        qs = super(UnverifiedTaskManager, self).get_query_set()
        return qs.filter(verifiedBy__isnull=True)
    

class ProfileManager(JsonManager): pass
class StarredManager(JsonManager): pass




