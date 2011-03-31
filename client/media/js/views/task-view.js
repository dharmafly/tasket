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
        _.bindAll(this, "render");
        this.model.bind("change", this.render);
    },

    render: function(){
        var data = this.model.toJSON(),
            currentUser = app.currentUser,
            claimedByModel, claimedBy;

        data.hasUser = !!data.claimedBy;
        if (data.hasUser){
            data.isOwner = (data.owner === currentUser.id);
            data.isNotOwner = !data.isOwner;
        }
        
        data.showTakeThisButton = !data.hasUser;
        data.showDoneThisButton = (data.claimedBy === currentUser);
        
        if (data.claimedBy){
            claimedByModel = Tasket.getUsers([data.claimedBy]).at(0);

            // TODO - will this always have been fetched?
            claimedBy = data.claimedBy = claimedByModel.attributes;
            claimedBy.url = claimedByModel.url();
            claimedBy.image = claimedBy.image || app.userPlaceholderImage;
        }        
        
        // TODO: provide url for user
        // TODO: wrap hub nucleus image in url link
        
        this.elem
            .html(tim("task", data));
            
        return this.offsetApply();
    }
});
