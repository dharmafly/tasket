// USER
var User = Model.extend({
    type: "user",

    required: ["realname"],

    defaults: {
        image: "",
        description: "",
        location: ""
    },

    constructor: function User() {
        Model.prototype.constructor.apply(this, arguments);
    },

    initialize: function(){
        Model.prototype.initialize.call(this, arguments);
    }
});

// USERS COLLECTION
var UserList = CollectionModel.extend({
    model: User
});
