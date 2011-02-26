import json

from django.db import models

class JsonQuerySet(models.query.QuerySet):
    """
    Adds a 'json' attribute to any model that calls 'as_json()' when creatig a 
    query.
    
    The json attribute is a JSON string containing a list of each 'dict' 
    returned by the models as_dict attriibute.
    
    An 'AttributeError' is raised if the model doesn't have an 'as_dict' 
    attribute.
    """
    
    def as_json(self):
        
        return json.dumps([m.as_dict() for m in self])


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


class HubManager(JsonManager): pass
class TaskManager(JsonManager): pass