import django.forms
from django import forms
from django.contrib.auth.models import User

from models import Task

class TaskForm(forms.ModelForm):
    
    class Meta:
        model = Task
        exclude = ('hub', 'object_id', 'content_type', 'created', 'expires',)


