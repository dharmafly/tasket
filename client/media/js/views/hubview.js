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
        this.clearCanvas();
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
    
    /*
    
    tasks width: (19.321 + (0.923×2) + (0.23075×2)) × 2 = 42.7955 em
    hub: 90 px
    padding: 5em;

    tasks height: (6.4 + (0.923×2) + (0.23075×2)) × 2 = 17.415em
    hub: 90 px
    padding: 5em;
    
    */    
        var container = this.taskListElem,
            nucleusRadius = this.nucleusWidth / 2,
            taskWidth, taskHeight, taskHalfWidth, taskHalfHeight,
            angle = ((2 * Math.PI) / this.taskViews.size()),
            distance = this.get("taskDistance") + nucleusRadius;
            
            // TEMP: show distance boundary
            // TODO: find out why this is off-centre
            var tempDistance = Math.round(distance),
                tempWidth = tempDistance * 2;
                
            container.append("<li style='position:absolute; top:-" + tempDistance + "px; left:-" + tempDistance + "px; width:" + tempWidth + "px; height:" + tempWidth + "px; border-radius:30em; background-color:#cc0; padding:0; border-style:none; opacity:0.2; pointer-events:none;' class='distanceMarker'></li>");
            
        
            
        this.taskViews.each(function(taskView, i){
            var taskElem = taskView.elem,
                left, top;
            
            taskView.render();
            container.append(taskElem);
            
            if (!taskWidth){
                taskWidth  = taskElem.outerWidth(true);
                taskHeight = taskElem.outerHeight(true);
                taskHalfWidth  = taskWidth / 2;
                taskHalfHeight = taskHeight / 2;
            }
            left = Math.sin(angle * i) * distance;
            top = Math.cos(angle * i) * distance;
            
            this.line(left, top);
            O("line", Math.round(left), Math.round(top));
            
            /*
            if (left < 0){
                left += (left / (distance * 2)) * taskWidth;
            }
            else {
                left += (left / (distance * 2)) * taskWidth * 2;
            }
            */
            // TODO: need to do ratio of these values
            // RATIO OF DISTANCE
            
            // if l ===  d, l / d ===  1, lAdj === 0;
            // if l ===  0, l / d ===  0, lAdj === -taskWidth / 2;
            // if l === -d, l / d === -1, lAdj === -taskWidth;
            
            var leftAdjust = ((left / 2) - (distance / 2)) / distance * taskWidth,
                topAdjust  = ((top  / 2) - (distance / 2)) / distance * taskHeight;
            
            left += leftAdjust;
            top  += topAdjust;
            
            left = Math.round(left);
            top = Math.round(top);
            
            
            O(taskElem[0], left, top, leftAdjust, topAdjust)//, angle, distance, taskHeight, taskHalfWidth);
            
            taskView.offset({
                left: left,
                top:  top
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
