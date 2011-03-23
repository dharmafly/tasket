// HUB
var Hub = Model.extend({
    type: "hub",
    
    required: ["owner"],
    
    defaults: {
        title: '',
        description: '',
        image: ''
    },

    constructor: function Hub(){
        Model.prototype.constructor.apply(this, arguments);
    },

    initialize: function(){
        Model.prototype.initialize.apply(this, arguments);
        this.tasks = this.attributes.tasks;
    }
});

// HUBS COLLECTION
var HubList = CollectionModel.extend({
    model: Hub
});
