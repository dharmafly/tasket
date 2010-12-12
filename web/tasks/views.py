import json

from django.shortcuts import render_to_response
from django.http import HttpResponse, HttpResponseRedirect
from django.template import RequestContext

from django.core import serializers

from models import *
import forms

def all_tasks(request):
    d = {}
    for hub in Person.objects.all():
        d[hub.pk] = {
            'name' : hub.name,
            }
        hub_tasks = {}
        for task in hub.tasks.all():
            hub_tasks[task.pk] = {
                'title' : task.title,
                'time_estimate' : task.time_estimate,
                'desc' : task.summary,
                'created' : task.created.strftime('%Y-%m-%dT%H:%M:%S'),
                'expires' : task.expires.strftime('%Y-%m-%dT%H:%M:%S'),
            }
        d[hub.pk]['tasks'] = hub_tasks
        
    res = HttpResponse()
    
    x = json.dumps({'hubs' : d})
    if request.GET.get('callback'):
        x = "%s (%s);" % (request.GET['callback'], x)
    
    res = HttpResponse(
    x
    )

    return res

# Tmp, for demo
from django.views.decorators.csrf import csrf_exempt
@csrf_exempt
def task(request):
    
    form = forms.TaskForm()
    
    if request.POST:
        
        if form.is_valid:
        
            form = forms.TaskForm(request.POST)
            task = form.save(commit=False)

            # Just add the current user for the moment
            person = Person.objects.get(user=request.user)

            task.hub = person
            task.save()
            x = json.dumps({
                'temp_id' : request.POST.get('temp_id'),
                'task_id' : task.pk,
                })
            
            if request.GET.get('callback'):
                x = "%s = (%s);" % (request.GET['callback'], x)
            
            res = HttpResponse(
            x
            )
            return res
    
    return render_to_response(
        'task.html', 
        {
        'form' : form,
        }, 
        context_instance = RequestContext(request)
    )
#     
# """
# If not 'hub id' get the current 'person' and set it as that.
# 
# 
# """