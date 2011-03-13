// TASK STATES
var TaskStates = {
    NEW     : "new",
    CLAIMED : "claimed",
    DONE    : "done",
    VERIFIED: "verified"
};

// TASK
var Task = Model.extend({
    // required: owner
        
    type: "task",
    
    required: ["owner", "hub"],
    
    defaults: { // TODO: sending null values to and from server is a waste of bandwidth
        description: null,
        image: null,
        estimate: null,
        state: TaskStates.NEW
    },
    
    initialize: function(){
        Model.prototype.initialize.apply(this, arguments);
    }
});
Task.states = TaskStates;

// TASKS COLLECTION
var TaskList = CollectionModel.extend({
    model: Task
});
