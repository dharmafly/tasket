var TaskView = View.extend({
    tagName: "li",
    className: "task",
    
    defaults: {},
    
    events: {
        //"click button": "completeTask"
    },

    render: function(){
        var data = this.model.toJSON(),
            currentUser = Tasket.currentUser,
            claimedByModel, claimedBy;
        
        data.hasUser = !!data.claimedBy;
        if (data.hasUser){
            data.isOwner = (data.owner === currentUser);
            data.isNotOwner = !data.isOwner;
        }
        
        data.showTakeThisButton = !data.hasUser;
        data.showDoneThisButton = (data.claimedBy === currentUser);
        
        if (data.claimedBy){
            claimedByModel = Tasket.users.get(data.claimedBy);
            
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
