from django.contrib import admin

from models import *

from sorl.thumbnail.admin import AdminImageMixin, AdminInlineImageMixin

class TaskInline(AdminInlineImageMixin, admin.StackedInline):
    model = Task


class HubAdmin(AdminImageMixin, admin.ModelAdmin):
    inlines = [
        TaskInline,
    ]

class ProfileAdmin(AdminImageMixin, admin.ModelAdmin):
    list_display = ('user',)
    list_filter = ('admin',)


admin.site.register(Task)
admin.site.register(Hub, HubAdmin)
admin.site.register(Profile, ProfileAdmin)
