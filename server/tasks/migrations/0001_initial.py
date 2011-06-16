# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Task'
        db.create_table('tasks_task', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('description', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('image', self.gf('sorl.thumbnail.fields.ImageField')(max_length=100, null=True, blank=True)),
            ('estimate', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('state', self.gf('django.db.models.fields.CharField')(default='new', max_length=10)),
            ('owner', self.gf('django.db.models.fields.related.ForeignKey')(related_name='tasks_owned', to=orm['tasks.Profile'])),
            ('claimedBy', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='tasks_claimed', null=True, to=orm['tasks.Profile'])),
            ('verifiedBy', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='tasks_verified', null=True, to=orm['tasks.Profile'])),
            ('createdTime', self.gf('utils.fields.UnixTimestampField')(default=datetime.datetime.now, blank=True)),
            ('claimedTime', self.gf('utils.fields.UnixTimestampField')(null=True, blank=True)),
            ('doneTime', self.gf('utils.fields.UnixTimestampField')(null=True, blank=True)),
            ('verifiedTime', self.gf('utils.fields.UnixTimestampField')(null=True, blank=True)),
            ('hub', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['tasks.Hub'])),
        ))
        db.send_create_signal('tasks', ['Task'])

        # Adding model 'Hub'
        db.create_table('tasks_hub', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('description', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('image', self.gf('sorl.thumbnail.fields.ImageField')(max_length=100, null=True, blank=True)),
            ('owner', self.gf('django.db.models.fields.related.ForeignKey')(related_name='owned_hubs', to=orm['tasks.Profile'])),
            ('createdTime', self.gf('utils.fields.UnixTimestampField')(default=datetime.datetime.now, blank=True)),
            ('task_order', self.gf('utils.fields.TaskListField')(null=True, blank=True)),
        ))
        db.send_create_signal('tasks', ['Hub'])

        # Adding model 'Profile'
        db.create_table('tasks_profile', (
            ('user', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['auth.User'], unique=True, primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=255, blank=True)),
            ('description', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('location', self.gf('django.db.models.fields.CharField')(max_length=255, blank=True)),
            ('image', self.gf('sorl.thumbnail.fields.ImageField')(max_length=100, null=True, blank=True)),
            ('createdTime', self.gf('utils.fields.UnixTimestampField')(default=datetime.datetime.now, blank=True)),
            ('admin', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal('tasks', ['Profile'])

        # Adding model 'Star'
        db.create_table('tasks_star', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('star_type', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('object_id', self.gf('django.db.models.fields.IntegerField')()),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['tasks.Profile'])),
            ('starred_time', self.gf('utils.fields.UnixTimestampField')(default=datetime.datetime.now, blank=True)),
        ))
        db.send_create_signal('tasks', ['Star'])


    def backwards(self, orm):
        
        # Deleting model 'Task'
        db.delete_table('tasks_task')

        # Deleting model 'Hub'
        db.delete_table('tasks_hub')

        # Deleting model 'Profile'
        db.delete_table('tasks_profile')

        # Deleting model 'Star'
        db.delete_table('tasks_star')


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
