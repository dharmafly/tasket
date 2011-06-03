import datetime

import django.forms
from django import forms
from django.contrib.auth.models import User
from django.utils.html import escape
from django.conf import settings

from models import Task, Hub, Profile, Star

class StarredForm(forms.ModelForm):
    starred = forms.BooleanField(required=False)
    
    def clean_starred(self):
        if 'starred' not in self.data:
            return self.cleaned_data
        
        if not self.instance.pk:
            self._errors['starred'] = self.error_class(["Objects must be saved before they can be starred"])
            return

        model_name = self.Meta.model._meta.verbose_name
        starred = self.cleaned_data['starred']
        if starred:
            # A star is being added
            # Make sure there isn't already a star for this object and user
            star = Star.objects.get_or_create(star_type=model_name, user=self.request.user.profile, object_id=self.instance.pk)
        else:
            try:
                Star.objects.get(star_type=model_name, user=self.request.user.profile, object_id=self.instance.pk).delete()
            except Star.DoesNotExist:
                pass

class TaskForm(StarredForm):
    def __init__(self, *args, **kwargs):
        if 'request' in kwargs:
            self.request = kwargs['request']
            del kwargs['request']
        else:
            raise Exception('Request MUST be passed to this form')
        
        self.status_code = 500
        super(TaskForm, self).__init__(*args, **kwargs)
    
    class Meta:
        model = Task
        exclude = ('owner', 'createdTime',)

    def state_logic(self):
        """
        State testing
        """
        cleaned_data = dict(self.cleaned_data)
        
        updating =  bool(self.instance.pk) #Is this a new or updated model?
        new_state = self.cleaned_data.get('state', Task.STATE_NEW)
        old_state = self.instance.state
        claimedBy = self.request.user
        if self.request.user.profile.admin:
            return cleaned_data

        
        def state_error(message):
            self._errors['error'] = self.error_class([message])
        
        def reset(new_state):
            """
            Logic for 'clearing down' times and users.
            
            For example, when a task goes from claimed to new (because someone 
            didn't mark the task finished in time, or they dropped it) the 
            claimedTime and claimedBy fields (and all other time/user fields 
            apart from createdTime/owner) needs to be set to None.
            """
            if new_state == Task.STATE_NEW:
                # Limit total Tasks
                task_limit = getattr(settings, 'TASK_LIMIT', 10)
                if task_limit >= 0:
                    try:
                        if cleaned_data['hub'].task_set.exclude(state=Task.STATE_VERIFIED).count() >= task_limit:
                            self.status_code = 401
                            self._errors['error'] = self.error_class(['Too many Tasks already'])
                    except Hub.DoesNotExist:
                        pass
                
                # Reset all times
                self.instance.claimedTime = None
                self.instance.doneTime = None
                self.instance.verifiedTime = None

                self.instance.claimedBy = None
                self.instance.verifiedBy = None
                
            if new_state == Task.STATE_CLAIMED:
                # Reset all times
                self.instance.doneTime = None
                self.instance.verifiedTime = None
                self.instance.verifiedBy = None

            if new_state == Task.STATE_DONE:
                # Reset all times
                self.instance.verifiedTime = None

        if new_state != old_state or not updating:
            reset(new_state)
        
        # This is a 'new' task being updated somehow
        if new_state == Task.STATE_CLAIMED:
            
            if new_state != old_state:
                # Limit number of user's claimed Tasks
                claimed_limit = getattr(settings, 'CLAIMED_LIMIT', 5)
                if claimed_limit >= 0:
                    try:
                        if self.request.user.profile.tasks_claimed.filter(state=Task.STATE_CLAIMED).count() >= claimed_limit:
                            self._errors['error'] = self.error_class(['You can only claim %s tasks at once' % claimed_limit])
                    except Hub.DoesNotExist:
                        pass
        
            if old_state == Task.STATE_NEW:
                cleaned_data['claimedBy'] = self.request.user.profile
                cleaned_data['claimedTime'] = datetime.datetime.now()
            if old_state == Task.STATE_CLAIMED:
                if self.instance.claimedBy != self.request.user.profile:
                    state_error("This Task has already been claimed")
            

        if new_state == Task.STATE_DONE:
            if old_state == Task.STATE_NEW:
                state_error("Only claimed tasks can be 'done'")
            if old_state == Task.STATE_CLAIMED:
                if self.request.user.profile != self.instance.claimedBy:
                    state_error("You cannot mark this task as done.")
                else:
                    cleaned_data['doneTime'] = datetime.datetime.now()

        if new_state == Task.STATE_VERIFIED:
            if old_state in [Task.STATE_NEW, Task.STATE_CLAIMED]:
                state_error("New and claimed tasks can't be verified")
            else:
                cleaned_data['verifiedBy'] = self.request.user.profile
                cleaned_data['verifiedTime'] = datetime.datetime.now()

        return cleaned_data
    
    def clean_estimate(self):
        estimate = self.cleaned_data['estimate']
        TASK_ESTIMATE_MAX = getattr(settings, "TASK_ESTIMATE_MAX", 14400)
        if estimate > TASK_ESTIMATE_MAX:
            self._errors['estimate'] = self.error_class(['Estimate is too high, enter a value less than %s' % TASK_ESTIMATE_MAX])
        return estimate
    
    def clean(self):
        super(TaskForm, self).clean()

        cleaned_data = dict(self.cleaned_data)
        
        if not cleaned_data.get('estimate'):
            cleaned_data['estimate'] = self.instance.estimate
            if self.instance.estimate == None:
                self._errors['estimate'] = self.error_class(['Estimate is required'])
        
        self.cleaned_data = cleaned_data
        cleaned_data = self.state_logic()
        return cleaned_data

class HubForm(StarredForm):
    
    class Meta:
        model = Hub
        exclude = ('owner', 'createdTime',)

class ProfileForm(StarredForm):
    
    password = forms.CharField(label="Password", widget=forms.PasswordInput, required=False)
    password_confirm = forms.CharField(label="Confirm password", widget=forms.PasswordInput, required=False)
    
    def clean(self):
        super(ProfileForm, self).clean()
        cleaned_data = dict(self.cleaned_data)
        password = self.cleaned_data.get("password")
        password_confirm = self.cleaned_data.get("password_confirm")
        if password or password_confirm:
            if password != password_confirm:
                self._errors['password'] = self.error_class(['Passwords do not match'])
        self.cleaned_data = cleaned_data
        return cleaned_data

    
    class Meta:
        model = Profile
        exclude = ('user', 'createdTime', 'admin',)
