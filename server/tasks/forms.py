import datetime

import django.forms
from django.utils.translation import ugettext_lazy as _
from django import forms
from django.contrib.auth.models import User
from django.contrib.auth import forms as userforms
from django.utils.html import escape
from django.conf import settings

from models import Task, Hub, Profile, Star

class StarredForm(forms.ModelForm):

    def __init__(self, *args, **kwargs):
        if 'request' in kwargs:
            self.request = kwargs['request']
            del kwargs['request']
        else:
            raise Exception('Request MUST be passed to this form')
        
        self.status_code = 500
        super(StarredForm, self).__init__(*args, **kwargs)


    
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

    class Meta:
        model = Task
        exclude = ('owner', 'createdTime',)

    def state_logic(self):
        """
        State testing
        """
        cleaned_data = dict(self.cleaned_data)
        
        updating_state = False
        updating =  bool(self.instance.pk) #Is this a new or updated model?
        new_state = self.cleaned_data.get('state', Task.STATE_NEW)
        old_state = self.instance.state
        claimedBy = self.request.user.profile
        
        # If user is an admin, always let them do anything.
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
        
        def check_required_fields(required):
            """
            Returns a state_error if required is not a subset of cleaned_data
            """
            if updating_state:
                required = set(required)
                provided = set(k for k,v in cleaned_data.items() if v is not None)
                provided.update(k for k,v in self.instance.as_dict().items() if bool(v))
                if not required.issubset(provided):
                    for field in required.difference(provided):
                        self._errors[field] = self.error_class(['%s is required' % field])

        if new_state != old_state or not updating:
            reset(new_state)
            updating_state = True
        
        # This is a 'new' task being updated somehow
        if new_state == Task.STATE_CLAIMED:
            cleaned_data['claimedBy'] = claimedBy
            check_required_fields(("claimedBy", "owner"))
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
            check_required_fields(("claimedBy", "owner"))
            if old_state == Task.STATE_CLAIMED:
                if self.request.user.profile != self.instance.claimedBy:
                    state_error("You cannot mark this task as done.")
                else:
                    cleaned_data['doneTime'] = datetime.datetime.now()

        if new_state == Task.STATE_VERIFIED:
            check_required_fields(("verifiedBy", "claimedBy", "owner"))
            if self.request.user.profile != self.instance.owner:
                state_error("You cannot mark this task as verified.")
        
            cleaned_data['verifiedBy'] = self.request.user.profile
            cleaned_data['verifiedTime'] = datetime.datetime.now()

        return cleaned_data
    
    def clean_estimate(self):
        estimate = self.cleaned_data['estimate']
        TASK_ESTIMATE_MAX = getattr(settings, "TASK_ESTIMATE_MAX", 14400)
        if TASK_ESTIMATE_MAX >= 0 and estimate > TASK_ESTIMATE_MAX:
            self._errors['estimate'] = self.error_class(['Estimate is too high, enter a value less than %s' % TASK_ESTIMATE_MAX])
        return estimate
    
    def clean(self):
        super(TaskForm, self).clean()

        cleaned_data = dict(self.cleaned_data)
        
        if not cleaned_data.get('estimate'):
            cleaned_data['estimate'] = self.instance.estimate
        
        self.cleaned_data = cleaned_data
        cleaned_data = self.state_logic()
        return cleaned_data

class HubForm(StarredForm):
    
    class Meta:
        model = Hub
        exclude = ('owner', 'createdTime',)

    def clean_task_order(self):
        try:
            task_order_raw = self.data['tasks']['order']
        except KeyError:
            task_order_raw = []
        return task_order_raw
    
    def clean_archived_by(self):
        if 'archived' in getattr(self.request, 'JSON', []):
            archived = self.request.JSON['archived']
            if archived:
                if self.instance.archived_by:
                    # This hub is already archived, so no one apart from an admin or
                    # the user who archived it can unarchive it.
                    if self.request.user.profile != self.instance.archived_by and not self.request.user.profile.admin:
                        self._errors['archived'] = self.error_class(['Only an admin or the user who archived this hub can unarchive it'])
                        return False
            else:
                return None
        return self.request.user.profile
     
    def clean_archived_time(self):
        if 'archived' in getattr(self.request, 'JSON', []):
            archived = self.request.JSON['archived']
            if archived:
                return datetime.datetime.now()
            else:
                return None
    


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


class UserCreationForm(userforms.UserCreationForm):
    """
    Simple subclass of django.contrib.auth.forms.UserCreationForm that further 
    limits the characters allowed in the username field.
    
    Only alphanumeric characters, plus the "_" underscore character are allowed
    """
    REGEX = r'^[a-zA-Z0-9_]+$'
    
    username = forms.RegexField(label=_("Username"), max_length=30, regex=REGEX,
        help_text = _("Required. 30 characters or fewer. May contain only letters, numbers and underscores only."),
        error_messages = {'invalid': _("This value may contain only letters, numbers and underscores.")})
    