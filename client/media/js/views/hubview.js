var HubView = View.extend({
    tagName: "article",
    className: "hub",
    
    defaults: {
        selected: false,
        taskDistance: 20
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
        var container = this.taskListElem,
            nucleusRadius = this.nucleusElem.outerWidth(true) / 2,
            taskWidth, taskHeight, taskHalfWidth, taskHalfHeight,
            angle = ((2 * Math.PI) / this.taskViews.size()),
            //svgElem = this.$("svg"),
            distance = this.get("taskDistance") + nucleusRadius;
            
            // TEMP: show distance boundary
            container.append("<li style='border:3px solid #3c3; position:absolute; top:-162px; left:-162px; width:324px; height:324px; border-radius:30em; -moz-border-radius:30em; background-color:transparent; padding:0;' id='foo'></li>");
            
        this.taskViews.each(function(taskView, i){
            var taskElem = taskView.elem,
                top, left;
            
            taskView.render();
            container.append(taskElem);
            
            if (!taskWidth){
                taskWidth  = taskElem.outerWidth(true);
                taskHeight = taskElem.outerHeight(true);
                taskHalfWidth  = taskElem.outerWidth(true) / 2;
                taskHalfHeight = taskElem.outerHeight(true) / 2;
            }
            top = Math.cos(angle * i) * distance;
            left = Math.sin(angle * i) * distance - taskHalfWidth;
            
            /*
            if (left < 0){
                left += (left / (distance * 2)) * taskWidth;
            }
            else {
                left += (left / (distance * 2)) * taskWidth * 2;
            }
            */
            // TODO: need to do ratio of these values
            if (top < 0){
                top -= taskHeight;
            }
            
            O(taskElem[0], top, left, taskWidth, nucleusRadius, angle);
            
            taskView.offset({
                top:  Math.round(top),
                left: Math.round(left)
            });
            
        }, this);
        
        return this;
    },
    
    clearTasks: function(){
        this.taskListElem.empty();
        return this;
    },

    render: function(){
        var data = this.model.toJSON(),
            desc = data.description;
        
        data.isSelected = this.isSelected();
        data.description = truncate(data.description, ui.hubDescriptionTruncate);
        
        this.elem.html(tim("hub", data));
        this.nucleusElem = this.elem.children("img.nucleus");
        this.tasksElem = this.$("div.tasks");
        this.taskListElem = this.tasksElem.children("ul");
            
        if (data.isSelected){
            this.renderTasks();
        }
        return this.offsetApply();
    },
    
    initialize: function(){
        View.prototype.initialize.apply(this, arguments);
        this._generateTaskViews(); // Note, this requires all task models to have been fetched
    }
});
