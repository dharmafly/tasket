# -*- coding: utf-8 -*-
import json
import mimetypes

from django.shortcuts import get_object_or_404
from django.http import HttpResponse, Http404
from django.template import RequestContext
from django.utils.decorators import method_decorator
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.core.validators import email_re
from django.conf import settings
from django.middleware.csrf import get_token

from utils.decorators import json_login_required as login_required


from sorl.thumbnail import get_thumbnail
from utils.helpers import AllowJSONPCallback, PutView

from models import Hub, Task, Profile, Star
import forms


def home(request, file_name=None):
    get_token(request)
    static_index_paths = getattr(settings, 'INDEX_PATHS', [])
    if file_name and file_name in static_index_paths:
        try:
            f = open("%s/client/%s" % (settings.ROOT_PATH, file_name), "r")
            return HttpResponse(f.read())
        except:
            raise Http404
    index_file = getattr(settings, 'DEFAULT_INDEX_FILE', 'tank.html')
    f = open("%s/client/%s" % (settings.ROOT_PATH, index_file), "r")
    return HttpResponse(f.read())


class HubView(PutView):
    
    http_method_names = ['get', 'post', 'put', 'delete',]
    
    def __init__(self):
        self.res = HttpResponse(content_type='application/json')
    
    @method_decorator(AllowJSONPCallback)
    def get_hub_tasks(self, request, hub_id, tasks=None):
        hub = get_object_or_404(Hub, pk=hub_id)
        self.res.write(hub.task_set.private(request.user).as_json(request_user=request.user))
        return self.res

    def get_single(self, request, hub_id=None, tasks=None):
        hub = get_object_or_404(Hub.objects.private(request.user), pk=hub_id)
        self.res.write(hub.as_json(request_user=request.user))
        return self.res

 
    @method_decorator(AllowJSONPCallback)
    def get(self, request, hub_id=None, tasks=None, image=None):

        if hub_id and not tasks:
            return self.get_single(request, hub_id)
        if hub_id and tasks:
            return self.get_hub_tasks(request, hub_id, tasks)

        hubs = Hub.objects.private(request.user)
        
        if 'ids' in request.GET:
            ids = request.GET['ids']
            ids = [i.strip() for i in ids.split(',') if i]
            hubs = hubs.filter(pk__in=ids)

        archived = request.GET.get('archived', False)
        if archived == 'true':
          hubs = hubs.exclude(archived_by=None)
        elif archived == "all":
             hubs = hubs
        elif 'ids' not in request.GET:
          hubs = hubs.filter(archived_by=None)
          
        res = self.res
        res.write(hubs.as_json(request_user=request.user))
        return res
        
    @method_decorator(login_required)
    @method_decorator(AllowJSONPCallback)
    def post(self, request, hub_id=None, image=None):
        """
        Create a hub
        """
        
        if image:
            return self.image_upload(request, hub_id)

        res = HttpResponse()
        
        # Don't allow a normal user to create a hub, if USERS_CAN_CREATE_HUBS is 
        # false, and the user is not an admin
        if not getattr(settings, "USERS_CAN_CREATE_HUBS", True) and not request.user.profile.admin:
            res.write(json.dumps(
                {
                'error' : "Unauthorized",
                'status' : 401
                }
            ))
            
            res.status_code = 401
            return res
        
        form = forms.HubForm(request.JSON, request=request)
        if form.is_valid():
            H = form.save(commit=False)
            H.owner = request.user.profile
            H.save()

            response_json =  {
                "id": str(H.pk), 
                "createdTime": H.created_timestamp()
                }
            self.res.write(json.dumps(response_json))
            
        else:
            self.res.write(json.dumps(form.errors))
            self.res.status_code = 500
        return self.res
    
    def image_upload(self, request, hub_id):
        res = HttpResponse()

        # Handle image upload
        hub = get_object_or_404(Hub, pk=hub_id)
        
        for k,v in hub.as_dict().items():
            if k not in request.POST:
                request.POST[k] = v

        form = forms.HubForm(request.POST, request.FILES, instance=hub, request=request)
        if form.is_valid():
            H = form.save()
            res.write(json.dumps({'image' : H.image.name}))
            res.status_code = 201
        else:
            res.write(json.dumps({'error' : 'Cannot upload image'}))
            res.status_code = 400
        return res

    @method_decorator(login_required)
    @method_decorator(AllowJSONPCallback)
    def put(self, request, hub_id):
        hub = get_object_or_404(Hub, pk=hub_id)
        request.PUT['title'] = request.JSON.get('title', hub.title)
        form = forms.HubForm(request.PUT, instance=hub, request=request)
        if form.is_valid():
            H = form.save()
            response_json =  H.as_dict()
            self.res.write(json.dumps(response_json))
        else:
            self.res.write(json.dumps(form.errors))
            self.res.status_code = 500
        return self.res
        
    @method_decorator(login_required)
    @method_decorator(AllowJSONPCallback)
    def delete(self, request, hub_id):
        hub = get_object_or_404(Hub, pk=hub_id)
        if hub.task_set.exclude(state__in=[Task.STATE_NEW]).count() > 0:
            self.res.write(json.dumps({'error' : 'Cannot delete hub'}))
            self.res.status_code = 400
            return self.res

        hub_id = hub.pk
        hub.delete()
        self.res.write(json.dumps(
            {
                "deleted" : True,
                "hub_id" : str(hub_id),
            }
            ))
        return self.res


class TasksView(PutView):
    http_method_names = ['get','post', 'put', 'delete',]
    
    def __init__(self):
        self.res = HttpResponse(content_type='application/json')
    
    def get_single(self, request, task_id):
        task = get_object_or_404(Task.objects.private(request.user), pk=task_id)
        self.res.write(task.as_json(request_user=request.user))
        return self.res
        
    @method_decorator(AllowJSONPCallback)
    def get(self, request, task_id=None):
        if task_id:
            return self.get_single(request, task_id)
        
        tasks = Task.objects.private(request.user)
        
        if 'ids' in request.GET:
            ids = request.GET['ids']
            ids = [i.strip() for i in ids.split(',') if i]
            tasks = tasks.filter(pk__in=ids)
        
        if 'state' in request.GET:
            tasks = tasks.filter(state=request.GET['state'])
        
        self.res.write(tasks.as_json(request_user=request.user))
        return self.res
        
    @method_decorator(login_required)
    @method_decorator(AllowJSONPCallback)
    def post(self, request, task_id=None, image=None):
        
        if image:
            return self.image_upload(request, task_id)
        
        request.JSON['state'] = request.JSON.get('state', Task.STATE_NEW)
        form = forms.TaskForm(request.JSON, request=request)
        if form.is_valid():
            T = form.save(commit=False)
            T.owner = request.user.profile
            T.save()
            self.res.write(T.as_json(request_user=request.user))
        else:
            self.res.write(json.dumps(form.errors))
            self.res.status_code = form.status_code
        return self.res
    
    def image_upload(self, request, task_id):
        res = HttpResponse()

        # Handle image upload
        task = get_object_or_404(Task, pk=task_id)
        
        request.POST['state'] = task.state
        request.POST['hub'] = task.hub_id
        
        form = forms.TaskForm(request.POST, request.FILES, instance=task, request=request)
        if form.is_valid():
            T = form.save()
            res.write(json.dumps({'image' : T.image.name}))
            res.status_code = 201
        else:
            res.write(json.dumps({'error' : 'Cannot upload image'}))
            res.status_code = 400
        return res
    
    @method_decorator(login_required)
    @method_decorator(AllowJSONPCallback)
    def put(self, request, task_id=None):
        task = get_object_or_404(Task, pk=task_id)
        request.PUT['hub'] = task.hub.pk
        request.PUT['state'] = request.PUT.get('state', Task.STATE_NEW)
        
        form = forms.TaskForm(request.PUT, instance=task, request=request)
        if form.is_valid():
            T = form.save()
            self.res.write(T.as_json(request_user=request.user))
        else:
            self.res.write(json.dumps(form.errors))
            self.res.status_code = form.status_code
        return self.res
        
    @method_decorator(login_required)
    @method_decorator(AllowJSONPCallback)
    def delete(self, request, task_id=None):
        task = get_object_or_404(Task, pk=task_id)
        
        if task.state not in [Task.STATE_NEW,]:
            self.res.write(json.dumps({'error' : 'Cannot delete task'}))
            self.res.status_code = 400
            return self.res
        
        task_id = task.pk
        task.delete()
        self.res.write(json.dumps(
            {
                "deleted" : True,
                "task_id" : str(task_id),
            }
            ))
        return self.res


class ProfileView(PutView):
    http_method_names = ['get','post', 'put', 'delete',]
    
    def __init__(self):
        self.res = HttpResponse(content_type='application/json')
    
    def get_single(self, request, user_id):
        profile = get_object_or_404(Profile, user=user_id)
        self.res.write(profile.as_json(request_user=request.user))
        return self.res
        
    @method_decorator(AllowJSONPCallback)
    def get(self, request, user_id=None, starred=None):
        if starred:
            return self.starred(request, user_id)
        
        if user_id:
            return self.get_single(request, user_id)
        
        users = Profile.objects.all()
        
        if 'ids' in request.GET:
            ids = request.GET['ids']
            ids = [i.strip() for i in ids.split(',') if i]
            users = users.filter(user__in=ids)
            
        self.res.write(users.as_json(request_user=request.user))
        return self.res

    @method_decorator(login_required)
    @method_decorator(AllowJSONPCallback)
    def put(self, request, user_id=None):
        profile = request.user.profile
        if request.user.profile.pk != int(user_id):
            self.res.write(json.dumps(
                {
                'error' : "Unauthorized",
                'status' : 401
                }
            ))
            
            self.res.status_code = 401
            return self.res
            
        form = forms.ProfileForm(request.PUT, instance=profile, request=request)
        if form.is_valid():
            T = form.save(commit=False)
            T.user = profile.user

            if request.PUT.get('email'):
                T.user.email = request.PUT.get('email', T.user.email)
            
            if request.PUT.get('password'):
                T.user.set_password(request.PUT['password'])

            T.user.save()            
            T.save()            
            self.res.write(T.as_json(request_user=request.user))
        else:
            self.res.write(json.dumps(form.errors))
            self.res.status_code = 500
        return self.res

        def invalid(self, *args):
            self.res.write(json.dumps({
                'errors' : args, 
            }))
            return self.res
    
    @method_decorator(AllowJSONPCallback)
    def post(self, request, user_id=None, image=None):
        if image:
            return self.image_upload(request, user_id)
        request.POST = request.JSON
        username = request.JSON.get('username')
        password = request.JSON.get('password')
        password_confirm = request.JSON.get('password_confirm')
        email = request.JSON.get('email')
        
        form = forms.UserCreationForm(
                {
                    'username': username,
                    'email' : email,
                    'password1' : password,
                    'password2' : password_confirm
                }
                )
        if not form.is_valid():
            error_dict = dict(form.errors.items())
            
            # Rename password fields to better fit in to the front end
            if 'password1' in error_dict:
                error_dict['password'] = error_dict['password1']
                del error_dict['password1']
            if 'password2' in error_dict:
                error_dict['password_confirm'] = error_dict['password2']
                del error_dict['password2']

            self.res.write(json.dumps(error_dict))
            self.res.status_code = 400
            return self.res

            
        user = form.save()
        if email:
            user.email = email
            user.save()

        user = authenticate(username=username, password=password)

        form = forms.ProfileForm(request.JSON, request=request)
        T = form.save(commit=False)
        T.user = user
        T.save()

        
        user = authenticate(username=username, password=password)
        login(request, user)

        self.res.write(
            json.dumps(
                    {
                        'id' : user.pk
                    }
                )
            )
        return self.res
    
    def starred(self, request, user_id):
        qs = Star.objects.filter(user=user_id)
        return HttpResponse(qs.as_json())
    
    def image_upload(self, request, user_id):
        res = HttpResponse()
        if int(user_id) != request.user.pk:
            res.write(json.dumps(
                {
                'error' : "Unauthorized",
                'status' : 401
                }
            ))
            res.status_code = 401
            return res
        
        # Handle image upload
        profile = request.user.profile
        
        for k,v in profile.as_dict().items():
            if k not in request.POST:
                request.POST[k] = v
        
        form = forms.ProfileForm(request.POST, request.FILES, instance=profile, request=request)
        if form.is_valid():
            P = form.save()
            res.write(json.dumps({'image' : P.image.name}))
            res.status_code = 201
        else:
            res.write(json.dumps({'error' : 'Cannot upload image'}))
            res.status_code = 400
        return res


class StarredView(PutView):
    http_method_names = ['get', 'post',]
    
    def get(self, request, star_type, object_id):
        obj = get_object_or_404(Star, star_type=star_type, object_id=object_id)
        print obj
        return HttpResponse(obj.as_json())

def thumbs(request, size, path):
    try:
        im_obj = open("%s%s" % (settings.MEDIA_ROOT, path))
    except Exception, e:
        raise Http404(json.dumps({'error' : 'image not found'}))

    crop = None
    if 'crop' in request.GET:
        crop = 'center'
    im = get_thumbnail(im_obj, size, quality=99, crop=crop)
    
    file_mimetype = mimetypes.guess_type(im_obj.name)
    return HttpResponse(im.read(), mimetype=file_mimetype)


def statistics(request):
    """
    Stats on objects in the database.
    
    Something like:
    
    'tasks' : { 
        'new': '23', # Total tasks with "new" status
        'claimed': '123', # Total tasks with "claimed" status etc.
        'done': '23',
        'verified': '345',
    },
    'hubs' : {
        archived: '42'
    }
    """

    stats = {
        'tasks' : {
            'new' : str(Task.objects.private(request.user).filter(state=Task.STATE_NEW).count()),
            'claimed' : str(Task.objects.private(request.user).filter(state=Task.STATE_CLAIMED).count()),
            'done' : str(Task.objects.private(request.user).filter(state=Task.STATE_DONE).count()),
            'verified' : str(Task.objects.private(request.user).filter(state=Task.STATE_VERIFIED).count()),
            'archived' : str(Task.objects.private(request.user).exclude(hub__archived_by=None).count()),
        }, 
        'hubs' : {
            'archived' : str(Hub.objects.private(request.user).exclude(archived_by=None).count())
        }
    }

    return HttpResponse(json.dumps(stats), content_type='application/json')
    


