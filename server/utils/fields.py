import datetime

from django.db import models

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
        
        return value