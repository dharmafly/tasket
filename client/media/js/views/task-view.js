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
        var data = this.model.toJSON(),
            currentUser = app.currentUser,
            claimedByModel, claimedBy;

        data.isClaimed = !!data.claimedBy;

        // TODO: provide url for user
        // TODO: wrap hub nucleus image in url link
        this.elem.html(tim("task", data));
        this.updateClaimedBy();

        data.showTakeThisButton = !data.hasUser;
        data.showDoneThisButton = (data.claimedBy === currentUser);

        return this.offsetApply();
    },

    updateClaimedBy: function () {
        var templateName = "task-claimed-by-user",
            claimedById = this.model.get("claimedBy"),
            model;

        if (!claimedById) {
            return this;
        }

        if (claimedById === app.currentUser.id) {
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
