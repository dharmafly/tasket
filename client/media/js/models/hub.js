// HUB
var Hub = Model.extend({
    type: "hub",

    required: ["owner"],

    defaults: {
        title: "",
        description: "",
        image: ""
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

    // Returns all tasks.
    getTasks: function () {
        var keys = ["new", "claimed", "done", "verified"];
        return _(keys).chain().map(function (key) {
            return this.get("tasks." + key);
        }, this).flatten().value();
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
        if (_.indexOf(previousIds, id) > -1) {
            // Remove from the previous array of ids.
            data[previousKey] = _.without(previousIds, id);

            // Add to new array of ids.
            currentIds = _.clone(this.get(currentKey));
            currentIds.push(id);
            data[currentKey] = currentIds;

            // Update the estimates.
            data["estimates." + previous] = this.get("estimates." + previous) - estimate;
            data["estimates." + current]  = this.get("estimates." + previous) + estimate;
        }

        return this.set(data);
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

    // Updates the estimates on a task when changed.
    updateEstimates: function (task) {
        var current  = task.get("estimate"),
            previous = task.previous("estimate"),
            state = task.get("state"),
            key  = "estimates." + state,
            data = {};

        if (_.indexOf(this.get("tasks." + state), task.id) > -1) {
            data[key] = this.get(key) - previous + current;
        }
        return this.set(data);
    },

    weight: function(){
        var settings = Tasket.settings,
            maxMinutes = settings.TASK_ESTIMATE_MAX * settings.TASK_LIMIT,
            unclaimedMinutes = this.get("estimates.claimed"),
            weight = unclaimedMinutes / maxMinutes;

        return weight || 0;
    }
});

// HUBS COLLECTION
var HubList = CollectionModel.extend({
    model: Hub,
    constructor: function HubList(){
        CollectionModel.prototype.constructor.apply(this, arguments);
    }
});
