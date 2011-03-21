import django.forms
from django import forms
from django.contrib.auth.models import User
from django.utils.html import escape

from models import Task, Hub, Profile

class TaskForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        if 'request' in kwargs:
            self.request = kwargs['request']
            del kwargs['request']
        else:
            raise Exception('Request MUST be passed to this form')

        super(TaskForm, self).__init__(*args, **kwargs)
    
    class Meta:
        model = Task
        exclude = ('owner', 'createdTime')

    def clean_state(self):
        """
        State testing
        
        
        TODO: find a better way of doing this.
        """
        if self.request.user.profile.admin:
            return new_state
        new_state = self.cleaned_data.get('state', 0)
        old_state = self.instance.state

        def state_error(message):
            self._errors['state'] = self.error_class([message])
            STATE_NEW       = 0
            STATE_CLAIMED   = 1
            STATE_DONE      = 2
            STATE_VERIFIED  = 3
            

        # This is a 'new' task being updated somehow 
        if old_state == Task.STATE_NEW:
            if new_state == Task.STATE_CLAIMED:
                # Someone is claiming the task.
                # This is always fine
                pass
            if new_state in range(2,3):
                # Someone is compleating a task that has not been claimed.
                # This is never fine
                state_error("You cannot complete or verify a new task before it's claimed")
            if old_state == Task.STATE_CLAIMED:
                if new_state == STATE_NEW:
                    # Reverting to new.
                    # This is fine only if performed by the claimant
                    if self.request.user.profile != self.self.cleaned_data['claimedBy']:
                        state_error("You can only change your own tasks")
            # if old_state == Task.STATE_DONE:
            #     if new_state == Task.STATE_NEW:
            if old_state == Task.STATE_DONE:
                if new_state == Task.STATE_VERIFIED:
                    # Only the Task Owner can verify a task
                    if self.cleaned_data['owner'] != self.request.user.profile:
                        state_error("You can only verify tasks you own.")
        
        # Everything's OK
        return new_state

    def clean_claimedBy(self):
        # Make sure someone can't claim someone elses claimed task
        if self.cleaned_data['claimedBy'] != self.instance.claimedBy:
            message = "You can only change your own tasks."
            self._errors['claimedBy'] = self.error_class([message])
        return self.cleaned_data['claimedBy']

    def clean(self):
        cleaned_data = dict(self.cleaned_data)
        
        for k,v in cleaned_data.items():
            if isinstance(v, unicode):
                # print escape(v)
                cleaned_data[k] = escape(v)
        return cleaned_data

class HubForm(forms.ModelForm):
    
    class Meta:
        model = Hub
        exclude = ('owner', 'createdTime',)

class ProfileForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        if 'request' in kwargs:
            self.request = kwargs['request']
            del kwargs['request']
        else:
            raise Exception('Request MUST be passed to this form')

        super(ProfileForm, self).__init__(*args, **kwargs)
    
    
    class Meta:
        model = Profile
        exclude = ('user', 'createdTime', 'admin',)

