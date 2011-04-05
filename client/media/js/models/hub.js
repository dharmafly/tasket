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
    },

    // Returns all tasks.
    getTasks: function () {
        var keys = ["new", "claimed", "done", "verified"];
        return _(keys).chain().map(function (key) {
            return this.get("tasks." + key + ".ids");
        }, this).flatten().value();
    }
});

// HUBS COLLECTION
var HubList = CollectionModel.extend({
    model: Hub,
    constructor: function HubList(){
        CollectionModel.prototype.constructor.apply(this, arguments);
    },
});
