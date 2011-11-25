var TaskView = View.extend({
    tagName: "li",
    
    /* keep track of the previous value of the Task's description*/
    previousDescription: null,
    events: {
        "mouseover": "_onMouseover",
        "mouseout": "_onMouseout"
    },

    constructor: function TaskView () {
        Backbone.View.prototype.constructor.apply(this, arguments);
    },
    
    initialize: function (options) {
        var view = this;
        this.elem = jQuery(this.el);
        _.bindAll(this, "remove", "showActionControls", "render");

        this.elem.attr("data-cid", this.model.cid);

        // TODO: delegate model bindings to Tasket.tasks collection, to reduce the number of event bindings
        this.model
            .bind("remove", view.remove)
            .bind("change:description", function (task, description) {
                view.$("p").text(description);
            })
            .bind("change:state", function (task, state) {
                if (_.include(["verified", "done"], state)) {
                    view.elem.addClass("completed");
                }
                else {
                    view.elem.removeClass("completed");
                }
            })
            .bind("change:starred", function (task, isStarred) {
                if (isStarred){
                    view.elem.addClass("star");
                }
                else {
                    view.elem.removeClass("star");
                }
            });
    },

    render: function () {
        var starred = !!this.model.get("starred.id"),
            done = this.model.get("state") === "verified",
            description = this.model.get("description");

        jQuery(this.el).html(tim("task", {
            itemText: description
        }));

        // Make action controllers invisible if the task has not been saved yet.
        if (!this.model.id) {
            this.elem.addClass("unsaved");
        }

        if (starred) {
            this.elem.addClass("star");
        }

        if (done) {
            this.elem.addClass("completed");
        }

        return this;
    },

   /*
    * Allows in place editing of the task description
    */
    makeEditable: function () {
        var html  = jQuery(tim("task-edit", {placeholder: app.lang.NEW_TASK})),
            paragraph = this.$("p"),
            description = this.previousDescription = this.model.get("description");

        paragraph.empty().append(html).addClass("editing");

        if (description) {
            paragraph.find("input").val(description);
        }

        paragraph.find("input").putCursorAtEnd();
        
        return this;
    },

    /*
    * Removes newly created items or restore previous descriptions in case an edit operation is aborted.
    *
    */
    reset: function () {
        if (this.model.isNew()) {
            this.collection.remove(this.model);
        }
        else {
            this.$("p").text(this.previousDescription).removeClass("editing");
        }
        return this;
    },

   /*
    * Handles the "change:id" event emitted by the view's model
    */
    showActionControls: function () {
        this.elem.removeClass("unsaved");
        return this;
    },

    _onMouseover: function () {
        this.elem.addClass("hover");
    },

    _onMouseout: function () {
        this.elem.removeClass("hover");
    }
});
