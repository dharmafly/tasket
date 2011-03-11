HubView = Backbone.View.extend({
    tagName: "article",
    
    defaults: {
        offsetTop:0,
        offsetLeft:0,
        selected:false
    },
    
    getset: function(property, value){
        return _.isUndefined(value) ? this.get(property) : this.set(property, value);
    },
    
    get: function(property){
        var value = this.options[property];
        return _.isUndefined(value) ? this.defaults[property] : value;
    },
    
    set: function(property, value){
        this.options[property] = value;
        this.trigger("change", property, value);
        return this;
    },
    
    isSelected: function(){
        return this.get("selected");
    },
    
    events: {
        "click": "toggleSelected"
    },
    
    toggleSelected: function(){
        if (this.isSelected()){
            return this.deselect();
        }
        return this.select();
    },
    
    select: function(){
        this.set("selected", true);
        this.trigger("select");
        this.elem.addClass("select");
        this.renderTasks();
        return this;
    },
    
    deselect: function(){
        this.set("selected", false);
        this.trigger("deselect");
        this.elem.removeClass("select");
        this.clearTasks();
        return this;
    },
    
    offsetValues: function(offset){
        return this.getset("offset", offset);
    },
    
    offsetApply: function(){
        var offset = this.options.offset;
        if (offset){ // only apply offset if it is not the default
            this.elem.offset(offset);
        }
        return this;
    },
    
    offset: function(offset){ // TODO: ensure HubElem or tasksCollection has position:relative
        if (offset){
            return this
                .offsetValues(offset)
                .offsetApply();
        }
        return this.get("offset") || {
            top:  this.defaults.offsetTop,
            left: this.defaults.offsetLeft
        };
    },
    
    _generateTaskViews: function(){        
        this.taskViews = _( // TODO: This is an Underscore collection. Confusing? Or genius?
            _(this.model.tasks).map(function(id){
                return new TaskView({
                    model: Tasket.tasks.get(id)
                });
            })
        );
        return this;
    },
    
    renderTasks: function(){
    
    /*
    
    tasks width: (19.321 + (0.923×2) + (0.23075×2)) × 2 = 42.7955 em
    hub: 90 px
    padding: 5em;

    tasks height: (6.4 + (0.923×2) + (0.23075×2)) × 2 = 17.415em
    hub: 90 px
    padding: 5em;
    
    */    
        var container = this.$("div.tasks > ul"),
            containerHalfWidth = container.outerWidth(true) / 2,
            containerHalfHeight = container.outerHeight(true) / 2,
            taskWidth, taskHeight, taskHalfWidth, taskHalfHeight,
            angle = ((2 * Math.PI) / this.taskViews.size()),
            //svgElem = this.$("svg"),
            distance = 162;
            
            // TEMP: show distance boundary
            container.append("<li style='border:3px solid #3c3; position:absolute; top:-162px; left:-162px; width:324px; height:324px; border-radius:30em; -moz-border-radius:30em; background-color:transparent; padding:0;' id='foo'></li>");
            
        this.taskViews.each(function(taskView, i){
            var top, left, elem = taskView.elem;
            
            container.append(taskView.render().elem);
            
            if (!taskWidth){
                taskWidth  = elem.outerWidth(true);
                taskHeight = elem.outerHeight(true);
                taskHalfWidth  = elem.outerWidth(true) / 2;
                taskHalfHeight = elem.outerHeight(true) / 2;
            }
            top = Math.round(Math.cos(angle * i) * distance) - (distance / 2);
            left = Math.round(Math.sin(angle * i) * distance) - (distance / 2);
            
            /*
            if (left < 0){
                left += (left / (distance * 2)) * taskWidth;
            }
            else {
                left += (left / (distance * 2)) * taskWidth * 2;
            }
            */
            O(taskView, i, top, left);
            
            taskView.offset({
                top: top,
                left: left
            });
            
        }, this);
        
        return this;
    },
    
    clearTasks: function(){
        var container = this.$("div.tasks > ul");
        container.empty();
        return this;
    },

    render: function(){
        var data = this.model.toJSON(),
            desc = data.description;
        
        data.isSelected = this.isSelected();
        data.description = truncate(data.description, ui.hubDescriptionTruncate);
        
        this.elem.html(tim("hub", data));
            
        if (data.isSelected){
            this.renderTasks();
        }
        return this.offsetApply();
    },
    
    initialize: function(options){
        this.elem = jQuery(this.el);
        this._generateTaskViews(); // Note, this requires all task models to have been fetched
    }
});
