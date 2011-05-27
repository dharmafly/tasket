var HubView = View.extend({
    tagName: "article",
    className: "hub",

    defaults: {
        selected: false,
        strokeStyle: "#555",
        lineWidth: 2
    },

    events: {
        "click a.nucleus-wrapper": "onclick",
        "click hgroup": "updateLocation"
    },

    constructor: function HubView() {
        View.prototype.constructor.apply(this, arguments);
    },

    initialize: function () {
        View.prototype.initialize.apply(this, arguments);

        _.bindAll(this, "updateWalls", "repositionTasks", "refreshTasks", "updateImage", "updateTitle", "updateDescription", "updateEstimate", "updateAdminActions", "_onTaskRemoved");
        
        // **
        
        // Force director
        this.forceDirector = ForceDirector.create({
            animate: app.animateTasks,
            numCycles: 400,
            inCoulombK: 750,
            updateStepMin: 0.2,
            updateStepMax: 2,
            updateStepDamping: 0.01,
            inVelDampK: 0.1,
            inHookeK: 0.1
        });
        
        // Add hub node
        this.forcedNode = this.forceDirector.createSun({
            key: "hub-" + this.model.id
        });
        
        this.forceDirector
            .bind("loop", this.repositionTasks)
            .bind("end", this.repositionTasks);
            
        app.tank
            .bind("resize", this.updateWalls)
            .bind("change:walls", this.updateWalls);
            
        this.bind("change:walls", this.repositionTasks);
        
        this.updateWalls(app.tank, app.tank.forceDirector.getWalls());
        
        
        // **
        

        this.model
            .bind("change:title", this.updateTitle)
            .bind("change:description", this.updateDescription)
            .bind("change:image", this.updateImage)
            .bind("delete:task", this._onTaskRemoved)
        
            // hasChanged() function is in core/core.js
            .bind("change", hasChanged(["estimates.new", "estimates.claimed", "estimates.done", "estimates.verified"], this.updateEstimate))
            .bind("change", hasChanged(["tasks.new", "tasks.claimed", "tasks.done", "tasks.verified"], this.refreshTasks));

        app.bind("change:currentUser", this.updateAdminActions);
    },
    
    updateWalls: function(tank, dimensions){
        var currentWalls = this.forceDirector.getWalls();
        
        if (!_.isEqual(currentWalls, dimensions)){
            this.forceDirector.setWalls(dimensions);
            this.trigger("change:walls");
        }
        
        return this;
    },

    updateTitle: function () {
        this.$("h1").html(this.model.escape("title"));
        return this._updateMargin();
    },

    updateDescription: function () {
      var description = this.$("hgroup h2"),
          text = app.truncate(this.model.get("description"), app.hubDescriptionTruncate);

      description.html(escapeHTML(text));
      return this._updateMargin();
    },

    updateImage: function () {
        this.$("img.nucleus").attr("src", this.imageSrc());
        return this;
    },

    updateEstimate: function () {
        this.$(".estimate").text("(" + (this.model.humanEstimate() || app.lang.HUB_NO_TASKS) + ")");
        return this;
    },

    updateAdminActions: function () {
        var currentUser = app.currentUser,
            controls = this.$("hgroup"),
            actions  = controls.find(".admin-actions"),
            canEdit  = app.isCurrentUserOrAdmin(this.model.get("owner"));

        if (canEdit && !actions.length) {
            controls.prepend(tim("hub-admin-actions", {id: this.model.id}));
        }
        else if (canEdit && actions.length) {
            actions.remove();
        }

        return this._updateMargin();
    },

    imageSrc: function(src){
        if (src){
            return this.set({
                image:src
            });
        }
        src = this.model.get("image");

        // Return cropped thumbnail or placeholder if no image.
        return src ?
            Tasket.thumbnail(src, app.hubImageWidth, app.hubImageHeight, true) :
            Tasket.media(app.hubPlaceholderImage);
    },

    isSelected: function(){
        return this.get("selected");
    },

    tasksVisible: function(){
        return !!this.get("tasksVisible");
    },

    onclick: function (event) {
        if (this.isSelected()){
            this.sendToFront().toggleTasks();
        }
        else {
            this.updateLocation();
            // this changes the location hash, which causes the controller to trigger the route "displayHub"
        }
        event.preventDefault();
    },

    showTasks: function (options) {
        this.select();
        
        if (this.tasksVisible()) {
            return this;
        }

        if (!options || !options.silent){
            this.set("tasksVisible", true);
        }

        if (!this.tasks || !this.taskViews) {
            this.refreshTasks();
        }

        if (this.tasks.isComplete()) {
            if (this.tasks.length){
                this.renderTasks();
            }
            return this;
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
        if (!this.isSelected()){
            this.set("selected", true);
            this.trigger("select", this);
            this.elem.addClass("select");
            app.bodyElem.addClass("hubSelected");
        }
        return this;
    },

    deselect: function(){
        if (this.isSelected()){
            this.set("selected", false);
            this.elem.removeClass("select");
            app.bodyElem.removeClass("hubSelected");
            this.clearTasks();
            this.trigger("deselect", this);
        }
        return this;
    },
    
    // TODO: tidy this up, and merge with refreshTasks
    redrawTasks: function(){
        this.cacheTaskViewCenterBounds()
            .clearTasks({silent:true})
            .renderTasks();
    },

    refreshTasks: function () {
        var hubView = this;

        function redisplay(){
            if (hubView.tasksVisible()) {
                hubView
                    .removeForceDirectedTaskNodes()
                    .generateTaskViews()
                    .cacheTaskViewCenterBounds()
                    .clearTasks({silent:true})
                    .renderTasks();
            }
        }

        this.tasks = Tasket.getTasks(this.getDisplayTasks());

        if (this.tasks.isComplete()){
            redisplay();
        }

        this.tasks
            .unbind("refresh", redisplay)
            .bind("refresh", redisplay);
            
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
            this.tasks.select(function (task) {
                return task.isOpen();
            })
            .map(function(task){
                return new TaskView({
                    model: task
                });
            })
        );
        return this;
    },

    resizeCanvas: function(){
        var context = this.canvasContext,
            bounds = this.taskViewCenterBounds,
            hubViewOffset = this.offset(),
            width, height;

        if (!context){
            return this;
        }

        this.canvasWidth = width = bounds.right - bounds.left;
        this.canvasHeight = height = bounds.bottom - bounds.top;

        this.canvasElem
            .attr({
                width:  width,
                height: height
            })
            .css({
                left: bounds.left,
                top:  bounds.top
            });

        // Translate coordinates and save canvas state. It will be restored in clearCanvas(), to allow a different translation next time
        context.save();
        context.translate(
            -bounds.left,
            -bounds.top
        );
        return this;
    },

    initializeCanvas: function(){
        var canvasElem = this.canvasElem = jQuery(this.make("canvas")),
            context = this.canvasContext = canvasElem[0].getContext && canvasElem[0].getContext("2d") || null;

        if (!context){
            return this;
        }

        context.strokeStyle = this.get("strokeStyle");
        context.lineWidth = this.get("lineWidth");

        return this;
    },

    appendCanvas: function(){
        if (!this.canvasElem){
            this.initializeCanvas();
        }
        if (this.canvasContext){
            this.tasksElem.prepend(this.canvasElem);
        }
        return this;
    },

    clearCanvas: function(){
        var context = this.canvasContext,
            width = this.canvasWidth,
            height = this.canvasHeight;

        if (context){
            context.clearRect(-width / 2, -width / 2, width, width);
            context.restore(); // restore any applied context coordinate translations from resizeCanvas()
        }
        return this;
    },

    removeCanvas: function(){
        if (this.canvasElem){
            this.canvasElem.remove();
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

    clearTasks: function(options){
        this.taskListElem.empty();
        this.clearCanvas()
            .removeCanvas();

        if (!options || !options.silent){
            this.set("tasksVisible", false);
        }
        return this;
    },
    
    // TODO: drawLines doesn't function when app.animateTasks === true
    drawLines: function(){
        var hubView = this;
    
        this.taskViews.each(function(taskView){
            var offset = taskView.offset();
            hubView.line(offset.left + taskView.width / 2, offset.top + taskView.height / 2);
        });
        return this;
    },

    // Vertically centres the hub title/description.
    _updateMargin: function () {
        this.labelElem.css("margin-top", this.labelElem.outerHeight() / 2 * -1);
        return this;
    },

    sendToFront: function () {
        // Increase the z-index to always ensure the latest one is on top.
        HubView.zIndex += 1;
        this.elem.css("z-index", HubView.zIndex);
        return this;
    },

    // A listener triggered by the model's removeTask function    
    _onTaskRemoved: function(hub, task){
        this.taskViews = this.taskViews.chain().reject(function(taskView){
            if (taskView.model.id === task.id){
                taskView.remove();
                return true;
            }
        });
        return this.removeForceDirectorNode("task-" + task.id).forcedirectTasks();
    },

    cacheDimensions: function(){
        // NOTE: these calculations require this.elem to be present in the document's DOM, for CSS styling
        this.nucleusWidth = this.nucleusElem.outerWidth(); // TODO: cache on app, as this is the same for all hubs - deliberately not outerWidth(true), due to negative margin oddities
        this.descriptionWidth = this.labelElem.outerWidth(); // dimensions of collapsed label
        this.descriptionHeight = this.labelElem.outerHeight(); // dimensions of collapsed label
        this.descriptionOffset = this.labelElem.offset(); // dimensions of collapsed label
        this.width = (this.nucleusWidth / 2) + this.descriptionWidth;
        this.height = this.nucleusWidth; // NOTE height currently does not take description into account
    },

    // Get the bounding box of the centre points of each of the taskViews
    cacheTaskViewCenterBounds: function(){
        var taskViewCenterBounds = this.taskViewCenterBounds = {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
        };

        this.taskViews.each(function(taskView){
            var centerX = taskView.offset().left + taskView.width / 2,
                centerY = taskView.offset().top + taskView.height / 2;

            if (centerY < taskViewCenterBounds.top){
                taskViewCenterBounds.top = centerY;
            }
            if (centerY > taskViewCenterBounds.bottom){
                taskViewCenterBounds.bottom = centerY;
            }
            if (centerX < taskViewCenterBounds.left){
                taskViewCenterBounds.left = centerX;
            }
            if (centerX > taskViewCenterBounds.right){
                taskViewCenterBounds.right = centerX;
            }
        });

        return this;
    },

    renderTasks: function(){
        var hubView = this,
            taskViews = this.taskViews,
            forceDirectionNeeded, lineWidth, taskViewCenterBounds;

        this.loading(false);
        
        // Detect if any of the tasks has not been force-directed yet
        forceDirectionNeeded = this.taskViews.any(function(taskView){
            return !taskView.forcedNode;
        });
        
        taskViews.each(function(taskView){
            hubView.appendTaskView(taskView);
        });

        if (forceDirectionNeeded){
            this.forcedirectTasks();
        }

        return this.appendCanvas()
            .resizeCanvas()
            .drawLines();
    },

    render: function(){
        var data = this.model.toJSON();

        data.estimate   = this.model.humanEstimate() || app.lang.HUB_NO_TASKS;
        data.isSelected = this.isSelected();
        data.readmore = data.description.length > app.hubDescriptionTruncate;
        data.description = app.truncate(data.description, app.hubDescriptionTruncate);
        data.image = this.imageSrc();
        data.hubId = this.model.id;

        this.elem.html(tim("hub", data));
        this.nucleusElem = this.elem.children("a.nucleus-wrapper");
        this.tasksElem = this.$("div.tasks");
        this.taskListElem = this.tasksElem.children("ul");
        this.labelElem = this.$("hgroup");

        this.offsetApply();
        this.cacheDimensions();
        this.updateAdminActions();
        this._updateMargin();

        if (data.isSelected){
            this.renderTasks();
        }
        return this;
    },

    hubDetailsHTML: function(){
        var data = this.model.toJSON();

        data.description = "{description}";
        data.estimate = this.model.humanEstimate() || app.lang.HUB_NO_TASKS;
        data.hubId = this.model.id;

        return tim("hub-detail", data)
          .replace("{description}", nl2br(this.model.escape("description")));
    },
    
    displayDetails: function(){
        app.lightbox
            .content(this.hubDetailsHTML())
            .show();
            
        return this;
    },
    
    
    /////
    
    // FORCE-DIRECTION PHYSICS
    // TODO: totally refactor these, and related methods in controllers.js
    
    removeForceDirectorNode: function(key){
        if (this.forceDirector){
            this.forceDirector.nodes = _.reject(this.forceDirector.nodes, function(node){
                return node.key === key;
            });
        }
        return this;
    },
    
    removeForceDirectedTaskNodes: function(){
        if (this.forceDirector){
            this.forceDirector.nodes = _.reject(this.forceDirector.nodes, function(node){
                return node.key.indexOf("task-") === 0;
            });
        }
        return this;
    },
    
    repositionTasks: function(){
        var hubView = this,
            taskViews = this.taskViews;
    
        if (taskViews){
            taskViews.each(function(taskView){
                var taskPos = taskView.forcedNode.getPos(),
                    taskElem = taskView.elem;

                // repaint
                taskView.cacheDimensions();
                hubView.setTaskViewOffsetFromForcedNode(taskView);
            });
            
            this.clearCanvas()
                .drawLines();
        }
        
        return this.trigger("change:position:tasks");
    },

    updateForceDirectedDimensions: function(){
        var hubNodeForTasks = this.forcedNode,
            hubNodeForOtherHubs, taskBuffer, pos;
    
        if (hubNodeForTasks){
            this.cacheDimensions();
            
            hubNodeForOtherHubs = this.forcedNodeHubToHub;
            taskBuffer = app.taskBuffer;
            /*
            hubBuffer = app.hubBuffer;
            bufferDiff = taskBuffer * 2 - hubBuffer * 2;
            */
            pos = hubNodeForOtherHubs.getPos();
            hubNodeForTasks.setWidth(hubNodeForOtherHubs.width + taskBuffer * 2);
            hubNodeForTasks.setHeight(hubNodeForOtherHubs.height + taskBuffer * 2);
            hubNodeForTasks.setPos(pos.x, pos.y);
        }

        return this;
    },

    // TODO: addTask needed
    // appendTaskView to the DOM. It will be later removed when the hubView is de-selected
    appendTaskView: function(taskView){
        var taskBuffer = app.taskBuffer,
            model = taskView.model,
            taskElem = taskView.elem,
            hubNode = this.forcedNode,
            taskBuffer = app.taskBuffer,
            hubViewOffset, oppositeCorner;
            
        taskView.render();
        taskElem.appendTo(this.taskListElem);

        // Set up force-direction on this taskView, if not yet done
        if (!taskView.forcedNode){
            hubViewOffset = this.offset();
            taskView.cacheDimensions();
            // Set far away from the hub, to distribute tasks better
            // TODO: radiate around the hub, to achieve better spread
            oppositeCorner = {
                left: (hubViewOffset.left < app.tank.width / 2 ? app.tank.wallRight : app.tank.wallLeft),
                top:  (hubViewOffset.top < app.tank.height / 2 ? app.tank.wallTop   : app.tank.wallBottom)
            };
            
            taskView.forcedNode = this.forceDirector.createSatellite({
                key: "task-" + model.id,
                width: taskView.width + taskBuffer * 2,
                height: taskView.height + taskBuffer * 2,
                x: oppositeCorner.left + Math.random(), // random seed for dispersing tasks in forceDirector
                y: app.invertY(oppositeCorner.top + Math.random())
            }, "hub-" + this.model.id);
        }
        return this;
    },
    
    setTaskViewOffsetFromForcedNode: function(taskView){
        var node = taskView.forcedNode,
            pos = node.getPos(),
            hubViewOffset = this.offset(),
            taskBuffer = app.taskBuffer;
            
        taskView.offset({
            left: ~~(pos.x - hubViewOffset.left - node.width / 2), // NOTE: ~~n === Math.floor(n)
            top: app.invertY(~~pos.y + hubViewOffset.top + this.nucleusWidth / 2)
        });
        
        return this;
    },

    forcedirectTasks: function(){
        if (this.taskViews){
            this.updateForceDirectedDimensions();
            this.forceDirector.go();
            this.cacheTaskViewCenterBounds();
        }
        return this;
    }
    
}, {
    /* Global keeping check of the current z-index */
    zIndex: 0,
    hubIdInUrlRegex: /\/(\d+)\/$/
});
