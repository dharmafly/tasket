// HUB
var Hub = Model.extend({
    type: "hub",

    required: ["owner", "title"],

    defaults: {
        title: "",
        description: "",
        image: "",
        tasks: {
            "new": [],
            "claimed": [],
            "verified": [],
            "done": []
        },
        estimates: {
            "new": 0,
            "claimed": 0,
            "verified": 0,
            "done": 0
        }
    },

    // TODO: cache a flag for this value, and update each time a task is opened or closed
    isOpen: function(){
        var openTask = _.detect(this.get("tasks"), function(taskId){
            var task = Tasket.tasks.get(taskId);
            return task && task.isOpen();
        });
        return !_.isUndefined(openTask);
    },

    // Adds "Hub" for an instance in WebKit developer tools
    constructor: function Hub(){
        Model.prototype.constructor.apply(this, arguments);
    },

    initialize: function(){
        Model.prototype.initialize.apply(this, arguments);
        _.bindAll(this, "updateTasks", "updateEstimates");
        Tasket.bind("task:change:state", this.updateTasks);
        Tasket.bind("task:change:estimate", this.updateEstimates);
    },

    // Checks to see if this hub has room for any more non-verified tasks.
    canAddTask: function () {
        var tasks = 0;
        _.each(["new", "claimed", "done"], function (state) {
            tasks += this.get("tasks." + state).length;
        }, this);
        return tasks < Tasket.settings.TASK_LIMIT;
    },

    // Returns tasks of different states (default: all states)
    getTasks: function (states) {
        states = states || ["new", "claimed", "done", "verified"];
        return _(states).chain().map(function (state) {
            return this.get("tasks." + state);
        }, this).flatten().value();
    },
    
    // Count tasks of different states (default: all states)
    countTasks: function (states){
        return this.getTasks(states).length;
    },

    countNewTasks: function(){
        return this.countTasks([Task.states.NEW]);
    },
    
    // Count "done" and "verified" tasks
    countCompletedTasks: function(){
        return this.countTasks(["done", "verified"]);
    },
    
    // Check whether hub can be deleted
    canDelete: function () {
        var claimed = this.get("tasks.claimed"),
            done = this.get("tasks.done"),
            verified = this.get("tasks.verified");
        return claimed && claimed.length < 1 && done && done.length < 1 && verified && verified.length < 1;
    },

    addTask: function (task) {
        var currentTasks = this.get("tasks.new"),
            currentEstimates = this.get("estimates.new");

        if (_.indexOf(currentTasks, task.id) === -1) {
            this.set({
                "tasks.new": currentTasks.concat(task.id),
                "estimates.new": currentEstimates + task.get("estimate")
            });
        }
        return this;
    },

    removeTask: function (task, options) {
        var data        = {},
            state       = task.get('state'),
            tasksKey    = 'tasks.' + state,
            estimateKey = 'estimates.' + state;

        data[tasksKey]    = _.without(this.get(tasksKey), task.id);
        data[estimateKey] = this.get(estimateKey) - task.get('estimate');
        
        return this.set(data, options);
    },

    // Updates the hubs tasks and estimates when the state of a task changes.
    updateTasks: function (task) {
        var id = task.id,
            data = {},
            current  = task.get("state"),
            previous = task.previous("state"),
            estimate = task.get("estimate"),
            previousKey = "tasks." + previous,
            previousIds = this.get(previousKey),
            currentKey  = "tasks." + current,
            currentIds;

        // If this hub owns this task.
        if (_.indexOf(previousIds, id) >= 0) {
            // Remove from the previous array of ids.
            data[previousKey] = _.without(previousIds, id);

            // Add to new array of ids.
            currentIds = _.clone(this.get(currentKey));
            currentIds.push(id);
            data[currentKey] = currentIds;

            // Update the estimates.
            data["estimates." + previous] = this.get("estimates." + previous) - estimate;
            data["estimates." + current]  = this.get("estimates." + current)  + estimate;
        }
        return this.set(data);
    },
    
    forEachTask: function (iterator){ // iterator is passed the taskId
        var hub = this;
        _.each(Task.states, function(state){
            var tasks = hub.get("tasks." + state);
            if (tasks) {
                _.each(tasks, iterator);
            }
        });
        return this;
    },

    estimate: function () {
        var estimate = 0;
        _.each(["new", "claimed", "done"], function (key) {
            estimate += this.get("estimates." + key);
        }, this);
        
        return estimate;
    },

    humanEstimate: function () {
        return humanTimespan(this.estimate());
    },
    
    isArchived: function(){
        // Check presence of boolean property
        // NOTE: this will be correct, even if the server has not yet responded with a timestamp after a request to archive() or unarchive()
        var isArchived = this.get("archived");

        // If temporary flag does not exist, then check if details of the property are present on the model
        if (!_.isBoolean(isArchived)){
            isArchived = !!this.get("archived.timestamp");
        }
        return isArchived;
    },
    
    archive: function() {
        return this.save({archived: true});
    },
    
    unarchive: function() {
        var hub = this;
        
        _.each(this.attributes, function(val, key){
            if (key.indexOf("archived.") === 0){
                hub.unset(key);
            }
        });
        
        return this.save({archived:false});
    },

    // Updates the estimates on a task when changed.
    updateEstimates: function (task) {
        var current  = task.get("estimate"),
            previous = task.previous("estimate"),
            state = task.get("state"),
            key  = "estimates." + state,
            data = {};

        // Check the task belongs to this hub and that it' estimate is not 0. If
        // estimate is 0 then this is a new Task being loaded and the hub
        // should already have accounted for it either getting the value from
        // the server or in #addHub().
        if (_.indexOf(this.get("tasks." + state), task.id) > -1 && previous !== 0) {
            data[key] = this.get(key) - previous + current;
        }
        return this.set(data);
    }
});

// HUBS COLLECTION
var HubList = CollectionModel.extend({
    model: Hub,
    constructor: function HubList(){
        CollectionModel.prototype.constructor.apply(this, arguments);
    }
});
