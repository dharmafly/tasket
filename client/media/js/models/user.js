// USER
var User = Model.extend({    
    type: "user",
    
    required: ["realname"],
    
    defaults: {
        image: null,
        description: null,
        location: null
    },
    
    initialize: function(){
        Model.prototype.initialize.apply(this, arguments);
        this.hubs = {
            owned: new HubList()
        };
        this.tasks = {
            owned:   new TaskList(),
            claimed: new TaskList()
        };
    }
});

// USERS COLLECTION
var UserList = CollectionModel.extend({
    model: User
});
