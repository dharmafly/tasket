import datetime

from django.test import TestCase
from django.conf import settings

from django.core.management import call_command

from tasks.models import Task

class WorkflowTests(TestCase):
    fixtures = ['test_data.json',]
    
    CLAIMED_TIME_LIMIT = int(getattr(settings, "CLAIMED_TIME_LIMIT", 24))
    DONE_TIME_LIMIT = int(getattr(settings, "DONE_TIME_LIMIT", 24))
    
    
    def test_call_task_states(self):
        verified_count_before = Task.objects.filter(state=Task.STATE_VERIFIED).count()
        claimed_count_before = Task.objects.filter(state=Task.STATE_CLAIMED).count()

        call_command('task_states')

        verified_count_after = Task.objects.filter(state=Task.STATE_VERIFIED).count()
        claimed_count_after = Task.objects.filter(state=Task.STATE_CLAIMED).count()

        self.assertEqual(claimed_count_before, 2)
        self.assertEqual(claimed_count_after, 0)

        self.assertEqual(verified_count_before, 1)
        self.assertEqual(verified_count_after, 2)
        
        tasks = Task.objects.filter(state=Task.STATE_VERIFIED)
        owner,verifiedBy = ([unicode(t.owner) for t in tasks], [unicode(t.verifiedBy) for t in tasks])
        
        for o,v in zip(owner, verifiedBy):
            self.assertEqual(o,v)
