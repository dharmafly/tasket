var TaskView = View.extend({
    tagName: "li",
    className: "task",

    defaults: {},

    events: {
        //"click button": "completeTask"
    },

    constructor: function TaskView() {
        View.prototype.constructor.apply(this, arguments);
    },

    initialize: function () {
        View.prototype.initialize.apply(this, arguments);
        _.bindAll(this, "render", "updateClaimedBy");
        this.model.bind("change", this.render);
    },

    render: function(){
        var data = this.model.toJSON();

        data.hubId = data.hub;
        data.canEdit = app.isCurrentUser(data.owner);
        data.isClaimed = !!data.claimedBy;

        // TODO: provide url for user
        // TODO: wrap hub nucleus image in url link
        this.elem.html(tim("task", data));

        this.updateClaimedBy();
        this.updateControls();
        return this.offsetApply();
    },

    updateControls: function () {
        var controls    = this.$(".controls"),
            template    = tim("task-control"),
            claimedById = this.model.get("claimedBy"),
            data;

        if (!claimedById) {
            data = {
                type: "claim",
                text: "I'll do it"
            };
        }
        else if (app.isCurrentUser(claimedById)) {
            data = {
                type: "done",
                text: "I've done it"
            };
        }

        if (data) {
            controls.html(tim("task-control", data));
        } else {
            controls.empty();
        }

        return this;
    },

    updateClaimedBy: function () {
        var templateName = "task-claimed-by-user",
            claimedById = this.model.get("claimedBy"),
            model;

        if (!claimedById) {
            return this;
        }

        if (app.isCurrentUser(claimedById)) {
            model = app.currentUser;
            templateName = "task-claimed-by-you";
        } else {
            model = Tasket.getUsers(claimedById).at(0);
            model.bind("change", this.updateClaimedBy);
            return this;
        }

        this.$(".claimedBy").html(tim(templateName, {
            name: model.get("name"),
            image: model.get("image"),
            url: model.url()
        }));

        return this;
    }
});
