var TaskForm = Form.extend({
    events: _.extend({}, Form.prototype.events, {
        "click .delete": "_onDelete"
    }),

    constructor: function TaskForm() {
        Form.prototype.constructor.apply(this, arguments);
        
        this.bind("beforeSave", function(data){
            if (data.estimate){
                data.estimate = parseInt(data.estimate, 10);
            }
        });
    },
    
    render: function () {
        var canDelete = this.model.canDelete(),
            template = tim("edit-task", {
            description:  this.model.get("description") || "",
            estimates:    this._estimates(),
            isNew:        this.model.isNew(),
            isNotNew:    !this.model.isNew(),
            canDelete: canDelete 
        });
        
        this.elem.html(template);

        return this;
    },
    
    _estimates: function () {
        var current = this.model.get("estimate");
        
        return _.map(Task.ESTIMATES, function (estimate) {
            return _.extend(
                estimate,
                {selected: current === estimate.value}
            );
        });
    },

    /* DOM Event callback. Deletes the current task on the server and broadcasts
     * the "delete" event passing in the model and view to all listeners. 
     *
     * event - A click browser Event object.
     *
     * Returns nothing.
     */
    _onDelete: function (event) {
        if (window.confirm(app.lang.DELETE_TASK_CONFIRM)) {
            this.model.destroy();
            this.trigger("delete", this.model, this);
        }
        event.preventDefault();
    }
});

