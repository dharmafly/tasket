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
        "click h2": "toggleDescription"
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
            inVelDampK: 0.1
        });

        _.bindAll(this, "updateImage", "updateTitle");
        this.model.bind("change:title", this.updateTitle);
        this.model.bind("change:description", this.updateTitle);
        this.model.bind("change:image", this.updateImage);
        this.model.bind("change:tasks", function () { // TODO: expand this to sub-properties of `tasks`
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
        this.$("img.nucleus").attr("src", this.imageSrc());
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

        this.sendToFront();

        if (isSelected){
            this.toggleTasks();
        }
        else {
            this.updateLocation();
            // this changes the location hash, which causes the controller to trigger the route "displayHub"
        }
        event.preventDefault();
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
        app.bodyElem.addClass("hubSelected");
        return this;
    },

    deselect: function(){
        this.set("selected", false);
        this.trigger("deselect", this);
        this.elem.removeClass("select");
        app.bodyElem.removeClass("hubSelected");
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
        })/*.bind("stateChange", function(model, newState){
            if (!model.isOpen()){
                hubView.refreshTasks();
            }
        })*/;

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
            bounds = this.canvasBounds,
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

    clearTasks: function(){
        this.taskListElem.empty();
        return this.clearCanvas()
            .removeCanvas()
            .set("tasksVisible", false);
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
            var hubViewOffset = hubView.offset(),
                taskWidth = hubView.taskWidth,
                taskHeight = hubView.taskHeight;

            taskViews.each(function(taskView){
                var taskPos = taskView.forcedNode.getPos(),
                    taskElem = taskView.elem;

                if (!taskWidth || !taskHeight){
                    taskWidth = hubView.taskWidth = taskElem.outerWidth();
                    taskHeight = hubView.taskHeight = taskElem.outerHeight();
                }

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
        var taskBuffer = app.taskBuffer,
            model = taskView.model,
            taskElem = taskView.elem,
            hubViewOffset;

        taskView.render();
        taskElem.appendTo(this.taskListElem);

        // Set up force-direction on this taskView, if not yet done
        if (!taskView.forcedNode){
            hubViewOffset = this.offset();
            taskView.cacheDimensions();

            // TODO: set f.TASK_WIDTH, etc.
            // TODO: try setting far away from the nucleus, distributed equally around the circle
            taskView.forcedNode = this.forceDirector.engine.addTaskToProject({
                key: "task-" + model.id,
                width: taskView.width + taskBuffer,
                height: taskView.height + taskBuffer,
                x: hubViewOffset.left + taskBuffer / 2 + Math.random() - 0.5, // random seed for dispersing tasks in forceDirector
                y: app.invertY(hubViewOffset.top + taskBuffer / 2 + Math.random() - 0.5)
            }, "hub-" + this.model.id);
        }
        return this;
    },

    forcedirectTasks: function(animate, callback){
        this.updateForceDirectedDimensions();
        this.forceDirector.go();
        return this;
    },

    renderTasks: function(){
        var hubView = this,
            taskViews = this.taskViews,
            forceDirectionNeeded, lineWidth, canvasBounds;

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
        taskViews.each(function(taskView){
            hubView.appendTaskView(taskView);
        });

        if (forceDirectionNeeded){
            this.forcedirectTasks();
            lineWidth = this.get("lineWidth");
            this.canvasBounds = canvasBounds = {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0
            };

            taskViews.each(function(taskView){
                var centerY = taskView.offset().top + taskView.height / 2,
                    centerX = taskView.offset().left + taskView.width / 2;

                if (centerY < canvasBounds.top){
                    canvasBounds.top = centerY;
                }
                if (centerY > canvasBounds.bottom){
                    canvasBounds.bottom = centerY;
                }
                if (centerX < canvasBounds.left){
                    canvasBounds.left = centerX;
                }
                if (centerX > canvasBounds.right){
                    canvasBounds.right = centerX;
                }
            });
        }

        this.appendCanvas()
            .resizeCanvas();

        taskViews.each(function(taskView){
            var offset = taskView.offset();

            hubView.line(offset.left + taskView.width / 2, offset.top + taskView.height / 2);
        });

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
        data.truncatedDescription = truncate(data.description, app.hubDescriptionTruncate);
        data.image = this.imageSrc();
        data.canEdit = app.isCurrentUser(data.owner);

        this.elem.html(tim("hub", data));
        this.nucleusElem = this.elem.children("a.nucleus-wrapper");
        this.tasksElem = this.$("div.tasks");
        this.taskListElem = this.tasksElem.children("ul");
        this.labelElem = this.$("hgroup");

        this.offsetApply();
        this.updateCachedDimensions();
        this._updateMargin();

        if (data.isSelected){
            this.renderTasks();
        }
        return this;
    },

    toggleDescription: function () {
        var description = this.$("hgroup h2"),
            method = "removeAttribute",
            text = this.model.get("description");

        if (!description[0].hasAttribute("data-truncated")) {
            text = truncate(text, app.hubDescriptionTruncate);
            method = "setAttribute";
        }
        
        description[0][method]("data-truncated");
        description.html(escapeHTML(text));
    },
}, {
    /* Global keeping check of the current z-index */
    zIndex: 0
});
