# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Deleting field 'Hub.archived'
        db.delete_column('tasks_hub', 'archived')

        # Adding field 'Hub.archived_time'
        db.add_column('tasks_hub', 'archived_time', self.gf('utils.fields.UnixTimestampField')(null=True, blank=True), keep_default=False)

        # Adding field 'Hub.archived_by'
        db.add_column('tasks_hub', 'archived_by', self.gf('django.db.models.fields.related.ForeignKey')(related_name='archived_hubs', null=True, to=orm['tasks.Profile']), keep_default=False)


    def backwards(self, orm):
        
        # Adding field 'Hub.archived'
        db.add_column('tasks_hub', 'archived', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Deleting field 'Hub.archived_time'
        db.delete_column('tasks_hub', 'archived_time')

        # Deleting field 'Hub.archived_by'
        db.delete_column('tasks_hub', 'archived_by_id')


    models = {
        'auth.group': {
            'Meta': {'object_name': 'Group'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'auth.permission': {
            'Meta': {'ordering': "('content_type__app_label', 'content_type__model', 'codename')", 'unique_together': "(('content_type', 'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        'tasks.hub': {
            'Meta': {'ordering': "('-id',)", 'object_name': 'Hub'},
            'archived_by': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'archived_hubs'", 'null': 'True', 'to': "orm['tasks.Profile']"}),
            'archived_time': ('utils.fields.UnixTimestampField', [], {'null': 'True', 'blank': 'True'}),
            'createdTime': ('utils.fields.UnixTimestampField', [], {'default': 'datetime.datetime.now', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'image': ('sorl.thumbnail.fields.ImageField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'owner': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'owned_hubs'", 'to': "orm['tasks.Profile']"}),
            'task_order': ('utils.fields.TaskListField', [], {'null': 'True', 'blank': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '255'})
        },
        'tasks.profile': {
            'Meta': {'object_name': 'Profile'},
            'admin': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'createdTime': ('utils.fields.UnixTimestampField', [], {'default': 'datetime.datetime.now', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'image': ('sorl.thumbnail.fields.ImageField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'location': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['auth.User']", 'unique': 'True', 'primary_key': 'True'})
        },
        'tasks.star': {
            'Meta': {'object_name': 'Star'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'object_id': ('django.db.models.fields.IntegerField', [], {}),
            'star_type': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'starred_time': ('utils.fields.UnixTimestampField', [], {'default': 'datetime.datetime.now', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['tasks.Profile']"})
        },
        'tasks.task': {
            'Meta': {'object_name': 'Task'},
            'claimedBy': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'tasks_claimed'", 'null': 'True', 'to': "orm['tasks.Profile']"}),
            'claimedTime': ('utils.fields.UnixTimestampField', [], {'null': 'True', 'blank': 'True'}),
            'createdTime': ('utils.fields.UnixTimestampField', [], {'default': 'datetime.datetime.now', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'doneTime': ('utils.fields.UnixTimestampField', [], {'null': 'True', 'blank': 'True'}),
            'estimate': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'hub': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['tasks.Hub']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'image': ('sorl.thumbnail.fields.ImageField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'owner': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'tasks_owned'", 'to': "orm['tasks.Profile']"}),
            'state': ('django.db.models.fields.CharField', [], {'default': "'new'", 'max_length': '10'}),
            'verifiedBy': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'tasks_verified'", 'null': 'True', 'to': "orm['tasks.Profile']"}),
            'verifiedTime': ('utils.fields.UnixTimestampField', [], {'null': 'True', 'blank': 'True'})
        }
    }

    complete_apps = ['tasks']
