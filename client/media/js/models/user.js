// USER
var User = Model.extend({
    type: "user",

    required: ["name"],

    defaults: {
        name: "",
        image: "",
        description: "",
        location: "",
        tasks: {
            owned: {
                "new": [],
                "claimed": [],
                "done": [],
                "verified": []
            },
            claimed: {
                "claimed": [],
                "done": [],
                "verified": []
            }
        }
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

