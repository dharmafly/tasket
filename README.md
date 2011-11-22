# Tasket

An open source micro-volunteering app, allowing individuals and groups to create and keep track of small tasks.  

Improvements and pull requests are welcome. If you have problems with these instructions, please [raise an issue](https://github.com/dharmafly/tasket/issues).


## Dependencies

* Python 2.6 or above (but < Python 3)
* [easy_install](http://packages.python.org/distribute/easy_install.html)
* You may need Python's developer package ("python-dev" or "python-devel")

### To install these dependencies on Linux:

    sudo apt-get install python python-setuptools python-dev


## Install Tasket

    cd tasket
    easy_install virtualenv
    # if this fails, use: sudo easy_install virtualenv
    
    virtualenv --no-site-packages .
    source bin/activate
    
    easy_install pip
    pip install -r requirements.txt
    
    cd web
    cp local_settings.py.example local_settings.py
    
    
### Optional: customise _web/local_settings.py_

#### Change the database engine

Tasket is set up for quick testing and development using SQLite as its database. For deployment, edit _web/local_settings.py_ and change the `ENGINE` setting to Postgres or similar.

#### Tasket behaviour

Tasket allows its behaviour to be modified, via a number of settings in _local_settings.py_.
(TODO: document these settings)


### Prepare the database

It is recommended to create a superuser account during this process (follow the instructions in the terminal).

    python manage.py syncdb
    python manage.py migrate


### Optional: Load test data

    python manage.py loaddata ../server/tasks/fixtures/test_data.json

  
### Start the server
    
    python manage.py runserver


### In future, you can start the server like this

    cd tasket
    source bin/activate
    cd web
    python manage.py runserver

Go to [http://localhost:8000](http://localhost:8000) to see the running app.

## Updating Tasket

When pulling in new changes, there may have been new models added, or changes made to the existing models.  After a git pull run the following:

    python manage.py syncdb
    python manage.py migrate


### Django admin

If you created a superuser account (recommended) when syncdb was run above, you can now log in to the django admin interface by going to [http://localhost:8000/admin/](http://localhost:8000/admin/)

To enable emailing (see below), you must edit the site 'Domain name' and 'Display name' at _/admin/sites/site/1/_


### Troubleshooting: images served with 500 Server Error

On Linux, if you find that images in the app are not successfully processed after upload (with a 500 Server Error for each image request), there may be a problem where the [Python Image Library (PIL)](http://effbot.org/zone/pil-index.htm) cannot find the correct path to JPEG and other image libraries. To resolve it, [follow the steps in this article](http://www.eddiewelker.com/2010/03/31/installing-pil-virtualenv-ubuntu/).

For further info, [see this article](http://effbot.org/zone/pil-decoder-jpeg-not-available.htm) and [Issue #110](https://github.com/dharmafly/tasket/issues/110).


## Deploying Tasket to a public server on WebFaction

Step-by-step instructions for deploying to [WebFaction](http://webfaction.com) have been included here: https://github.com/dharmafly/tasket/blob/master/docs/INSTALL-WebFaction.md


## Building a single minified JavaScript file

### Build software installation

We use [smoosh](http://github.com/fat/smoosh) to package the JavaScript for production. To get it, you need [Node.js](http://nodejs.org) >= 0.4.0.1 and [npm](http://npmjs.org) installed.

Then install Smoosh:

    npm install smoosh -g
    

## Building the JavaScript file
    
To package the JavaScript, run Smoosh from the build folder:

    cd client/media/tank/build/
    smoosh -c ./config.json

This will run [JSHint](http://jshint.com) against the codebase and write _tasket.js_ and
_tasket.min.js_ in to the _client/media/js/build/pkg/_ directory.

NOTE: Ignore any JSHint warnings for header.js and footer.js, as these are partial
JavaScript files used to enclose the Tasket application in a function closure.

# Debugging and developing the JavaScript

By default, the _minified, packaged JavaScript_ will be served when the app is viewed in a browser. To enter debug mode, and to immediately see any changes you make to the JavaScript files, add `?debug` to the URL in the browser address bar (add it before the #hash), e.g. http://localhost:8000/?debug#/hubs/

_[TODO: add notes to the doc about loader.js and re-Smooshing when adding a new file to loader.js]_

## Debug mode in the web server

The `DEBUG` flag in [/web/localsettings.py](https://github.com/dharmafly/tasket/blob/master/web/local_settings.py.example#L28) is set to `True` by default, for ease of local development. This flag should be set to `False` on deploy.


## Cron

It's recommended to run the `task_states` management command every so often.

This does 2 things:

1. If a task has been claimed but not done within `settings.CLAIMED_TIME_LIMIT` 
    (default 24 hours) then the task state is reverted to 'new'
2. If a task has been done but not verified then it is automatically verified 
    after `settings.DONE_TIME_LIMIT` (default 24 hours)

To run this command at 10 minutes pass every hour, add the following to your crontab:

> 10 * * * * python [path/to/]web/manage.py task_states

NOTE: If you are using virtualenv, make sure you activate it before running the command.


## Email

In order to send forgotten password emails, a valid SMTP server will need to be set in _web/local_settings.py_. The two main settings are `EMAIL_HOST` and `EMAIL_PORT`.

For testing, these can be set to `localhost` and `1025` and the following run from the command line:

    python -m smtpd -n -c DebuggingServer localhost:1025

All email that Django sends will then me piped to stdout on the terminal where the above was issued.

For more information on various Django email settings that can be added to _local_settings.py_, see:

* http://docs.djangoproject.com/en/1.3/topics/email/
* http://docs.djangoproject.com/en/1.3/ref/settings/


### Set the site name in Django Admin

To complete the email settings, edit the site 'Domain name' and 'Display name' in the admin panel, at _/admin/sites/site/1/_


## Email template

An email template can be created in _web/templates/password_reset_email.html_
It's best to copy the template from _[server/frontend/templates/password_reset_email.html](https://github.com/dharmafly/tasket/blob/master/server/frontend/templates/password_reset_email.html)_ and edit it to fit your needs.


## Admin users

### There are two types of Tasket admins:

1. _'task admins'_ – users that can perform various admin operations using the front end (such as editing any task or hub).
2. _'super users'_ – users that can log in to the Django backend and edit other users (to make them a 'task admin', for example).


### Task admins
Task admins will have access to edit and delete any task or project, as if it was their own. Additionally, they have the power (and are encouraged) to verify (or reject) any Done tasks.


### Superusers
Only 'superusers' can login to the Django admin. You should avoid creating more superusers than strictly necessary, as they will have access to all the app's data, with the power to delete or cause a mess. Superusers should only use Django to change the admin rights of other users.

*_Do NOT_* delete projects (called "Hubs") or tasks from within Django – do that via the app itself, otherwise there will be broken references between items in the database. Similarly, do not delete users from within Django (currently there is no way to do this via the app).

To login as a superuser, go to http://yourdomain.com/admin/ in a browser. You'll need the same username and password as your login to the app (you may already be logged in).


### Changing a normal user into a task admin

(The user must already have created an account by signing up within the app).

Log in to Django and go to http://yourdomain.com/admin/tasks/profile/ (or click through the navigation). Click on the user you want to edit. Click the '*Admin*' checkbox and '*Save*' the user.


### Changing a normal user into a superuser

Log in to Django and go to http://yourdomain.com/admin/auth/user/ (or click through the navigation). Click on the user you want to edit. Check both the '*Superuser*' and '*Staff*' checkboxes and '*Save*' the user.


### Troubleshooting: when no superusers exist

A superuser should have been created when the site was installed. If no superuser exists, running the following will create a one: 

    python manage.py createsuperuser

### The Tasket API

The Tasket server runs as a simple JSON API, allowing innovation in the client apps that consume it. API documentation can be found at: https://github.com/dharmafly/tasket/blob/master/docs/api.md


# Branches and workflow

The Tasket repository on GitHub uses two main branches, '*master*' and '*release*'.  The release branch always contains a production-ready version of Tasket, ready to be deployed to a live server. The master branch is the latest development version of Tasket, containing any recent stable updates.  

When developing new functionality for Tasket, consider creating local development branches for each feature.  When complete, these changes should be committed and merged into the '*master*' branch.  Once these updates have been tested and verified as ready for release, they should be merged into the remote '*release*' branch.

This approach allows new features to be added to Tasket while maintaining a version of the app in a deployable state at all times.

To set up the master/release branches via the command line:

    # setup new branches so that git-pull(1) will appropriately merge from the remote branch
    git config branch.autosetupmerge true
    
    # setup a local release branch to track the remote release branch
    git branch --track release origin/release
    
    # merge changes from master into the release branch
    git checkout release
    git merge master
