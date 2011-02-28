# -*- coding: utf-8 -*-
import json

from django.test import TestCase
from django.core.urlresolvers import reverse
from django.core.files.base import ContentFile

from django.contrib.auth.models import User

from tasks.models import Hub, Task, Profile
import tasks


class WorkflowTests(TestCase):
    fixtures = ['test_data.json',]

    def setUp(self):
        self.U1 = Profile.objects.get(pk=1)
        self.U2 = Profile.objects.get(pk=2)
        self.U3 = Profile.objects.get(pk=3)
    
    def test_verify_task(self):
        """
        An owner of a task verifies it's really done.
        """
        
        self.client.login(username=self.U2.user.username, password='12345')
        response = self.client.put(
                '/tasks/3/',
                data=json.dumps({"state" : 3}),
                content_type='application/json',
            )
        json_data = json.loads(response.content)
        self.assertEqual(json_data['state'], 3)

    def test_verify_task_not_owner(self):
        """
        A non-admin, non-owner attempts to verify a task.
        
        This should fail
        """
        
        self.client.login(username=self.U2.user.username, password='12345')
        response = self.client.put(
                '/tasks/5/',
                data=json.dumps({"state" : 3}),
                content_type='application/json',
            )
        json_data = json.loads(response.content)
        self.assertEqual(json_data['claimedBy'], ['You can only change your own tasks.'])
    
    
    def test_claim_already(self):
        self.client.login(username=self.U3.user.username, password='12345')
        response = self.client.put(
                '/tasks/5/',
                data=json.dumps({"claimedBy" : 3}),
                content_type='application/json',
            )
        json_data = json.loads(response.content)
        self.assertEqual(response.status_code, 500)
        
    def test_claim_new(self):
        self.client.login(username=self.U3.user.username, password='12345')
        response = self.client.put(
                '/tasks/6/',
                data=json.dumps({"state" : 2}),
                content_type='application/json',
            )
        json_data = json.loads(response.content)
        self.assertEqual(response.status_code, 500)
        
        
        
        
        
        
        