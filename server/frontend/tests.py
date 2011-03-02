# -*- coding: utf-8 -*-
import json

from django.test import TestCase
from django.core.urlresolvers import reverse

from django.contrib.auth.models import User

class ViewTests(TestCase):
    fixtures = ['test_data.json',]

    def test_logged_in(self):
        self.client.login(username='TestUser', password='12345')
        response = self.client.get('/login/')
        self.assertEqual(json.loads(response.content)['user'], 1)

    def test_now_logged_in(self):
        # self.client.login(username='TestUser', password='12345')
        response = self.client.get('/login/')
        
        self.assertTrue(response.context['form'])
    
        