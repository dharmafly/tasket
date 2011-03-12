var TaskView = Backbone.View.extend({
    tagName: "li",
    
    events: {
        //"click button": "completeTask"
    },
    
    initialize: function(options){
        this.elem = jQuery(this.el);
    },
    
    offsetValues: function(offset){
        this.options.offset = offset;
        return this;
    },
    
    offsetApply: function(){
        var offset = this.options.offset;
        if (offset){
            this.elem.offset(offset);
        }
        return this;
    },
    
    offset: function(offset){
        if (offset){
            return this
                .offsetValues(offset)
                .offsetApply();
        }
        return this.options.offset || {
            top:0,
            left:0
        };
    },

    render: function(){
        var data = this.model.toJSON(),
            currentUser = Tasket.currentUser;
        
        data.hasUser = !!data.claimedBy;
        if (data.hasUser){
            data.isOwner = (data.owner === currentUser);
            data.isNotOwner = !data.isOwner;
        }
        
        data.showTakeThisButton = !data.hasUser;
        data.showDoneThisButton = (data.claimedBy === currentUser);
        
        // TODO: make more elegant in Tim? Or use blank strings as default in models?
        _(data).each(function(value, key){
            if (data[key] === null){
                data[key] = "";
            }
        });
        
        this.elem
            .html(tim("task", data));
            
        return this.offsetApply();
    }
});
