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
    