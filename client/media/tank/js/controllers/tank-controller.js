var TankController = Controller.extend({
    routes: {
        "/hubs/new/": "newHub",
        "/hubs/archived/": "listArchivedHubs",
        "/hubs/:id/": "displayHub",
        "/hubs/:id/edit/": "editHub",
        "/hubs/:id/tasks/new/": "newTask",
        "/hubs/:hub_id/tasks/:id/edit/": "editTask",
        "/hubs/:hub_id/tasks/:id/": "displayTaskDetails",
        "/hubs/:hub_id/detail/" : "displayHubDetails"
    },

    constructor: function TankController() {
        Controller.apply(this, arguments);
    },

    initialize: function(options){
        var tank = this;
        this.hubViews = {};

        _.bindAll(this, "_onSelectHubs", "_onDeselectHubs", "repositionHubs");

        this.scrollbarWidth = this.getScrollbarWidth();
        this.svg = this.createSVGRoot(jQuery("#vector")[0]);

        // Force director
        this.forceDirector = ForceDirector.create({
            animate: app.animateHubs
        });

        this.forceDirector
            .bind("loop", this.repositionHubs)
            .bind("end", this.repositionHubs)
            // TODO: tasks views don't position correctly on re-paint
            .bind("end", function(){
                // Redraw taskviews
                if (app.selectedHubView && app.selectedHubView.taskViews){
                    app.selectedHubView.redrawTasks();
                }
            });

        this.bind("change:walls", function(tank, dimensions){
            var currentWalls = this.forceDirector.getWalls();

            if (!_.isEqual(currentWalls, dimensions)){
                this.updateSVGDimensions();
                this.forceDirector.setWalls(dimensions);
                this.calculateHubWeights();
            }
        });

        this.bind("resize", function(){
            this.updateWalls()
                .repositionHubViews();
        });

        jQuery(window).bind("resize", _.debounce(function(){
            tank.trigger("resize", tank);
        }, app.tankResizeThrottle));

        Tasket.hubs
            // Watch for new hubs and add them to the tank.
            .bind("add", _.bind(function(hub){
                // If the hub isn't yet shown in the tank, and it still has unverified tasks
                if (!this.getHubView(hub.id) && hub.isOpen()){
                    this.addHub(hub);
                }
            }, this))
            // Remove tasks from global collection when hubs are removed
            .bind("remove", _.bind(function(hub){
                hub.forEachTask(function(taskId){
                    Tasket.tasks.remove(taskId);
                });
            }, this));

/*
        Tasket.tasks
            // When a task is removed from the global collection, clean up by removing task from its hub model, and the associated users.
            // TODO: this should be distributed into the user/hub models
            .bind("remove", _.bind(function(task){
                var users = Tasket.users,
                    hub = Tasket.hubs.get(task.get("hub")),
                    owner = users.get(task.get("owner")),
                    claimedBy = users.get(task.get("claimedBy")),
                    doneBy = users.get(task.get("doneBy")),
                    verifiedBy = users.get(task.get("verifiedBy"));

                if (hub){
                    hub.removeTask(task); // NOTE: currently this causes the hub total estimate to be adjusted twice when removing a task
                }

                if (owner){
                    owner.removeTask(task);
                }

                if (claimedBy){
                    claimedBy.removeTask(task);
                }

                if (doneBy){
                    doneBy.removeTask(task);
                }

                if (verifiedBy){
                    verifiedBy.removeTask(task);
                }
            }, this));
   */

        (function () {
            $('body').width(1500).height(1000);
        }).call(this);

        this.updateWalls();
        this.centerTank();

        // Add hubs
        if (options && options.hubs){
            this.addHubs(options.hubs);
        }
    },

    error: function (message) {
        app.notification.error(
            message || "You do not have permission to access this."
        );
        app.back();

        return this;
    },

    getHubView: function(id){
        id = String(id); // allow argument to be a String or a Number

        return _(this.hubViews).detect(function(hubView){
            return id === hubView.model.id;
        });
    },

    /*
    getTaskView: function(id){
        id = String(id); // allow argument to be a String or a Number

        var task = Tasket.getTasks(id),
            hubId = task && task.get("hub"),
            hubView = hubId && this.getHubView(hubId);

        return hubView && hubView.taskViews && hubView.taskViews.detect(function(taskView){
            return taskView.model.id === id;
        });
    },
    */

    // When a hubView is selected, then deselect all the other hubviews
    _onSelectHubs: function(selectedHubView){
        _(this.hubViews)
            .chain()
            .reject(function(hubView){
                return hubView.model.id === selectedHubView.model.id;
            })
            .invoke("deselect");

        return this.trigger("hub:select", selectedHubView, this);
    },

    _onDeselectHubs: function(hubView){
        return this.trigger("hub:deselect", hubView, this);
    },

    drawHubView: function(hubView, options){
        var offset;

        options = options || {};

        if (_.isNumber(options.left) && _.isNumber(options.top)){
            offset = {
                left: options.left,
                top: options.top
            };
        }
        else {
            offset = this.hubViewOffset(hubView);
        }

        hubView.offsetValues(offset);
        app.bodyElem.append(hubView.elem);
        hubView.render();

        // Add the hub to the forcedirector engine (not a task, even though the method is `addTask`)
        hubView.forcedNodeHubToHub = this.forceDirector.createNode({
            key: "hub-" + hubView.model.id,
            x: offset.left - hubView.nucleusWidth * 1.5,
            y: app.invertY(offset.top),
            width: hubView.width + app.hubBuffer * 2,
            height: hubView.height + app.hubBuffer * 2,
            title: hubView.model.get("title")
        });

        return this;
    },

    addHubs: function(hubs, options){
        var tank = this,
            hubViewOptions;

        _(hubs).each(function(hub){
            if (!hub.get("archived.timestamp")) { //TODO: remove when archived projects aren't passed through default API /hubs/ call
                this.addHub(hub, {dontDraw:true});
            }
        }, this);

        if (!options || !options.dontDraw){
            this.calculateHubWeights();

            _.each(this.hubViews, function(hubView){
                tank.drawHubView(hubView);
            });
            this.forcedirectHubs();
        }

        return this;
    },

    addHub: function(hub, options){
        var hubView = this.getHubView(hub.id),
            offset;

        if (hubView) {
            return hubView;
        }

        options = options || {};

        hubView = this.hubViews[hub.cid] = new HubView({
            model: hub
        });

        hubView
            .bind("select", this._onSelectHubs)
            .bind("deselect", this._onDeselectHubs)
            .bind("change:position:tasks", _.bind(function(hubView){
                this.trigger("change:position:tasks", this, hubView);
            }, this));

        if (!options.dontDraw){
            this.calculateHubWeights()
                .drawHubView(hubView)
                .forcedirectHubs();
        }
        this.trigger("add:hub", this, hub, hubView);

        return hubView;
    },

    // Remove a hub from the tank.
    removeHubView: function (hub) {
        var hubView = this.getHubView(hub.id);

        if (hubView) {
            delete this.hubViews[hub.cid];
            hubView.deselect().remove();

            this.removeForceDirectorNode("hub-" + hub.id)
                .calculateHubWeights()
                .forcedirectHubs();
        }

        return this;
    },

    displayHub: function(hubId){
        var controller = this,
            hubView = this.getHubView(hubId);

        if (hubView){
            hubView.sendToFront().showTasks();
        }

        return this;
    },

    newHub: function(){
        var hub;

        if (!this._isLoggedIn("You must be logged in to create a " + app.lang.HUB)) {
            return;
        }

        hub = new Hub({
            owner: app.currentUser.id
        });

        this._createHubForm(hub)
            .bind("success", _.bind(function (hub) {
                // Add hubs to global cache.
                Tasket.hubs.add(hub);

                // Add hub and select it for viewing
                this.addHub(hub).select();
            }, this));

        return this;
    },

    listArchivedHubs: function() {
        var form = new ArchiveForm();

        // open view in lightbox
        function renderArchivedHubs(hubs){
            var archivedHubData = [],
                hubsLength = hubs.models.length;

            _.each(hubs.models, function(hub){
                var taskCount = hub.countTasks(),
                    completedTaskCount = hub.countCompletedTasks(),
                    date = timestampToRelativeDate(hub.get("archived.timestamp")),
                    hasDate = !!date;

                archivedHubData.push({
                    id: hub.id,
                    title: hub.get("title"),
                    hasDate: hasDate,
                    date: date,
                    taskCount: taskCount +
                        " task" + ((taskCount !== 1) ? "s" : "") +
                        " (" + completedTaskCount + " completed)"
                });
            });

            app.lightbox.content(form.render(archivedHubData).el, "archived-hubs").show();

            // When user clicks on "Restore" to un-archive a hub
            form.bind("restoreHub", _.bind(function (hubId) {
                var hub = Tasket.getHubs(hubId);

                if (!hub){
                    this.error("Sorry. There was a problem editing the " + app.lang.HUB + ". Please refresh the page and try again. (error: hub-" + hubId + " not found)");
                    return;
                }
                hub.unarchive();
                this.addHub(hub).select();
                // TODO: re-render dashboard list of projects

                hubsLength --;

                if (!hubsLength){
                    app.lightbox.hide();
                }
            }, this));
        }

        Tasket.getArchivedHubs(_.bind(renderArchivedHubs, this));
        return form;
    },

    editHub: function (hubId) {
        var hub = Tasket.getHubs(hubId),
            hubView;

        if (!hub){
            this.error("Sorry. There was a problem editing the " + app.lang.HUB + ". Please refresh the page and try again. (error: hub-" + hubId + " not found)");
            return;
        }

        if (!this._isLoggedIn("You must be logged in to edit this.")) {
            return;
        }
        if (!this._hasAdminRights(hub.get("owner"), "You cannot edit this, because you do not own it and you are not an admin.")) {
            return;
        }

        this._createHubForm(hub)
            .bind("success", _.bind(function (hub) {
                hubView = this.getHubView(hubId);
                if (hubView){
                    hubView.render();
                }
            }, this));

        return this.displayHub(hubId);
    },

    _isLoggedIn: function (message) {
        if (!app.currentUser) {
            this.error(message || "You must be logged in");
        }
        return !!app.currentUser;
    },

    _hasAdminRights: function (id, message) {
        var hasRights = app.isCurrentUser(id) || app.currentUserIsAdmin();
        if (!hasRights) {
            this.error(message || "Sorry, you do not have permission to do that.");
        }
        return hasRights;
    },

    _createHubForm: function (hub) {
        var form = new HubForm({
            model: hub
        });

        app.lightbox.content(form.render().el, "create-hub-form").show();

        // Append our iFrame element for upload.
        form.updateFrame();

        form.bind("success", function (hub) {
                app.lightbox.hide();
                HubView.prototype.updateLocation.call({model:hub});
            })
            .bind("archive", _.bind(function (hub) {
                this.removeHubView(hub);
                app.lightbox.hide();
                window.location.hash = "/";
            }, this))
            .bind("delete", _.bind(function (hub) {
                this.removeHubView(hub);
                Tasket.hubs.remove(hub);
                app.lightbox.hide();
                window.location.hash = "/";
            }, this))
            .bind("error", _.bind(function(hub, form, status){
                this.error("Sorry, there was an error creating the " + app.lang.HUB + ". Please try logging out and in again. (error: hub-" + hub.id + ", status " + status + ")");
            }, this));

        return form;
    },

    // TODO: this should work even when the task view isn't yet available - i.e. via an async request to API
    // TODO: lightbox should close if a link from within the task description is clicked
    displayHubDetails: function(hubId){
        var hubView = this.getHubView(hubId);

        if (hubView){
            hubView.select().displayDetails();
        }

        return this;
    },

    // TODO: this should work even when the task view isn't yet available - i.e. via an async request to API
    // TODO: lightbox should close if a link from within the task description is clicked
    displayTaskDetails: function(hubId, taskId){
        taskId = String(taskId); // allow argument to be a String or a Number

        var hubView = this.getHubView(hubId),
            taskView = hubView && hubView.taskViews && hubView.taskViews.detect(function(taskView){
                return taskView.model.id === taskId;
            });

        if (taskView){
            this.displayHub(hubId);
            taskView.displayDetails();
        }
        else if (hubView){
            hubView.updateLocation();
        }

        return this;
    },

    newTask: function(hubId){
        var hub = Tasket.getHubs(hubId),
            form;

        if (!hub){
            this.error("Sorry. There was a problem creating the task. Please refresh the page and try again. (error: hub-" + hubId + " not found)");
            return;
        }

        if (!this._isLoggedIn("You must be logged in to create a task.")) {
            return;
        }

        if (!this._hasAdminRights(hub.get("owner"), "You cannot create a task here on this " + app.lang.HUB + ", because you do not own it and you are not an admin.")) {
            return;
        }

        if (!hub.canAddTask()) {
            this.error("A " + app.lang.HUB + " can only have a maximum of " + Tasket.settings.TASK_LIMIT + " incomplete tasks");
            return;
        }

        return this.displayHub(hubId)
            ._createTaskForm(hub, new Task({
                hub: hubId, // NOTE: Verify this when refactoring hubs.
                owner: app.currentUser.id,
                estimate: Task.ESTIMATES[0].value
            }));
    },

    editTask: function (hubId, taskId) {
        var hub  = Tasket.getHubs(hubId),
            task = Tasket.getTasks(taskId);

        if (_.indexOf(hub.getTasks(), taskId) < 0) {
            this.error("That task does not exist on this " + app.lang.HUB + ".");
            app.lightbox.hide();
            return;
        }

        if (!this._isLoggedIn("You must be logged in to create a task.")) {
            app.lightbox.hide();
            return;
        }

        if (!this._hasAdminRights(hub.get("owner"), "You do not own this " + app.lang.HUB + ".")) {
            app.lightbox.hide();
            return;
        }

        return this._createTaskForm(hub, task);
    },

    _createTaskForm: function (hub, task) {
        var form = new TaskForm({model: task}),
            tank = this;

        app.lightbox.content(form.render().el, "create-task-form").show();
        form.bind("success", _.bind(function (event) {
                var hubView = tank.getHubView(hub.id),
                    userTasks;

                app.lightbox.hide({silent: true});

                // Add task to Tasket.tasks collection if not already in there.
                if (!Tasket.tasks.get(task.id)) {
                    Tasket.tasks.add(task);
                    hub.addTask(task);
                }

                // Add to current users tasks if not already in there.
                if (
                  task.get('state') === Task.states.NEW &&
                  task.get('owner') === app.currentUser.id
                ) {
                    userTasks = _.clone(app.currentUser.get('tasks.owned.new'));
                    userTasks.push(task.id);
                    app.currentUser.set({
                      'tasks.owned.new': userTasks
                    });
                }

                tank.repositionHubViews();

                // Go to the hub's URL
                hubView.updateLocation();
            }, this))
            .bind("delete", _.bind(function (model) { // TODO create removeTask method
                var hubView = this.getHubView(hub.id);
                if (hubView) {
                    hubView.model.removeTask(task);
                }
                app.currentUser.removeTask(model);
                Tasket.tasks.remove(model);
                app.lightbox.hide();
            }, this))
            .bind("error", _.bind(function(task, form, status){
                this.error("Sorry, there was an error creating the task. Please try logging out and in again. (error: task-" + task.id + ", status " + status + ")");
            }));

        return this;
    },


    /////

    // FORCE-DIRECTION PHYSICS
    // TODO: totally refactor these, and related methods in hub-view.js

    removeForceDirectorNode: function(key){
        if (this.forceDirector){
            this.forceDirector.nodes = _.reject(this.forceDirector.nodes, function(node){
                return node.key === key;
            });
        }
        return this;
    },

    getHubWeights: function(){
        return _.map(this.hubViews, function(hubView){
            return hubView.model.weight();
        });
    },

    calculateHubWeights: function(){
        var hubWeights = this.hubWeights = this.getHubWeights(),
            totalHubViews;

        this.hubWeightMin = Math.min.apply(Math, hubWeights);
        this.hubWeightMax = Math.max.apply(Math, hubWeights);
        this.hubWeightRange = this.hubWeightMax - this.hubWeightMin;
        this.hubViewOrderX = this.hubsAlphabetical();
        this.hubViewOrderXSlice = this.width / this.hubViewOrderX.length;

        return this;
    },

    hubViewOffsetTop: function(hubView){
        if (_.isUndefined(this.hubWeights)){
            throw "tank.hubViewOffsetTop: Must call tank.calculateHubWeights() first";
        }

        var weight = hubView.model.weight(),
            weightRatioOfFullRange = (weight - this.hubWeightMin) / (this.hubWeightRange || 0.5); // 0.5 is to supply a number for when there is no difference at all

        return weightRatioOfFullRange * (this.height - this.marginTop - 90) + this.marginTop + 90; // 90 is expected hubView height
    },

    hubViewOffsetLeft: function(hubView){
        return this.hubViewOrderX.length < 2 ?
            this.wallLeft + this.width / 2 :
            this.wallLeft + this.hubViewOrderXSlice / 2 + (this.hubViewOrderXSlice * _.indexOf(this.hubViewOrderX, hubView.model.id)) + Math.random(); // random seed
    },

    hubsAlphabetical: function(){
        return _(this.hubViews).chain()
            .sortBy(function(hubView){
                return hubView.model.get("title") || hubView.model.get("description");
            })
            .map(function(hubView){
                return hubView.model.id;
            })
            .value();
    },

    hubViewOffset: function(hubView){
        return {
            left: this.hubViewOffsetLeft(hubView),
            top:  this.hubViewOffsetTop(hubView)
        };
    },

    setHubViewOffsetFromForcedNode: function(hubView){
        var node = hubView.forcedNodeHubToHub,
            pos = node.getPos();

        hubView.offset({
            left: ~~(pos.x - node.width / 2 + hubView.nucleusWidth / 2), // NOTE: ~~n === Math.floor(n)
            top: app.invertY(~~pos.y)
        });
    },

    repositionHubViews: function(){
        var tank = this;

        _(this.hubViews).each(function(hubView){
            var offsetTop = tank.hubViewOffsetTop(hubView),
                forcedNode = hubView.forcedNodeHubToHub;

            // Set position of force-directed representation, with respect to other hubs
            forcedNode.setPos(
                forcedNode.getPos().x,
                app.invertY(offsetTop)
            );

            // Set position of DOM element
            tank.setHubViewOffsetFromForcedNode(hubView);

            // Set position of force-directed representation, with respect to tasks - TODO: combine these
            hubView.updateForceDirectedDimensions();
        });

        return this.forcedirectHubs();
            //.forcedirectTasks(); // TODO: not currently working (canvas lines move out of sync)
    },

    repositionHubs: function(){
        _.each(this.hubViews, this.setHubViewOffsetFromForcedNode);
        return this.trigger("change:position:hubs");
    },

    forcedirectHubs: function(){
        this.forceDirector.go();
        return this;
    },

    forcedirectTasks: function(){
        _.each(this.hubViews, function(hubView){
            if (hubView.taskViews){
                hubView.refreshTasks();
            }
        });
        return this;
    },

    forcedirectAll: function(){
        return this
            .forcedirectHubs()
            .forcedirectTasks();
    },

    updateViewport: function () {
        var $window = $(window);

        this.viewportWidth  = $window.width()  - this.scrollbarWidth;
        this.viewportHeight = $window.height() - this.scrollbarWidth;

        if (this.viewportWidth < 0){
            this.viewportWidth = 0;
        }

        if (this.viewportHeight < 0){
            this.viewportHeight = 0;
        }
    },

    updateTank: function () {
        // Work out how big we want the tank and set the dimensions.
        var width  = this.viewportWidth,
            height = this.viewportHeight,
            factor = Tasket.hubs.length / 5;

        // If more that five hubs update the size of the screen. This is
        // very clunky but works for the moment.
        if (factor > 1) {
            width  *= factor;
            height *= factor;
            $('body').width(width).height(height);
        }

        this.tankWidth  = width;
        this.tankHeight = height;
    },

    centerTank: function () {
        var centerX = (this.tankWidth  - this.viewportWidth)  / 2,
            centerY = (this.tankHeight - this.viewportHeight) / 2;

        this.positionViewport(centerX, centerY);
    },

    positionViewport: function (x, y) {
        window.scrollTo(x || 0, y || 0);
    },

    // Get the dimensions of the tank
    updateWalls: function(){
        var toolbarHeight = app.toolbar.elem.outerHeight(true),
            wallBuffer = app.wallBuffer,
            dimensions;

        this.updateViewport();
        this.updateTank();

        this.wallBuffer = wallBuffer;

        // NOTE: this is zero-bottom y
        this.wallTop    = this.tankHeight - wallBuffer - toolbarHeight;
        this.wallLeft   = wallBuffer;
        this.wallRight  = this.tankWidth - app.dashboard.elem.outerWidth() - wallBuffer;
        this.wallBottom = wallBuffer;

        this.width     = this.wallRight  - this.wallLeft;
        this.height    = this.wallTop    - this.wallBottom;
        this.marginTop = this.tankHeight - this.wallTop;

        dimensions = {
            top: this.wallTop,
            left: this.wallLeft,
            right: this.wallRight,
            bottom: this.wallBottom
        };

        return this.trigger("change:walls", this, dimensions);
    },

    // Modified from http://fleegix.org/articles/2006-05-30-getting-the-scrollbar-width-in-pixels
    getScrollbarWidth: function(){
        var // Outer scrolling div
            outer = jQuery("<div/>").css({
                position: "absolute",
                top: "-1000px",
                left: "-1000px",
                width: "100px",
                height: "50px",
                overflow: "hidden"
            }).appendTo("body"),

            // Inner content div
            inner = jQuery("<div/>").css({
                width: "100%",
                height: "200px"
            }).appendTo(outer),

            // Width of the inner div without scrollbar
            width1 = inner[0].offsetWidth,
            width2;

        // Width of the inner div with scrollbar
        outer.css({overflow: "auto"});
        width2 = inner[0].offsetWidth;

        // Remove the scrolling div from the doc
        outer.remove();

        // Pixel width of the scroller
        return width1 - width2;
    },

    clearSVG: function(){
        return this.emptyElement(this.svg);
    },

    createSVGElement: function(nodeName){
        return document.createElementNS("http://www.w3.org/2000/svg", nodeName);
    },

    // NOTE: Creating the <svg> element this way allows it to render on iPad et al, whereas including the <svg> element directly in the HTML document does not. Inspired by http://keith-wood.name/svg.html
    createSVGRoot: function(container){
        var svg = this.createSVGElement("svg");
	    svg.setAttribute("version", "1.1");

	    container.appendChild(svg);
	    return svg;
    },

    updateSVGDimensions: function(){
        this.svg.setAttribute("width", this.tankWidth);
        this.svg.setAttribute("height", this.tankHeight);
        return this;
    },

    addSVGLine: function(x1, x2, y1, y2){
        var line = this.svg && this.createSVGElement("line");

        if (line){
            line.setAttribute("x1", x1);
            line.setAttribute("x2", x2);
            line.setAttribute("y1", y1);
            line.setAttribute("y2", y2);
            this.svg.appendChild(line);
        }
        return this;
    },

    emptyElement: function(elem){
        if (elem){
            while (elem.firstChild) {
                elem.removeChild(elem.firstChild);
            }
        }
        return this;
    },
});
