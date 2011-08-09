## Installing Tasket on Webfaction

Note: this details how to install the vanilla tasket application on Webfaction, rather than the symlinked submodule version.

Before attempting to install tasket on Webfaction, it's recommended you read the projects README on how to install tasket on a local computer.

Webfaction uses a fairly standard apache/mod_wsgi setup for deploying django that is then proxied to their main apache instance, with specific instructions for hosting static media:

http://docs.webfaction.com/software/django/getting-started.html#serving-static-media

Because the apache instance the user has control over is configured to work with the main Webfaction apache, it's important that all directories and 'application' are set up via the Webfaction control panel, rather than making folders directly.

The default django application is simply called `django` and it lives in `~/webapps/django`.  It's it possible to change this, but for the purpose of this document it's assumed this is the path to the application.

It's a good idea to change the default python version before starting anything.  2.7 has been used for development, so that is currently the recommended version.

See here for more: http://docs.webfaction.com/software/python.html

### 1. Clone Tasket
From the application directory (`~/webapps/django/`) clone `tasket`:
  
    git clone git://github.com/dharmafly/tasket.git
  
This will create a folder `tasket` in the application directory.
  
### 2. Create the database.
In the control panel, go to `Databases > Create New Database`.  Tasket is tested  against postgres, so this is recommended.  That being said, there is no known reason MySQL wont work (as the django ORM works with both). 

### 3. local_settings.py
In `tasket/web/` copy `local_settings.py.example` to `local_settings.py`.  Edit this file, for the moment the only that needs changing is the database settings (as per the database created in step 2)

### 4. Setup the python environment
  
    easy_install pip
    pip install -r ~/webapps/django/tasket/requirements.txt
  
### 5. Sync the database.
In `tasket/web/` run 

    python manage.py syncdb
  
following the superuser instructions there, then:
  
    python2.7 manage.py migrate


### 6. Set up apache/mod_wsgi.

The default mod_wsgi file in the root application folder called `myproject.wsgi` contains everything needed to run tasket, with one simple change to line 6:

    os.environ['DJANGO_SETTINGS_MODULE'] = 'tasket.web.settings'

It is possible to change the file name now, but make sure the apache config file knows where to find the wsgi file (`WSGIScriptAlias` directive in `[application]/apache2/conf/httpd.conf`)

Edit `[application]/apache2/conf/httpd.conf` and append the following to the `WSGIPythonPath` directive:

    /home/[username]/webapps/django/tasket/server:/home/[username]/webapps/django/tasket

Further apache configuration may go here. E.g. to redirect requests for "www.example.com" to the non-www URL, add:

    RewriteEngine On
    RewriteCond %{HTTP_HOST} ^www\.(.*) [NC]
    RewriteRule ^(.*) http://%1/$1 [R=301,L]

Finally, run `[application]/apache2/bin/restart` and test in a browser.  The API should work, so /hubs/ should show an empty array.

### 7. Static Media
To server the media (images, css, js) a new 'application' should be set up in the control panel as per http://docs.webfaction.com/software/django/getting-started.html#serving-static-media

After creating the application it must be served at /media/.  This is set in the 'web sites' section of the control panel.

If the new application is called `media`, a new directory will be created at `~/webapps/media/` 

In this folder, create a symlink to everything in the media folder:

    ln -s ../django/tasket/client/media/* .

(note trailing full stop)

### 8. Email and Cron

Email settings in `local_settings.py` should be configured as per:
http://docs.webfaction.com/software/django/getting-started.html#configuring-django-to-send-email-messages

The `task_states` command should be run on a cron every now and again (every 10 minutes is reasonable).  Add the following line to the crontab by running:

> crontab -e

and inserting:

> 10 * * * * cd ~/webapps/django/tasket/web/ && python2.7 manage.py task_states

on a new line.

### 9. Pull from the Git repository

In future, simply:

    cd ~/webapps/django/tasket && git pull
