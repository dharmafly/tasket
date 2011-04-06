# Tasket API #

Note: in future, arrays may be further filtered by ?page=n&per_page=m - e.g. /hubs/3/tasks?page=2&per_page=10


## Hubs ##

    /hubs/                  # GET:   Gets all active hubs (ie. hubs that have unverified tasks remaining)
    /hubs/?ids=ids          # GET:   Gets array of hubs matching :ids (comma-delimited list of ids)
    /hubs/                  # POST:  Creates a hub (responds with new id & createdTime eg.
                                         {"id": "hub_id", "createdTime": 1298567873})
    /hubs/:id               # GET:   Gets a single hub for :id
    /hubs/:id               # PUT:   Updates a single hub for :id
    /hubs/:id               # DELETE Deletes a single hub for :id
    /hubs/:id/tasks         # GET    Gets array of all unverified tasks for this hub
    /hubs/:id/image         # POST   Uploads an image to the hub with :id (requires multipart/form-data)

### Hub Model Data ###

    {
        "id": "HUB_ID",           *required (assigned by server on creation)
        "title": "TITLE",         *required
        "owner": "USER_ID",       *required
        "description": "",
        "image": "",
        "tasks": {
            "new":      [/* ids of tasks */],
            "claimed":  [/* ids of tasks */],
            "done":     [/* ids of tasks */],
            "verified": [/* ids of tasks */]
        },
        "estimates": {
            "new":      232, // total estimated time for all new tasks, in seconds
            "claimed":  2224,
            "done":     44554,
            "verified": 4534
        },
        "createdTime": 1298567873
    }

## Tasks ##

    /tasks/                  # GET:   Gets all unverified tasks
    /tasks/?ids=:ids         # GET:   Gets array of tasks matching :ids (comma-delimited list of ids)
    /tasks/?state=:state     # GET:   Gets array of tasks that are in the state :state, or a comma-delimited list of states
                                          (possible states: "new", "claimed", "done", "verified")
    /tasks/                  # POST:  Creates a task (responds with new id eg. {"id": "task_id"})
    /tasks/:id               # GET:   Gets a single task for :id
    /tasks/:id               # PUT:   Updates a single task for :id
    /tasks/:id               # DELETE Deletes a single task for :id
    /tasks/:id/image         # POST   Uploads an image to the task with :id (requires multipart/form-data)

### Task Model Data ###

    {
        "id": "TASK_ID",          *required (assigned by server on creation)
        "hub": "HUB_ID"           *required
        "owner": "USER_ID",       *required
        "estimate": ESTIMATE_TIME,*required
        "description": "",
        "image": "",
        "state": "new",
        "createdTime": 1298567873
        "claimedBy": "user_id",
        "claimedTime": 1231214214,
        "doneTime": 1231214214,
        "verifiedBy": "user_id",
        "verifiedTime": 1231214214
    }

### Task State Constants ###

NEW     : "new",  
CLAIMED : "claimed",  
DONE    : "done",  
VERIFIED: "verified"  

## Users ##

     /users/               # GET:   Gets array of all users
     /users/?ids=:ids      # GET:   Gets array of users matching :ids (comma delimited list of ids)
     /users/               # POST:  Creates a user (responds with new id eg. {"id": "user_id"})
     /users/:id            # GET:   Gets a single user for :id
     /users/:id            # PUT:   Updates a single user for :id
     /users/:id            # DELETE Deletes a single user for :id
     /users/:id/image      # POST   Uploads an image to the user with :id (requires multipart/form-data)

### User registration ###

POSTing to /users/ with the following JSON object will create a user and log 
them in.  The newly created profile object ID will be returned.

POST JSON:

{
    'username': 'test99', 
    'email': 'foo@example.com', 
    'password': '12345', 
    'description': 'New description!', 
    'name': 'Test User 99'
}


### User Model Data ###

    {
        "id": "USER_ID",      *required (assigned by server on creation)
        "name": "DISPLAY_NAME", *required
        "description": "",
        "location": "",
        "image": "",
        "admin": false,
        "hubs": {
            "owned": [/* hubs created by this user   */]
        },
        "tasks": {
            "owned": {
                "new":      [/* tasks owned by this user that have not been claimed */]
                "claimed":  [/* tasks owned by this user that have been claimed but not done */],
                "done":     [/* tasks owned by this user that have been done but not verified */],
                "verified": [/* tasks owned by this user that have been verified */]
            },
            "claimed": {
                "claimed":  [/* tasks claimed by this user that have not yet been done */],
                "done":     [/* tasks claimed by this user that have been done but not verified */],
                "verified": [/* tasks claimed by this user that have been verified */]
            }
        },
        "estimates": {
            "owned": {
                "new":      232, // total estimated time for all new tasks owned by this user, in seconds
                "claimed":  232, // total estimated time for all claimed tasks owned by this user, in seconds
                "done":     232, // total estimated time for all done tasks owned by this user, in seconds
                "verified": 232  // total estimated time for all verified tasks owned by this user, in seconds
            },
            "claimed": {
                "claimed":  232, // total estimated time for all tasks claimed by this user that are not yet done, in seconds
                "done":     232, // total estimated time for all tasks claimed by this user that are done but not verified, in seconds
                "verified": 232  // total estimated time for all tasks claimed by this user that have been verified, in seconds
            }
        },
        "createdTime": 1298567873
    }


## Images ##

[image path] here is the value of the 'image' attribute on the models above.

    /media/[image path]           #GET original uploaded image
    /thumb/NxN/[image path]       #GET thumbnail constrained to N
    /thumb/NxN/[image path]?crop  #GET thumbnail constrained to N and cropped form the centre
    
    
## Statistics ##

    /statistics/     #GET hash of relevant global statistics

### Statistics data ###
    {
        new: 23      // Total tasks with "new" status
        claimed: 123 // Total tasks with "claimed" status etc.
        done: 23
        verified: 345
    }


## Settings ##

    /settings/      #GET JSON object containing key/value pairs of settings, as 
                     white listed in settings.EXPOSED_SETTINGS
