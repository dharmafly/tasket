var TaskView = View.extend({
    tagName: "li",
    className: "task",

    defaults: {},

    events: {
        "click": "updateLocation"
    },

    constructor: function TaskView() {
        View.prototype.constructor.apply(this, arguments);
    },

    initialize: function () {
        View.prototype.initialize.apply(this, arguments);
        _.bindAll(this, "render", "updateClaimedBy", "updateEstimate");
        this.model.bind("change", this.render);
    },
    
    // Redirect to hub view URL - may go to a Task specific URL in future
    updateLocation: function(){
        window.location.hash = "/hubs/" + this.model.get("hub") + "/";
        return this;
    },

    cacheDimensions: function(){
        this.width = this.elem.outerWidth();
        this.height = this.elem.outerHeight();
        return this;
    },

    render: function(){
        var data = this.model.toJSON();

        data.isNew = this.model.isNew();
        data.isNotNew = !this.model.isNew();

        data.hubId = data.hub;
        data.canEdit = app.isCurrentUser(data.owner);
        data.isClaimed = !!data.claimedBy;

        data.estimate = this.model.humanEstimate();

        this.elem.html(tim("task", data));

        this.updateClaimedBy();
        this.updateControls();
        return this.offsetApply();
    },

    updateEstimate: function () {
        this.$(".estimate").text(this.model.humanEstimate());
    },

    updateControls: function () {
        var controls    = this.$(".controls"),
            template    = tim("task-control"),
            states      = Task.states,
            state       = this.model.get("state"),
            owner       = this.model.get("owner"),
            claimedById = this.model.get("claimedBy"),
            isLoggedIn = !!app.currentUser,
            data;

        if (isLoggedIn){
            if (state === states.NEW && app.currentUser.canClaimTasks()) {
                data = {
                    id: this.model.id,
                    type: "claimed",
                    text: "I'll do it",
                    state: Task.states.CLAIMED
                };
            }
            else if (state === states.CLAIMED && app.isCurrentUser(claimedById)) {
                data = {
                    id: this.model.id,
                    type: "done",
                    text: "I've done it",
                    state: Task.states.DONE
                };
            }
            else if (state === states.DONE && app.isCurrentUser(owner)) {
                data = {
                    id: this.model.id,
                    type: "verify",
                    text: "Verify",
                    state: Task.states.VERIFIED
                };
            }
        }

        if (data) {
            controls.html(tim("task-control", data));
        }
        else {
            controls.empty();
        }

        return this;
    },

    updateClaimedBy: function () {
        var templateName = "task-claimed-by-user",
            claimedById = this.model.get("claimedBy"),
            isDone = !!this.model.get("doneTime"),
            status,
            model;

        if (!claimedById) {
            return this;
        }

        if (app.isCurrentUser(claimedById)) {
            model = app.currentUser;
            templateName = "task-claimed-by-you";

            status = isDone ? "have done" : "are doing";
        } else {
            model = Tasket.getUsers(claimedById);
            model.bind("change", this.updateClaimedBy);
            status = isDone ? "has done" : "is doing";
        }

        this.$(".claimedBy").html(tim(templateName, {
            id: model.id,
            name: model.get("name"),
            image: model.get("image"),
            status: status,
            url: model.url()
        }));

        return this;
    }
});
