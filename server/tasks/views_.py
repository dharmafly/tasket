# -*- coding: utf-8 -*-
import json

from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect, HttpResponseNotAllowed, Http404
from django.template import RequestContext
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
# from django.core import serializers

from cbv import View

from utils import AllowJSONPCallback, update_wrapper, classonlymethod

from models import Hub, Task
import forms


class HubView(View):
    # http_method_names = ['get', 'post',]
    
    # def get_single(self, reqeust, hub_id=None, tasks=None):
    #     hub = get_object_or_404(Hub, pk=hub_id)        
    #     return HttpResponse(hub.as_json())
    
    
    # @method_decorator(AllowJSONPCallback)
    def get(self, request, hub_id=None, tasks=None):
        # if hub_id:
        #     return self.get_single(request, hub_id)
        
        hubs = Hub.objects.all()
        
        if 'ids' in request.GET:
            ids = request.GET['ids']
            ids = [i.strip() for i in ids.split(',') if i]
            hubs = hubs.filter(pk__in=ids)
        
        res = HttpResponse()
        res.write(hubs.as_json())
        return res
        
    # # @method_decorator(login_required)
    # def post(self, request):
    #     """
    #     Create a hub
    #     """
    #     res = HttpResponse()
    # 
    #     form = forms.HubForm(request.POST)
    #     if form.is_valid():
    #         H = form.save(commit=False)
    #         H.owner = request.user
    #         H.save()
    #     
    #         response_json =  {
    #             "id": H.pk, 
    #             "createdTime": H.created_timestamp()
    #             }
    #         return HttpResponse(json.dumps(response_json))
    #     else:
    #         required_list = ", ".join(form.errors.keys())
    #         return HttpResponse(json.dumps("%s are required" % required_list), status=500)


class SingleHubView(View):
    
    http_method_names = ['get', 'post', 'delete', 'put',]
        
    
    def put(self, request, hub_id):
        hub = get_object_or_404(Hub, pk=hub_id)
        form = forms.HubForm(request.PUT, instance=hub)
        if form.is_valid():
            H = form.save()
            response_json =  {
                "id": H.pk,
                "updated" : True,
                "hub" : H.as_dict()
                }
            return HttpResponse(json.dumps(response_json))
        else:
            required_list = ", ".join(form.errors.keys())
            return HttpResponse(json.dumps("%s are required" % required_list), status=500)
    
    def delete(self, request, hub_id):
        hub = self.get_hub(request, hub_id)
        hub_id = hub.pk
        hub.delete()
        return HttpResponse(json.dumps(
            {
                "deleted" : True,
                "hub_id" : hub_id,
            }
            ))

class HubTasks(View):
    http_method_names = ['get',]
    @method_decorator(AllowJSONPCallback)
    def get(self, request, hub_id):
        hub = get_object_or_404(Hub, pk=hub_id)
        return HttpResponse(hub.task_set.all().as_json())



class TasksView(View):
    http_method_names = ['get','post', 'put',]
    
    @method_decorator(AllowJSONPCallback)
    def get_single(self, request, task_id):
        task = get_object_or_404(Task, pk=task_id)
        return HttpResponse(task.as_json())
    
    @method_decorator(AllowJSONPCallback)
    def get(self, request, task_id=None):
        if task_id:
            return self.get_single(request, task_id)
        
        tasks = Task.objects.filter(verifiedBy=None)
        
        if 'ids' in request.GET:
            ids = request.GET['ids']
            ids = [i.strip() for i in ids.split(',') if i]
            tasks = tasks.filter(pk__in=ids)

        res = HttpResponse(mimetype='application/json')
        res.write(tasks.as_json())
        return res

    def post(self, request, task_id=None):
        form = forms.TaskForm(request.POST)
        if form.is_valid():
            T = form.save(commit=False)
            T.owner = request.user
            T.save()
            return HttpResponse(T.as_json())
        else:
            required_list = ", ".join(form.errors.keys())
            return HttpResponse(json.dumps("%s are required" % required_list), status=500)

    def put(self, request, task_id=None):
        task = get_object_or_404(Task, pk=task_id)
        form = forms.TaskForm(request.PUT, instance=task)
        # form.hub = task.hub
        if form.is_valid():
            T = form.save()
            return HttpResponse(T.as_json())
        else:
            required_list = ", ".join(form.errors.keys())
            return HttpResponse(json.dumps("%s are required" % required_list), status=500)




