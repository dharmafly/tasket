# -*- coding: utf-8 -*-
import json

from django.test import TestCase
from django.core.urlresolvers import reverse
from django.core.files.base import ContentFile

from django.contrib.auth.models import User

from tasks.models import Hub, Task
import tasks


class ViewTests(TestCase):
    fixtures = ['test_data.json',]
    
    def test_as_json(self):
        r = self.client.get('/example/1/')
        print r