import django.forms
from django import forms
from django.contrib.auth.models import User

from models import Task, Hub

class TaskForm(forms.ModelForm):
    
    class Meta:
        model = Task
        exclude = ('created', 'owner', 'verifiedBy', 'claimedBy', 'createdTime', 'state')


class HubForm(forms.ModelForm):
    
    class Meta:
        model = Hub
        exclude = ('owner', 'createdTime',)

