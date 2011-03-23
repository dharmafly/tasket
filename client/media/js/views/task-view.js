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
            userModel;
        
        data.hasUser = !!data.claimedBy;
        if (data.hasUser){
            data.isOwner = (data.owner === currentUser);
            data.isNotOwner = !data.isOwner;
        }
        
        data.showTakeThisButton = !data.hasUser;
        data.showDoneThisButton = (data.claimedBy === currentUser);
        
        if (data.owner){
            userModel = Tasket.users.get(data.owner);
            data.owner = userModel.attributes;
            data.owner.url = userModel.url();
        }        
        
        //O(data.owner); // TODO: change user.realname -> user.name?
        // TODO: provide url for user
        // TODO: wrap hub nucleus image in url link
        
        this.elem
            .html(tim("task", data));
            
        return this.offsetApply();
    }
});
