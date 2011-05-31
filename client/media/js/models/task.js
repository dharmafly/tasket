// TASK STATES

var TaskStates = {
    NEW     : "new",
    CLAIMED : "claimed",
    DONE    : "done",
    VERIFIED: "verified"
};

// TODO: we are currently manually setting these, but they should be derived from Tasket.TASK_ESTIMATE_MAX (in core/tasket.js), which itself should be derived from the API call: GET /settings/
var TaskEstimates = [
    {text: "Fifteen minutes", value: 60*15},
    {text: "Half an hour",    value: 60*30},
    {text: "One hour",        value: 60*60},
    {text: "Two hours",       value: 60*60*2},
    {text: "Three hours",     value: 60*60*3},
    {text: "Four hours",      value: 60*60*4}
];

// TASK
var Task = Model.extend({
    // required: owner

    type: "task",

    required: ["owner", "hub", "estimate"],

    defaults: {
        state: TaskStates.NEW,
        description: "",
        image: "",
        // Setting the `estimate` to 0 indicated that it is a new task. This shouldn't be changed, as it used in models/hub.js and app.js to determine if a task has later been updated from the default.
        estimate: 0
    },

    constructor: function Task() {
        Model.prototype.constructor.apply(this, arguments);
    },

    initialize: function(){
        Model.prototype.initialize.apply(this, arguments);
        
        _.bindAll(this, "_changeStateError");
    },
    
    _changeStateError: function(currentState, newState, userid){
        throw this.report(
            "Can't change state from '" + currentState + "' to '" + newState + "'" +
            (userid ?
                "" :
                " (no userid)"
            )
        );
    },

    state: function(newState, userid, force){
        // TODO: change server implementation to allow jumping between states, as long as the required associated properties are also present - e.g. from "claimed" to "verified", as long as claimedBy, doneBy and verifiedBy are all present (should server use passed timestamp?)
        // {"error": ["New and claimed tasks can't be verified"]}
    
        var task = this,
            currentState = this.get("state"),
            timestamp, error, attr, toSet;
            
        if (!newState){
            return currentState;
        }
        
        timestamp = Math.round(now() / 1000);
        error = this._changeStateError;
        
        if (!userid){
            error(currentState, newState, userid);
        }
        
        // Use single object of attribute, instead of requesting "get" every time
        attr = this.attributes;
        toSet = {};
        
        // In force mode, use the userid to fill in any *missing* associated users on the Task object (it won't overwrite existing user properties - to that: task.set({claimedBy:"231"});
        // Force mode is useful, for example, to allow auto-verifying of a "done" task when the user did it is an admin or the owner of the hub
        if (force === true){
            // Fill in owner
            if (!attr.owner){
                toSet.owner = userid;
                toSet.createdTime = timestamp;
            }
            // Fill in claimedBy, if task is that advanced
            if (newState !== TaskStates.NEW && !attr.claimedBy){
                toSet.claimedBy = userid;
                toSet.claimedTime = timestamp;
            }
            // Fill in doneBy, if task is that advanced
            if (newState !== TaskStates.NEW && newState !== TaskStates.CLAIMED && !attr.doneBy){
                toSet.doneBy = userid;
                toSet.doneTime = timestamp;
            }
            // Fill in verifiedBy, if task is that advanced
            if (newState === TaskStates.VERIFIED && !attr.verifiedBy){
                toSet.verifiedBy = userid;
                toSet.verifiedTime = timestamp;
            }
        }
        
        // In normal mode, require task states to change only in an ordered manner
        else {
            switch (newState){
                case TaskStates.CLAIMED:
                    if (currentState === TaskStates.NEW){
                        toSet.claimedBy = userid;
                        toSet.claimedTime = timestamp;
                    }
                    else if (!this.attr.claimedBy){
                        error(currentState, newState, userid);
                    }
                break;
                
                case TaskStates.DONE:
                    if (userid && currentState === TaskStates.CLAIMED){
                        toSet.doneBy = userid;
                        toSet.doneTime = timestamp;
                    }
                    else if (!this.attr.doneBy){
                        error(currentState, newState, userid);
                    }
                break;
                
                case TaskStates.VERIFIED:
                    // If we're not moving directly from "done" -> "verified", then error
                    if (!currentState === TaskStates.DONE){
                        error(currentState, newState, userid);
                    }
                    
                    // Set the new user properties on the task
                    toSet.verifiedBy = userid;
                    toSet.verifiedTime = timestamp;
                break;

                default:
                error(currentState, newState, userid);
            }
        }
        
        // If this task was "done" by its owner, then automatically verify it
        if (Tasket.settings.AUTOVERIFY_TASKS_DONE_BY_OWNER){
            if (newState === TaskStates.DONE){
                doneBy = toSet.doneBy || attr.doneBy;
                owner  = toSet.owner  || attr.owner;
                
                if (doneBy && doneBy === owner){
                    // Force a task state change from "done" => "verfied"
                    return this.state("verified", doneBy, true);
                }
            }
        }

        // Remove unused properties
        switch (newState){
            case TaskStates.NEW:
                this.unset("claimedBy")
                    .unset("claimedTime")
                    .unset("doneBy")
                    .unset("doneTime")
                    .unset("verifiedBy")
                    .unset("verifiedTime");
            break;

            case TaskStates.CLAIMED:
                this.unset("doneBy")
                    .unset("doneTime")
                    .unset("verifiedBy")
                    .unset("verifiedTime");
            break;

            case TaskStates.DONE:
                this.unset("verifiedBy")
                    .unset("verifiedTime");
            break;
        }

        this.previousState = currentState;
        toSet.state = newState;

        return this.set(toSet);
    },

    isOpen: function(){
        return this.state() !== TaskStates.VERIFIED;
    },

    humanEstimate: function () {
        return humanTimespan(this.get("estimate"));
    }
}, {
    ESTIMATES: TaskEstimates
});
Task.states = TaskStates;

// TASKS COLLECTION
var TaskList = CollectionModel.extend({
    model: Task,
    constructor: function TaskList(){
        CollectionModel.prototype.constructor.apply(this, arguments);
    }
});
