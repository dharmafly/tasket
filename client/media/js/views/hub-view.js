var HubView = View.extend({
    tagName: "article",
    className: "hub",

    defaults: {
        selected: false,
        taskDistance: 20,
        strokeStyle: "#555",
        lineWidth: 2
    },

    events: {
        "click .nucleus-wrapper": "onclick"
    },

    constructor: function HubView() {
        View.prototype.constructor.apply(this, arguments);
    },

    initialize: function () {    
        View.prototype.initialize.apply(this, arguments);
        this.forceDirector = app.createForceDirector({
            numCycles: 400,
            inCoulombK: 750,
            updateStepMin: 0.2,
            updateStepMax: 1.7,
            updateStepDamping: 0.01,
            inVelDampK: 0.1,
            //inWallRepulsion: 1500,
            fps: 5
        });
        
        _.bindAll(this, "updateImage", "updateTitle");
        this.model.bind("change:title", this.updateTitle);
        this.model.bind("change:description", this.updateTitle);
        this.model.bind("change:image", this.updateImage);
        this.model.bind("change:tasks", function () {
            this.refreshTasks();
        });
    },

    updateTitle: function () {
        this.$("h1").html(this.model.escape("title"));
        this.$("h2").html(this.model.escape("description"));
        this._updateMargin();
        return this;
    },

    updateImage: function () {
        this.$("img.nucleus").attr('src', this.imageSrc());
        return this;
    },

    imageSrc: function(src){
        if (src){
            return this.set({
                image:src
            });
        }
        src = this.model.get("image");
        
        // Return cropped thumbnail or placeholder if no image.
        return src ? Tasket.thumbnail(src, 30, 30, true) : app.hubPlaceholderImage;
    },

    isSelected: function(){
        return this.get("selected");
    },

    tasksVisible: function(){
        return this.get("tasksVisible");
    },

    onclick: function (event) {
        var isSelected = this.isSelected(),
            tasksVisible = this.tasksVisible();

        event.preventDefault();

        this.sendToFront();
        if (isSelected){
            this.toggleTasks();
        }
        else {
            this.updateLocation();
            // this changes the location hash, which causes the controller to trigger the route "displayHub"
        }
    },

    showTasks: function () {
        this.select();

        if (this.tasksVisible()) {
            return this;
        }

        this.set("tasksVisible", true);

        if (!this.tasks) {
            this.refreshTasks();
        }

        if (this.tasks.isComplete()) {
            return this.renderTasks();
        }
        return this.loading();
    },

    toggleTasks: function(){
        if (this.tasksVisible()){
            return this.clearTasks();
        }
        return this.showTasks();
    },

    toggleSelected: function(){
        if (this.isSelected()){
            return this.deselect();
        }
        return this.select();
    },

    loading: function (active) {
        var method = (active === false) ? "removeClass" : "addClass";
        this.elem[method]("loading");
        return this;
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

    refreshTasks: function () {
        var hubView = this;

        this.tasks = Tasket.getTasks(this.getDisplayTasks());
        this.tasks.bind("refresh", function () {
            // Regenerate the task views.
            hubView.generateTaskViews();

            if (hubView.tasksVisible()) {
                // If the tasks are displayed re-render them.
                hubView.renderTasks();
            }
        });

        if (this.tasks.isComplete()) {
            this.generateTaskViews();
        }
        return this;
    },

    // Gets an array of task ids to display from the model object.
    getDisplayTasks: function () {
        return _(["new", "claimed", "done"])
          .chain().map(function (key) {
              return this.get("tasks." + key);
          }, this.model)
          .flatten()
          .value();
    },

    generateTaskViews: function(){
        this.taskViews = _( // NOTE: this.taskViews is an Underscore collection
            this.tasks.filter(function (task) {
                return task.get('state') !== Task.states.VERIFIED;
            })
            .map(function(task){
                return new TaskView({
                    model: task
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
            this.canvasContext = null;
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
    
    clearTasks: function(){
        this.taskListElem.empty();
        this.clearCanvas();
        this.set("tasksVisible", false);
        return this;
    },

    // Vertically centres the hub title/description.
    _updateMargin: function () {
        var content = this.$('hgroup');
        content.css('margin-top', content.outerHeight() / 2 * -1);
        return this;
    },

    sendToFront: function () {
        // Increase the z-index to always ensure the latest one is on top.
        HubView.zIndex += 1;
        this.elem.css('z-index', HubView.zIndex);
        return this;
    },
    
    updateForceDirectedDimensions: function(){
        var taskBuffer = app.taskBuffer,
            hubViewOffset = this.offset();
        
        this.updateCachedDimensions();
        
        this.forcedNode.setWidth(this.nucleusWidth + taskBuffer);
        this.forcedNode.setHeight(this.nucleusWidth + taskBuffer);
        this.forcedNode.setPos(
            hubViewOffset.left - (taskBuffer / 2),
            app.invertY(hubViewOffset.top)
        );
        
        this.forcedNodeDesc.setWidth(this.descriptionWidth + taskBuffer);
        this.forcedNodeDesc.setHeight(this.descriptionHeight + taskBuffer);
        this.forcedNodeDesc.setPos(
            this.descriptionOffset.left + (this.descriptionWidth / 2) - (taskBuffer / 2),
            app.invertY(this.descriptionOffset.top)
        );
        
        return this;
    },
    
    initializeForceDirector: function(animate, callback){
        var hubView = this,
            forceDirector = this.forceDirector,
            taskViews = this.taskViews,
            tank = app.tankController,
            overallCallback;
        
        function repositionTasks(){
            var hubViewOffset = hubView.offset();
        
            taskViews.each(function(taskView){
                var taskPos = taskView.forcedNode.getPos(),
                    taskElem = taskView.elem,
                    taskWidth = taskElem.outerWidth(),
                    taskHeight = taskElem.outerHeight();
                    
                // repaint
                taskView.offset({
                    left: ~~(taskPos.x - taskWidth / 2 - hubViewOffset.left),
                    top:  ~~(app.invertY(taskPos.y + hubViewOffset.top + taskHeight / 2))
                });
            });
        }
            
        forceDirector.engine.reset();
        
        // Add hub node
        this.forcedNode = this.forceDirector.engine.addProject({
            key: "hub-" + this.model.id
        });
        
        // Add description element
        this.forcedNodeDesc = this.forceDirector.engine.addTaskToProject({
            key: "hubDesc-" + this.model.id,
            fixed: true
        });
    
        if (callback){
            overallCallback = function(){
                repositionTasks();
                callback.call(this);
            };
        }
        else {
            overallCallback = repositionTasks;
        }
        
        _.extend(forceDirector.options, {
            wallTop: tank.wallTop,
            wallBottom: tank.wallBottom,
            wallLeft: tank.wallLeft,
            wallRight: tank.wallRight,
            animate: animate ? repositionTasks : null,
            callback: overallCallback
        });
        
        // Show walls
        //jQuery("<div style='position:absolute; outline:1px solid green; width:" + (tank.wallRight-tank.wallLeft) + "px; top:" + app.invertY(tank.wallTop) + "px; height: " + (tank.wallTop - tank.wallBottom) + "px; left:" + tank.wallLeft + "px; pointer-events:none;'></div>").prependTo("body");
        
        forceDirector.initialized = true;
        
        return this;
    },
    
    // TODO: addTask needed
    // appendTaskView to the DOM. It will be later removed when the hubView is de-selected
    appendTaskView: function(taskView){
        var model = taskView.model,
            taskElem = taskView.elem,
            hubViewOffset, taskWidth, taskHeight;
            
        taskView.render();
        taskElem.appendTo(this.taskListElem);
        
        // Set up force-direction on this taskView, if not yet done
        if (!taskView.forcedNode){
            hubViewOffset = this.offset();
            taskWidth = taskElem.outerWidth();
            taskHeight = taskElem.outerHeight();
            
            // TODO: set f.TASK_WIDTH, etc.
            // TODO: try setting far away from the nucleus, distributed equally around the circle
            taskView.forcedNode = this.forceDirector.engine.addTaskToProject({
                key: "task-" + model.id,
                width: taskWidth,
                height: taskHeight,
                x: hubViewOffset.left + Math.random() - 0.5,
                y: app.invertY(hubViewOffset.top + Math.random() - 0.5)
            }, "hub-" + this.model.id);
        }
    },
      
    forcedirectTasks: function(animate, callback){
        this.updateForceDirectedDimensions();
        this.forceDirector.go();
        return this;
    },
    
    renderTasks: function(){
        var hubView = this,
            forceDirectionNeeded;        
        
        this.loading(false);
        
        if (!this.forceDirector.initialized){
            this.initializeForceDirector();
            forceDirectionNeeded = true;
        }
        else {
            // Detect if any of the tasks has not been force-directed yet
            forceDirectionNeeded = this.taskViews.any(function(taskView){
                return !taskView.forcedNode;
            });
        }
        
        this.taskViews.each(function(taskView){
            hubView.appendTaskView(taskView);
        });
        
        if (forceDirectionNeeded){
            this.forcedirectTasks();
        }
        
        return this;
    },
    
    updateCachedDimensions: function(){
        // NOTE: these calculations require this.elem to be present in the document's DOM, for CSS styling
        this.nucleusWidth = this.nucleusElem.outerWidth(); // TODO: cache on app, as this is the same for all hubs - deliberately not outerWidth(true), due to negative margin oddities
        this.descriptionWidth = this.labelElem.outerWidth(true); // dimensions of collapsed label
        this.descriptionHeight = this.labelElem.outerHeight(true); // dimensions of collapsed label
        this.descriptionOffset = this.labelElem.offset(); // dimensions of collapsed label
        this.width = this.nucleusWidth + this.descriptionWidth;
        this.height = this.nucleusWidth + this.labelElem.outerHeight(true); // NOTE height can vary for different hub descriptions
    },
    
    render: function(){
        var data = this.model.toJSON();

        data.isSelected = this.isSelected();
        data.description = truncate(data.description, app.hubDescriptionTruncate);
        data.image = this.imageSrc();
        data.canEdit = app.isCurrentUser(data.owner);

        this.elem.html(tim("hub", data));
        this.nucleusElem = this.elem.children("a.nucleus-wrapper");
        this.tasksElem = this.$("div.tasks");
        this.taskListElem = this.tasksElem.children("ul");
        this.labelElem = this.$("hgroup");
        this.canvasElem = this.$("canvas");
        
        this._canvasSetup();
        this._updateMargin();
        this.offsetApply();
        this.updateCachedDimensions();
        
        if (data.isSelected){
            this.renderTasks();
        }
        return this;
    }
}, {
    /* Global keeping check of the current z-index */
    zIndex: 0
});
