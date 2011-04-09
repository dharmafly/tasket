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
        _.bindAll(this, "updateTasks");
        Tasket.bind("task:change:state", this.updateTasks);
    },

    // Returns true if user has claimed less tasks than the limit allows.
    canClaimTasks: function () {
        return this.get("tasks.claimed.claimed") < Tasket.settings.CLAIMED_LIMIT;
    },

    // Updates the users tasks when the state of a task changes.
    updateTasks: function (task) {
        var id = task.id,
            data = {},
            current  = task.get("state"),
            previous = task.previous("state");

        _.each(["owned", "claimed"], function (group) {
            var previousKey = "tasks." + group + "." + previous,
                previousIds = this.get(previousKey),
                currentKey  = "tasks." + group + "." + current,
                currentIds;

            if (_.indexOf(previousIds, id) > -1) {
                data[previousKey] = _.without(previousIds, id);

                currentIds = _.clone(this.get(currentKey));
                currentIds.push(id);
                data[currentKey] = currentIds;
            }
        }, this);

        return this.set(data);
    }
});

// USERS COLLECTION
var UserList = CollectionModel.extend({
    model: User,
    constructor: function UserList(){
        CollectionModel.prototype.constructor.apply(this, arguments);
    }
});

