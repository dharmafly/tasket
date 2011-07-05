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

        _.bindAll(this, "render", "updateClaimedBy", "updateEstimate", "updateControls");

        // Bind change events to a user model so that the task controls will
        // update disabled state when the users claimed tasks change.
        function applyUserBindings(user) {
            if (user) {
                user.bind("change:tasks.claimed.claimed", this.updateControls);
            }
        }

        this.model.bind("change", this.render);
        app.bind("change:currentUser", _.bind(function (user) {
            applyUserBindings.call(this, user);
            this.render();
        }, this));
        applyUserBindings.call(this, app.currentUser);
    },

    // Redirect to hub view URL - may go to a Task specific URL in future
    updateLocation: function(){
        app.tank.getHubView(this.model.get("hub")).updateLocation();
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
        data.canEdit = app.isCurrentUserOrAdmin(data.owner);
        data.isClaimed = !!data.claimedBy;
        data.estimate = this.model.humanEstimate();
        data.readmore = data.description.length > app.taskDescriptionTruncate;
        data.description = app.truncate(data.description, app.taskDescriptionTruncate);

        this.elem.html(tim("task", data));

        this.updateClaimedBy();
        this.updateControls();
        return this.offsetApply();
    },

    taskDetailsHTML: function(){
        var data = this.model.toJSON(),
            hub;

        data.isNew = this.model.isNew();
        data.isNotNew = !this.model.isNew();

        data.hubId = data.hub;
        
        // Add title of the hub
        hub = Tasket.hubs.get(data.hub);
        data.hubTitle = hub ? hub.get("title") : "";
        data.hasHubTitle = !!data.hubTitle;
        
        data.canEdit = app.isCurrentUserOrAdmin(data.owner);
        data.isClaimed = !!data.claimedBy;
        data.description = "{description}";
        data.estimate = this.model.humanEstimate();

        return tim("task-detail", data)
          .replace("{description}", nl2br(this.model.escape("description")));
    },
    
    displayDetails: function(){
        app.lightbox
            .content(this.taskDetailsHTML())
            .show();
            
        return this;
    },

    updateEstimate: function () {
        this.$(".estimate").text(this.model.humanEstimate());
    },

    updateControls: function () {
        var currentUser = app.currentUser,
            controls    = this.$(".controls"),
            template    = tim("task-control"),
            states      = Task.states,
            state       = this.model.get("state"),
            owner       = this.model.get("owner"),
            claimedById = this.model.get("claimedBy"),
            isLoggedIn  = !!currentUser,
            isDisabled  = false,
            data;

        if (state === states.NEW) {
            isDisabled = !(currentUser && currentUser.canClaimTasks());
            data = {
                id: this.model.id,
                type: "claimed",
                text: "I'll do it",
                state: Task.states.CLAIMED,
                title: (function () {
                    if (!currentUser) {
                        return "Please log in to start claiming tasks.";
                    }
                    else if (!currentUser.canClaimTasks()) {
                        return "You cannot claim this task just now. Please complete one of the " + Tasket.settings.CLAIMED_LIMIT + " tasks that you've claimed first.";
                    }
                    return "";
                })()
            };
        }
        else if (state === states.CLAIMED && app.isCurrentUser(claimedById)) {
            data = {
                id: this.model.id,
                type: "done",
                text: "I've done it",
                state: Task.states.DONE,
                title: ""
            };
        }
        else if (state === states.DONE && app.isCurrentUserOrAdmin(owner)) {
            data = {
                id: this.model.id
            };
            controls.html(tim("task-control-verified", data));
            return this;
        }

        if (data) {
            data.isDisabled = isDisabled;
            controls.html(tim("task-control", data));
        } else {
            controls.empty();
        }

        return this;
    },

    userImageSrc: function(user){
        var src = user.get("image");
        return src ?
            Tasket.thumbnail(src, app.userInTaskImageWidth, app.userInTaskImageHeight, true) :
            Tasket.media(app.userPlaceholderImage);
    },

    updateClaimedBy: function () {
        var templateName = "task-claimed-by-user",
            claimedById = this.model.get("claimedBy"),
            isDone = !!this.model.get("doneTime"),
            image,
            status,
            additional = "",
            model;

        if (!claimedById) {
            return this;
        }

        if (app.isCurrentUser(claimedById)) {
            model = app.currentUser;
            templateName = "task-claimed-by-you";

            if (isDone){
                status = "have done";
                additional = "It needs to be verified by an admin.";
            }
            else {
                status = "are doing";
            }
        } else {
            model = Tasket.getUsers(claimedById);
            model.bind("change", this.updateClaimedBy);
            status = isDone ? "has done" : "is doing";
        }

        this.$(".claimedBy").html(tim(templateName, {
            id: model.id,
            name: model.fullname(),
            image: this.userImageSrc(model),
            status: status,
            additional: additional,
            url: model.url()
        }));

        return this;
    }
});
