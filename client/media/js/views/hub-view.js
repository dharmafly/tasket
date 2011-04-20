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
        "click hgroup": "updateLocation",
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

        _.bindAll(this,
          "refreshTasks", "updateImage", "updateTitle",
          "updateDescription", "updateEstimate", "updateAdminActions"
        );

        this.model.bind("change:title", this.updateTitle);
        this.model.bind("change:description", this.updateDescription);
        this.model.bind("change:image", this.updateImage);
        
        /* hasChanged() function is in core/core.js */
        this.model.bind("change", hasChanged([
          "estimates.new", "estimates.claimed", "estimates.done", "estimates.verified"
        ], this.updateEstimate));
        this.model.bind("change", hasChanged([
          "tasks.new", "tasks.claimed", "tasks.done", "tasks.verified"
        ], this.refreshTasks));

        app.bind("change:currentUser", this.updateAdminActions);
    },

    updateTitle: function () {
        this.$("h1").html(this.model.escape("title"));
        this._updateMargin();
        return this;
    },

    updateDescription: function () {
      var description = this.$("hgroup h2"),
          text = this.model.get("description");

      if (!description[0].hasAttribute("data-truncated")) {
          text = app.truncate(text, app.hubDescriptionTruncate);
      }

      description.html(nl2br(escapeHTML(text)));
      this._updateMargin();
    },

    updateImage: function () {
        this.$("img.nucleus").attr("src", this.imageSrc());
        return this;
    },

    updateEstimate: function () {
        this.$("hgroup h1 span").text("(" + (this.model.humanEstimate() || app.lang.HUB_NO_TASKS) + ")");
        return this;
    },

    updateAdminActions: function () {
        var controls = this.$("hgroup"),
            actions  = controls.find(".admin-actions"),
            canEdit  = app.isCurrentUser(this.model.get("owner"));

        if (canEdit && !actions.length) {
            controls.prepend(tim("hub-admin-actions", {id: this.model.id}));
        }
        else if (canEdit && actions.length) {
            actions.remove();
        }

        this._updateMargin();
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
        return src ?
            Tasket.thumbnail(src, app.hubImageWidth, app.hubImageHeight, true) :
            Tasket.media(app.hubPlaceholderImage);
    },

    isSelected: function(){
        return this.get("selected");
    },

    tasksVisible: function(){
        return this.get("tasksVisible");
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

    refreshTasks: function () {
        var hubView = this;

        function redisplay(){
            if (hubView.tasksVisible()) {
                // Let the force director be re-initialised
                if (hubView.forceDirector){
                    hubView.forceDirector.initialized = false;
                }

                hubView
                    .generateTaskViews()
                    .clearTasks({silent:true})
                    .renderTasks();
            }
        }

        this.tasks = Tasket.getTasks(this.getDisplayTasks());

        if (this.tasks.isComplete()){
            redisplay();
        }

        this.tasks.bind("refresh", redisplay);
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
                    taskElem = taskView.elem;

                // repaint
                taskView
                    .cacheDimensions()
                    .offset({
                        left: ~~(taskPos.x - taskView.width / 2 - hubViewOffset.left + (hubView.width / 2)),
                        top:  ~~(app.invertY(taskPos.y + hubViewOffset.top - (hubView.height / 2) + taskView.height / 2))
                    });
            });
        }

        forceDirector.engine.reset();

        // Add hub node
        this.forcedNode = this.forceDirector.engine.addProject({
            key: "hub-" + this.model.id
        });

        if (callback){
            overallCallback = function(){
                repositionTasks();
                callback.call(hubView);
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
            animate: animate,
            animator: repositionTasks,
            callback: overallCallback
        });

        // Show walls
        //jQuery("<div style='position:absolute; outline:1px solid green; width:" + (tank.wallRight-tank.wallLeft) + "px; top:" + app.invertY(tank.wallTop) + "px; height: " + (tank.wallTop - tank.wallBottom) + "px; left:" + tank.wallLeft + "px; pointer-events:none;'></div>").prependTo("body");

        forceDirector.initialized = true;

        return this;
    },

    updateForceDirectedDimensions: function(){
        var taskBuffer = app.taskBuffer,
            hubViewOffset = this.offset();

        this.cacheDimensions();

        this.forcedNode.setWidth(this.width + taskBuffer);
        this.forcedNode.setHeight(this.height + taskBuffer);
        this.forcedNode.setPos(
            hubViewOffset.left - (this.nucleusWidth / 2) - (taskBuffer / 2),
            app.invertY(hubViewOffset.top - (this.nucleusWidth / 2) - (taskBuffer / 2))
        );

        return this;
    },

    // For dev purposes - visualise a node from the force director
    /*
    devShowNode: function(forcedNode){
        forcedNode = forcedNode || this.forcedNode;

        jQuery("<div style='background:rgba(255,0,0,0.5); position:absolute;'></div>")
            .appendTo("body")
            .width(forcedNode.width)
            .height(forcedNode.height)
            .css({
                left:forcedNode.getPos().x + "px",
                top:app.invertY(forcedNode.getPos().y) + "px"
            });
    },
    */

    forcedirectTasks: function(){
        if (this.taskViews){
            this.updateForceDirectedDimensions();
            this.forceDirector.go();
            this.cacheTaskViewCenterBounds();

            // DEV: Show node
            //this.devShowNode();
        }
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

            // TODO: try setting far away from the nucleus, distributed equally around the circle
            taskView.forcedNode = this.forceDirector.engine.addTaskToProject({
                key: "task-" + model.id,
                width: taskView.width + taskBuffer,
                height: taskView.height + taskBuffer,
                x: hubViewOffset.left + taskBuffer / 2 + Math.random() - 0.5, // random seed for dispersing tasks in forceDirector
                y: app.invertY(hubViewOffset.top + taskBuffer / 2 + Math.random() - 0.5)
            }, "hub-" + this.model.id);
            //taskView.forcedNode.addTether(this.forcedNode.getPos().x, this.forcedNode.getPos().y);
        }
        return this;
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
        }

        this.appendCanvas()
            .resizeCanvas();

        taskViews.each(function(taskView){
            var offset = taskView.offset();
            hubView.line(offset.left + taskView.width / 2, offset.top + taskView.height / 2);
        });

        return this;
    },

    render: function(){
        var data = this.model.toJSON();

        data.estimate   = this.model.humanEstimate() || app.lang.HUB_NO_TASKS;
        data.isSelected = this.isSelected();
        data.truncatedDescription = app.truncate(data.description, app.hubDescriptionTruncate);
        data.image = this.imageSrc();

        this.elem.html(tim("hub", data));
        this.nucleusElem = this.elem.children("a.nucleus-wrapper");
        this.tasksElem = this.$("div.tasks");
        this.taskListElem = this.tasksElem.children("ul");
        this.labelElem = this.$("hgroup");

        this.offsetApply();
        this.cacheDimensions();
        this.updateAdminActions();
        this._updateMargin();

        // Update the title to ensure that linebreaks are converted into <br>
        // tags. We do this manually rather than in tim() because of issues
        // with form elements and a lack of granularity when using filters in
        // tim().
        this.updateTitle();

        if (data.isSelected){
            this.renderTasks();
        }
        return this;
    },

    toggleDescription: function () {
        var description = this.$("hgroup h2"),
            method = "removeAttribute";

        if (!description[0].hasAttribute("data-truncated")) {
            method = "setAttribute";
        }

        description[0][method]("data-truncated");
        this.updateDescription();
    }

}, {
    /* Global keeping check of the current z-index */
    zIndex: 0,
    hubIdInUrlRegex: /\/(\d+)\/$/
});
