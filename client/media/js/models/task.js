// TASK STATES

var TaskStates = {
    NEW     : "new",
    CLAIMED : "claimed",
    DONE    : "done",
    VERIFIED: "verified"
};

// NOTE: we are currently manually setting these, but they should be derived from Tasket.TASK_ESTIMATE_MAX (in core/tasket.js), which itself should be derived from the API call: GET /settings/
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
        description: "",
        image: "",
        // Set estimate to 0 so that we know it is a new task. This default should not be changed, as it used in models/hub.js and app.js to determine if a task has been later updated from the default.
        estimate: 0,
        state: TaskStates.NEW
    },

    constructor: function Task() {
        Model.prototype.constructor.apply(this, arguments);
    },

    state: function(newState, userid){
        var task = this,
            currentState = this.get("state"),
            timestamp = Math.round(now() / 1000),
            error;

        if (!newState){
            return currentState;
        }

        error = function(){
            throw task.report(
                "Can't change state from '" + currentState + "' to '" + newState + "'" +
                (userid ?
                    "" :
                    " (no userid)"
                )
            );
        };

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
                if (userid && currentState === TaskStates.NEW){
                    this.set({
                        claimedBy: userid,
                        claimedTime: timestamp
                    });
                }
                else if (!this.get("claimedBy")){
                    error();
                }

                this.unset("doneBy")
                    .unset("doneTime")
                    .unset("verifiedBy")
                    .unset("verifiedTime");
            break;

            case TaskStates.DONE:
                if (userid && currentState === TaskStates.CLAIMED){
                    this.set({
                        doneBy: userid,
                        doneTime: timestamp
                    });
                }
                else if (!this.get("doneBy")){
                    error();
                }

                this.unset("verifiedBy")
                    .unset("verifiedTime");
            break;


            case TaskStates.VERIFIED:
                if (userid && currentState === TaskStates.DONE){
                    this.set({
                        verifiedBy: userid,
                        verifiedTime: timestamp
                    });
                }
                else if (!this.get("verifiedBy")){
                    error();
                }
            break;

            default:
            error();
        }

        this.previousState = currentState;
        this.set({
            state: newState
        });

        return this;
    },

    isOpen: function(){
        return this.state() !== TaskStates.VERIFIED;
    },

    initialize: function(){
        Model.prototype.initialize.apply(this, arguments);
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
