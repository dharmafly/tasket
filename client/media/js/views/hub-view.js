var HubView = View.extend({
    tagName: "article",
    className: "hub",
    
    defaults: {
        selected: false,
        taskDistance: 20,
        strokeStyle: "#555",
        lineWidth: 2
    },
    
    isSelected: function(){
        return this.get("selected");
    },
    
    tasksVisible: function(){
        return this.get("tasksVisible");
    },
    
    events: {
        "click img.nucleus": "onclick"
    },
    
    onclick: function(){
        var isSelected = this.isSelected(),
            tasksVisible = this.tasksVisible();

        if (isSelected){
            this.toggleTasks();
        }
        else {
            this.updateLocation();
            // this changes the location hash, which causes the controller to trigger the route "displayHub"
        }
    },
    
    toggleTasks: function(){
        if (this.tasksVisible()){
            return this.clearTasks();
        }
        return this.renderTasks();
    },
    
    
    /*
        on every click:
            show arrows
            update url
            
            if active:
                hide tasks
                
            else:
                show tasks
    */
    
    toggleSelected: function(){
        if (this.isSelected()){
            return this.deselect();
        }
        return this.select();
    },    
    
    select: function(){
        this.set("selected", true);
        this.trigger("select", this);
        this.elem.addClass("select");
        return this;
    },
    
    deselect: function(){
        this.set("selected", false);
        this.trigger("deselect", this);
        this.elem.removeClass("select");
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
    
    _canvasSetup: function(){
        var canvasElem = this.canvasElem,
            context = this.canvasContext = canvasElem[0].getContext && canvasElem[0].getContext("2d"),
            width, radius;
            
        if (!context){
            return false;
        }
            
        width = this.canvasWidth = (this.get("taskDistance") * 2) + this.nucleusWidth;
        radius = Math.round(width / 2);
        
        canvasElem
            .attr({
                width: width,
                height: width
            })
            .css({
                left: -radius,
                top: -radius
            });
            
        context.translate(radius, radius);
        context.strokeStyle = this.get("strokeStyle");
        context.lineWidth = this.get("lineWidth");
        return this;
    },
    
    clearCanvas: function(){
        var context = this.canvasContext,
            width = this.canvasWidth;
            
        if (context){
            context.clearRect(-width / 2, -width / 2, width, width);
        }
        return this;
    },
    
    line: function(x, y){
        var context = this.canvasContext;
        
        if (context){
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(x, y);
            context.stroke();
            context.closePath();
        }
        return this;
    },
    
    renderTasks: function(){
        var container = this.taskListElem,
            nucleusRadius = this.nucleusWidth / 2,
            angleIncrement = ((2 * Math.PI) / this.taskViews.size()),
            distance = this.get("taskDistance") + nucleusRadius,
            taskWidth, taskHeight;
            
        // TEMP: show distance boundary
        var tempDistance = Math.round(distance),
            tempWidth = tempDistance * 2;
        container.append("<li style='position:absolute; top:-" + tempDistance + "px; left:-" + tempDistance + "px; width:" + tempWidth + "px; height:" + tempWidth + "px; border-radius:30em; -moz-border-radius:30em; -webkit-border-radius:30em; -o-border-radius:30em; -ms-border-radius:30em; background-color:#cc0; padding:0; border-style:none; opacity:0.2; pointer-events:none;' class='distanceMarker'></li>");

            
        this.taskViews.each(function(taskView, i){
            var taskElem = taskView.elem.appendTo(container),
                angle = angleIncrement * i,
                left, top, leftAdjust, topAdjust;
            
            taskView.render();
            
            if (!taskWidth){
                taskWidth  = taskElem.outerWidth(true);
            }
            // TODO: taskHeight currently varies each time - change?
            taskHeight = taskElem.outerHeight(true);
            
            left = Math.sin(angle) * distance;
            top  = Math.cos(angle) * distance;
            
            // Draw line on canvas - TODO: needs rounding?
            this.line(left, top);
            
            // RATIO OF DISTANCE
            leftAdjust = (((left / 2) - (distance / 2)) / distance) * taskWidth;
            topAdjust  = (((top  / 2) - (distance / 2)) / distance) * taskHeight;
            
            left += leftAdjust;
            top  += topAdjust;
            
            left = Math.round(left);
            top = Math.round(top);
            
            taskView.offset({
                left: left,
                top:  top
            });            
        }, this);
        
        this.set("tasksVisible", true);
        return this;
    },
    
    clearTasks: function(){
        this.taskListElem.empty();
        this.clearCanvas();
        this.set("tasksVisible", false);
        return this;
    },

    render: function(){
        var data = this.model.toJSON(),
            desc = data.description;
        
        data.isSelected = this.isSelected();
        data.description = truncate(data.description, app.hubDescriptionTruncate);
        
        this.elem.html(tim("hub", data));
        this.nucleusElem = this.elem.children("img.nucleus");
        // NOTE: this calculation requires this.elem to be present in the document's DOM, for CSS styling
        this.nucleusWidth = this.nucleusElem.outerWidth(true); // TODO: or use .set("nucleusWidth"); ?
        this.tasksElem = this.$("div.tasks");
        this.taskListElem = this.tasksElem.children("ul");
        this.labelElem = this.$("hgroup");
        this.canvasElem = this.$("canvas");
        this._canvasSetup();
            
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
