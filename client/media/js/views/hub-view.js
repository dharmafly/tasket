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
        this.taskViews = _( // TODO: This is an Underscore collection. Confusing? Or genius?
            this.tasks.filter(function (task) {
                return task.get('state') !== Task.states.VERIFIED;
            }).map(function(task){
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
    
    xrenderTasks: function(){
        var taskView, left, top;
        taskView.offset({
            left: left,
            top:  top
        });
    },

    renderTasks: function(){
        var container = this.taskListElem,
            nucleusRadius = this.nucleusWidth / 2,
            angleIncrement = ((2 * Math.PI) / this.taskViews.size()),
            distance = this.get("taskDistance") + nucleusRadius,
            taskWidth, taskHeight, tempDistance, tempWidth;

        this.loading(false);

        // TEMP: show distance boundary
        tempDistance = Math.round(distance);
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

    render: function(){
        var data = this.model.toJSON(),
            desc = data.description;

        data.isSelected = this.isSelected();
        data.description = truncate(data.description, app.hubDescriptionTruncate);
        data.image = this.imageSrc();
        data.canEdit = app.isCurrentUser(data.owner);

        this.elem.html(tim("hub", data));
        this.nucleusElem = this.elem.children("a.nucleus-wrapper");
        // NOTE: this calculation requires this.elem to be present in the document's DOM, for CSS styling
        this.nucleusWidth = this.nucleusElem.outerWidth(); // TODO: or use .set("nucleusWidth"); ?
        this.tasksElem = this.$("div.tasks");
        this.taskListElem = this.tasksElem.children("ul");
        this.labelElem = this.$("hgroup");
        this.canvasElem = this.$("canvas");
        this._canvasSetup();
        this._updateMargin();
        if (data.isSelected){
            this.renderTasks();
        }
        return this.offsetApply();
    }
});
