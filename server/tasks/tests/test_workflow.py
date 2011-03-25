# -*- coding: utf-8 -*-
import json

from django.test import TestCase
from django.core.urlresolvers import reverse
from django.core.files.base import ContentFile
from django.conf import settings

from django.contrib.auth.models import User

from tasks.models import Hub, Task, Profile
import tasks


class WorkflowTests(TestCase):
    fixtures = ['test_data.json',]

    def setUp(self):
        self.U1 = Profile.objects.get(pk=2)
        self.U2 = Profile.objects.get(pk=3)
        self.U3 = Profile.objects.get(pk=4)

    def test_verify_task(self):
        """
        An owner of a task verifies it's really done.
        """
        
        self.client.login(username=self.U2.user.username, password='12345')
        response = self.client.put(
                '/tasks/3',
                data=json.dumps({"state" : Task.STATE_VERIFIED}),
                content_type='application/json',
            )
        json_data = json.loads(response.content)
        self.assertEqual(json_data['state'], Task.STATE_VERIFIED)
    
    def test_verify_task_not_owner(self):
        """
        A non-admin, non-owner attempts to verify a task.
        
        This should fail
        """
        
        self.client.login(username=self.U1.user.username, password='12345')
        response = self.client.put(
                '/tasks/5',
                data=json.dumps({"state" : Task.STATE_VERIFIED}),
                content_type='application/json',
            )
        json_data = json.loads(response.content)
        self.assertTrue('error' in json_data)
    
    
    def test_claim_already(self):
        self.client.login(username=self.U3.user.username, password='12345')
        response = self.client.put(
                '/tasks/5',
                data=json.dumps({"state" : Task.STATE_CLAIMED}),
                content_type='application/json',
            )
        json_data = json.loads(response.content)
        self.assertEqual(response.status_code, 500)
        
    def test_verify_new(self):
        self.client.login(username=self.U3.user.username, password='12345')
        response = self.client.put(
                '/tasks/6',
                data=json.dumps({"state" : Task.STATE_DONE}),
                content_type='application/json',
            )
        json_data = json.loads(response.content)
        self.assertEqual(response.status_code, 500)
        
    def test_authorization_header(self):
        response = self.client.get('/')
        self.assertTrue(response.has_header('Authorization'))
    
    def test_reset_to_new(self):
        self.client.login(username=self.U1.user.username, password='12345')
        response = self.client.put(
                '/tasks/6',
                data=json.dumps({"state" : Task.STATE_CLAIMED}),
                content_type='application/json',
            )
        response = self.client.put(
                '/tasks/6',
                data=json.dumps({"state" : Task.STATE_NEW}),
                content_type='application/json',
            )
    
    def test_claim_then_done(self):
        self.client.login(username=self.U1.user.username, password='12345')
        response = self.client.put(
                '/tasks/6',
                data=json.dumps({"state" : Task.STATE_CLAIMED}),
                content_type='application/json',
            )
        self.assertNotEquals(json.loads(response.content)['claimedBy'], None)
        response = self.client.put(
                '/tasks/6',
                data=json.dumps({"state" : Task.STATE_DONE}),
                content_type='application/json',
            )

        self.assertTrue('doneTime' in json.loads(response.content))
        

    def test_claim_then_done_someone_else(self):
        self.client.login(username=self.U1.user.username, password='12345')
        response = self.client.put(
                '/tasks/6',
                data=json.dumps({"state" : Task.STATE_CLAIMED}),
                content_type='application/json',
            )
        self.client.login(username=self.U2.user.username, password='12345')
        response = self.client.put(
                '/tasks/6',
                data=json.dumps({"state" : Task.STATE_CLAIMED}),
                content_type='application/json',
            )
        self.assertTrue('error' in json.loads(response.content))
        self.assertFalse('doneTime' in json.loads(response.content))

    def test_too_many_tasks(self):
        self.client.login(username='TestUser', password='12345')
        hub = Hub.objects.get(pk=2)
        for i in range(getattr(settings, 'TASK_LIMIT', 11)):
            response = self.client.post(
                '/tasks/',
                json.dumps({
                    "description" : "Lorem ipsum dolor sit amet, consectetur",
                    "estimate" : 60*10,
                    "hub" : hub.pk,
                }),
                content_type='application/json',
                )
        json_data = json.loads(response.content)
        self.assertTrue('error' in json_data)
        self.assertEqual(json_data['error'], ['Too many Tasks already'])
    
    def test_claim_too_many(self):
        """
        Gready user that claims too much!
        """
        self.client.login(username='TestUser', password='12345')
        
        # Make some dummy tasks
        hub = Hub.objects.get(pk=2)
        for i in range(5):
            response = self.client.post(
                '/tasks/',
                json.dumps({
                    "description" : "Lorem ipsum dolor sit amet, consectetur",
                    "estimate" : 60*10,
                    "hub" : hub.pk,
                }),
                content_type='application/json',
                )
        
        for t in Task.objects.filter(claimedBy=None):
            response = self.client.put(
                    '/tasks/%s' % t.pk,
                    data=json.dumps({"state" : Task.STATE_CLAIMED}),
                    content_type='application/json',
                )

        json_data = json.loads(response.content)
        self.assertTrue('error' in json_data)
        self.assertEquals(json_data['error'], ["You can only claim 5 tasks at once"])
            
        