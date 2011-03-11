// HUB
Hub = Model.extend({
    type: "hub",
    
    required: ["owner"],
    
    defaults: {
        title: null,
        description: null,
        image: null
    },  
        
    initialize: function(){
        Model.prototype.initialize.apply(this, arguments);
        this.tasks = this.attributes.tasks;
    }
});

// HUBS COLLECTION
HubList = CollectionModel.extend({
    model: Hub
});
