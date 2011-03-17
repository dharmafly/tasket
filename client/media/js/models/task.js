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
        if (!newState){
            return this.get("state");
        }
        // If a permitted state, then set it
        // TODO: only allow stepwise changes, including user and change time?
        if (_(Task.states).include(newState)){
            this.set({state: newState});
        }
        return this;
    },
    
    _changeState: function(model, newState, userid){ // TODO: use bind to .set("state") or simply require method to be called directly?
        var currentState = this.state,
            now = Tasket.now();
        
        switch (newState){
            case "new":
                this.set("claimedBy", null);
                delete this.claimedTime;
                delete this.doneBy;
                delete this.doneTime;
                delete this.verifiedBy;
                delete this.verifiedTime;
            break;
            
            case "claimed":
                if (userid){
                    this.claimedBy = userid;
                    this.claimedTime = now;
                }
                
                delete this.doneBy;
                delete this.doneTime;
                delete this.verifiedBy;
                delete this.verifiedTime;
            break;
            
            case "done":
                if (userid && currentState === "new"){
                    this.doneBy = userid;
                    this.doneTime = now;
                }
            
                delete this.verifiedBy;
                delete this.verifiedTime;
            break;
            
            
            case "verified":
                if (userid && currentState === "done"){
                    this.verifiedBy = userid;
                    this.verifiedTime = now;
                }
            break;
        }
        
        return this;
    },
    
    initialize: function(){
        Model.prototype.initialize.apply(this, arguments);
        this.bind("change:state", this._changeState);
    }
});
Task.states = TaskStates;

// TASKS COLLECTION
var TaskList = CollectionModel.extend({
    model: Task
});
