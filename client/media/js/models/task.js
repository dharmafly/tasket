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
    
    state: function(newState, userid){
        var task = this,
            currentState = this.get("state"),
            now, error;
        
        if (!newState){
            return currentState;
        }
        
        now = Tasket.now();
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
                    .unset("verifiedTime")
                    .set({
                        state: newState
                    });
            break;
            
            case TaskStates.CLAIMED:
                if (userid && currentState === TaskStates.NEW){
                    this.set({
                        claimedBy: userid,
                        claimedTime: now
                    });
                }
                else if (!this.get("claimedBy")){
                    error();
                }
                
                this.unset("doneBy")
                    .unset("doneTime")
                    .unset("verifiedBy")
                    .unset("verifiedTime")
                    .set({
                        state: newState
                    });
            break;
            
            case TaskStates.DONE:
                if (userid && currentState === TaskStates.CLAIMED){
                    this.set({
                        doneBy: userid,
                        doneTime: now
                    });
                }
                else if (!this.get("doneBy")){
                    error();
                }
            
                this.unset("verifiedBy")
                    .unset("verifiedTime")
                    .set({
                        state: newState
                    });
            break;
            
            
            case TaskStates.VERIFIED:
                if (userid && currentState === TaskStates.DONE){
                    this.set({
                        verifiedBy: userid,
                        verifiedTime: now
                    });
                }
                else if (!this.get("verifiedBy")){
                    error();
                }
                
                this.set({
                    state: newState
                });
            break;
            
            default:
            error();
        }
        
        return this;
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
