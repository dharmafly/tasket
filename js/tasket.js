/*global jQuery, console, _*/

var namespace = "tasket",
    appName = "Tasket",
    version = "0.1.0",
    undef;

/////

function now(){
    return (new Date()).toString();
}

function isAlphaNum(arg){
    return typeof arg === "number" || typeof arg === "string";
}

function report(msg, type){
    return appName + (type ? " " + type : "") + ": " + msg;
}


/////


// TASKET CONSTRUCTOR
function Tasket(namespace){
    if (!namespace){
        throw report("namespace required");
    }
    this.namespace = namespace;
}

// TASKET: STATIC PROPERTIES
Tasket.version = version;

// TASKET: INSTANCE PROTOTYPE
Tasket.prototype = {
    tasks: {},
    users: {},
    hubs: {},
    
    _item: function(item, Constructor, collection){
        var remove = (Constructor === null);
    
        if (isAlphaNum(item)){
            item = collection[item];
                        
            return remove && item ?
                this._item(item, Constructor, collection) :
                item;
        }
        if (item && item.id){
            if (remove){
                delete collection[item.id];
            }
            else {
                item.tasket = this;
                item = new Constructor(item);
                collection[item.id] = item;
            }
        }
        return item;
    },
    
    // get/set task
    task: function(item, remove){
        var Constructor = remove === null ? null : Task,
            task = this._item(item, Constructor, this.tasks),
            hubTasks = task.hub.tasks;
        
        // Add/remove task to hub's collection
        if (task && task.id){
            if (remove){
                delete hubTasks[task.id];
            }
            else {
                hubTasks[task.id] = task;
            }
        }
        return task;
    },
    
    // get/set hub
    hub: function(hub, remove){
        var Constructor = remove === null ? null : Hub;
        return this._item(hub, Constructor, this.hubs);
    },
    
    // get/set user
    user: function(user, remove){
        var Constructor = remove === null ? null : User;
        return this._item(user, Constructor, this.users);
    },
    
    // Publish an event
    pub: function(type, item, data){
        console.log(type, data);
    },
    
    // Subscribe to an event
    sub: function(type, callback){
    }
};

function History(subject, tasket){
    this.subject = subject;
    this.tasket = tasket;
    this._history = [];
}
History.prototype = {
    push: function(type, data, timestamp){
        if (data){
            this._history.push([type, data, timestamp || now()]);
            
            // If this is a new action, then publish/trigger an event
            if (!timestamp){
                this.tasket.pub(
                    type + "." + this.subject.type,
                    this.subject,
                    data
                );
            }
        }
        return this;
    },
    
    get: function(){
        return this._history;
    }
};

function Task(settings){
    this.id = settings.id;
    this.hub = settings.hub;
    this.tasket = this.hub.tasket;
    this.owner = settings.owner;
    
    this.title = settings.title; // remove?
    this.description = settings.description;
    this.image = settings.image;
    this.estimate = settings.estimate;
    
    this.history = new History(this, this.tasket);
    this.event("created", this.owner, this.createdTime);
}
Task.prototype = {
    type: "task",
    
    event: function(event, user, timestamp){
        timestamp = timestamp || now();
        this[event] = {user:user, time:timestamp};
        this.history.push(event, user, timestamp);
        return this;
    },
    
    create: function(user, timestamp){
        return this.event("created", user, timestamp);
    },
    
    assign: function(user, timestamp){
        return this.event("assigned", user, timestamp);
    },
    
    complete: function(user, timestamp){        
        return this.event("completed", user, timestamp);
    },
    
    confirm: function(user, timestamp){
        return this.event("confirmed", user, timestamp);
    },
    
    remove: function(user, timestamp){
        this.tasket.task(this, null);
        return this.event("removed", user, timestamp);
    }
};


/////


function Hub(settings){
    this.id = settings.id;
    this.tasket = settings.tasket;
    this.owner = settings.owner;
    
    this.title = settings.title;
    this.description = settings.description;
    this.image = settings.image;
    
    this.tasks = {};
    this.admins = {};
    this.admins[this.owner.id] = this.owner;
    this.history = new History(this, this.tasket);
    this.event("created", this.owner, this.createdTime);
}
Hub.prototype = {
    type: "hub",
    
    event: function(event, user, timestamp){
        timestamp = timestamp || now();
        this[event] = {user:user, time:timestamp};
        this.history.push(event, user, timestamp);
        return this;
    },
    
    isAdmin: function(user){
        return !!(this.admins[user.id]);
    },
    
    admin: function(user, remove){
        if (remove){
            delete this.admins[user.id];
            this.event("adminRemoved", user);
        }
        else {
            this.admins[user.id] = user;
            this.event("adminCreated", user);
        }
        return this;
    },
    
    task: function(task, remove){
        if (remove){
            task.remove();
            this.event("taskRemoved"); // TODO: event user?, this needs calling by task.remove && tasket.task(null)
        }
        else {
            task.hub = this;    
            this.tasket.task(task, remove);
            this.event("taskCreated", task.owner, task.createdTime);
        }
        return this;
    },
    
    remove: function(user, timestamp){
        this.tasket.hub(this, null);
        this.history("removed", user, timestamp);
        return this;
    }
};


/////


function User(settings){
    this.id = settings.id;
    this.tasket = settings.tasket;
    this.hubsOwned = {};
    this.hubsAdmined = {};
    this.history = new History(this, this.tasket);
    this.history.push("created");
}
User.prototype = {
    type: "user"
};


/////

