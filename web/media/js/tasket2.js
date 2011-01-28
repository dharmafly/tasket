function Task(id, hub, createdBy){
    this.id = id;
    this.hub = hub;
    this._status = {};
    this.status("created", createdBy);
    Task.collection[id] = this;
}
Task.prototype = {
    _status: null,
    status: function(type, user){
        if (newStatus){
            this._status[type] = user;
            return this;
        }
        return this._status;
    }
};
Task.collection = {};


/////


function Hub(id){
    this.id = id;
    this.tasks = {};
    this.admins = {};
    this._history = [];
    Hub.collection[id] = this;
}
Hub.prototype = {
    addAdmin: function(user){
        this.admins[user.id] = user;
        return this;
    },
    addTask: function(task){
        this.tasks[task.id] = task;
        return this;
    },
    /*
    history: function(thing, meta){
        this._history.push([thing, meta]);
        return this;
    },
    */
    confirmTaskDone: function(adminId, doneById){
        this.doneBy = User[doneById];
        this.confirmedBy = User[adminId];
        return this;
    }
};
Hub.collection = {};


/////


function User(id){
    this.id = id;
    User.collection[id] = this;
}
User.prototype = {
    addHub: function(hub){
        this.hubs[hub.id] = hub;
        hub.addAdmin(this);
        return this;
    },
    doTask: function(task){ // TODO: or move to Task prototype
        task.status("done", this);
        return this;
    },
    confirmTaskDone: function(task){
        if (task.admins[this.id]){
            task.status("donedone", this);
        }
        return this;
    },
    confirmTaskNotDone: function(task){
        if (task.admins[this.id]){
            task.status("notdone", this);
        }
        return this;
    }
};
User.collection = {};
