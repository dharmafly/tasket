import datetime

from django.db import models
from django import forms

class UnixTimestampField(models.DateTimeField):
    """
    Subclass of DateTimeField that converts values from a unix timestamp in to a 
    python datetime object.
    """

    def to_python(self, value):
        try:
            value = datetime.datetime.fromtimestamp(value)
        except:
            pass
        
        return super(UnixTimestampField, self).to_python(value)

    def formfield(self, **kwargs):
        defaults = {'form_class': UnixTimestampFormField}
        defaults.update(kwargs)
        return super(UnixTimestampField, self).formfield(**defaults)
    

class UnixTimestampFormField(forms.DateTimeField):
    def to_python(self, value):
        try:
            value = datetime.datetime.fromtimestamp(value)
        except:
            pass
        
        return super(UnixTimestampFormField, self).to_python(value)

class TaskListField(models.TextField):
    """
    Stores a string representation of of a python list.
    Taken from http://stackoverflow.com/questions/1110153/what-is-the-most-efficent-way-to-store-a-list-in-the-django-models
    """
    __metaclass__ = models.SubfieldBase

    def __init__(self, *args, **kwargs):
        self.token = kwargs.pop('token', ',')
        super(TaskListField, self).__init__(*args, **kwargs)

    def to_python(self, value):
        if not value: return
        if isinstance(value, list):
            return value
        return value.split(self.token)

    def get_db_prep_value(self, value):
        if not value: return
        assert(isinstance(value, list) or isinstance(value, tuple))
        return self.token.join([unicode(s) for s in value])

    def value_to_string(self, obj):
        value = self._get_val_from_obj(obj)        






