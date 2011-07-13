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


### Django admin

If you created a superuser account (recommended) when syncdb was run above, you can now log in to the django admin interface by going to [http://localhost:8000/admin/](http://localhost:8000/admin/)

To enable emailing (see below), you must edit the site 'Domain name' and 'Display name' at _/admin/sites/site/1/_


### Troubleshooting: images served with 500 Server Error

On Linux, if you find that images in the app are not successfully processed after upload (with a 500 Server Error for each image request), there may be a problem where the [Python Image Library (PIL)](http://effbot.org/zone/pil-index.htm) cannot find the correct path to JPEG and other image libraries. To resolve it, [follow the steps in this article](http://www.eddiewelker.com/2010/03/31/installing-pil-virtualenv-ubuntu/).

For further info, [see this article](http://effbot.org/zone/pil-decoder-jpeg-not-available.htm) and [Issue #110](https://github.com/dharmafly/tasket/issues/110).


## Building a single minified JavaScript file

### Build software installation

We use [smoosh](http://github.com/fat/smoosh) to package the JavaScript for production. To get it you
need [Node](http://nodejs.org) >= 4.0.1 and [npm](http://npmjs.org) installed.

For hints on installation, see 
[joyeur.com/2010/12/10/installing-node-and-npm/](http://joyeur.com/2010/12/10/installing-node-and-npm/)). 
In particular, you may need to add NPM to your system paths, and also to Node's paths.

Add to your shell (e.g. Bash) config file:

    # Make NPM packages available to the terminal - type `npm bin` to get your system's path
    export PATH=$HOME/node_modules/.bin:$PATH
    
    # Make NPM packages available to Node
    export NODE_PATH="/usr/local/lib/node_modules"

Then install Smoosh:

    npm install smoosh

You may need to make the Smoosh program executable:

    # you may need to prefix this command with 'sudo'
    chmod +x ~/node_modules/.bin/smoosh
    

## Building the JavaScript file
    
To package the JavaScript:

    cd client/media/js/build/
    
and either run Smoosh directly:

    smoosh -c ./config.json
    
or run from Node.js:

    node make.js

This will run [JSHint](http://jshint.com) against the codebase and write _tasket.js_ and
_tasket.min.js_ in to the _client/media/js/build/pkg/_ directory.

NOTE: Ignore any JSHint warnings for header.js and footer.js, as these are partial
JavaScript files used to enclose the Tasket application in a function closure.


## Debug mode
In /web/localsettings.py, the `DEBUG` flag is set to `True` by default, for ease of development with the local Django server. This should be set to `False` on deploy.


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
It's best to copy the template from _server/frontend/templates/password_reset_email.html_ and edit it to fit your needs.


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

### JavaScript debug mode

To enter debug mode, add `?debug` to the URL (before the #hash), e.g. http://localhost:8000/?debug#/hubs/

