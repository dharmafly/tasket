from datetime import datetime, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.db.models import F

from tasks.models import Task

class Command(BaseCommand):
    
    CLAIMED_TIME_LIMIT = int(getattr(settings, "CLAIMED_TIME_LIMIT", 72))
    DONE_TIME_LIMIT = int(getattr(settings, "DONE_TIME_LIMIT", 72))
    
    def mark_claimed(self):
        
        time_offset = datetime.now() - timedelta(hours=self.CLAIMED_TIME_LIMIT)
        claimed_tasks = Task.objects.filter(state=Task.STATE_CLAIMED)
        claimed_tasks = claimed_tasks.filter(claimedTime__lte=time_offset)
        
        claimed_tasks.update(claimedTime=None, claimedBy=None, state=Task.STATE_NEW)

    def mark_done(self):        
        time_offset = datetime.now() - timedelta(hours=self.DONE_TIME_LIMIT)
        done_tasks = Task.objects.filter(state=Task.STATE_DONE)
        done_tasks = done_tasks.filter(doneTime__lte=time_offset)
        done_tasks.update(verifiedTime=datetime.now(), verifiedBy=F('owner'), state=Task.STATE_VERIFIED)
        
    
    def handle(self, **options):
        self.mark_claimed()
        self.mark_done()
