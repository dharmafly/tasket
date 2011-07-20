var ArchiveForm = Form.extend({
    events: _.extend({}, Form.prototype.events, {
        "click .restore": "_onRestore"
    }),

    constructor: function ArchiveForm() {
        Form.prototype.constructor.apply(this, arguments);
    },
    
    render: function (archivedHubData) {
        var noArchivedProjects = archivedHubData.length < 1 ? true : false,
            template = tim("archive-form", { 
                noArchivedProjects:noArchivedProjects, 
                archivedProjects:archivedHubData
            });
        
        this.elem.html(template);
        
        return this;
    },
    

    // overwrite default form method
    submit: function(event) {
        event.preventDefault();
        return this;
    },
    

    /* DOM Event callback. Restores the current hub on the server and broadcasts
     * the "restore" event passing in the model and view to all listeners. 
     *
     * event - A click browser Event object.
     *
     * Returns nothing.
     */
    _onRestore: function (event) {
        var hubId;
        if (window.confirm(app.lang.RESTORE_HUB_CONFIRM)) {
            hubId = event.target.getAttribute('data-hub-id');
            // hide hub in archive form
            this.$(".archived-project-"+hubId).slideUp();
            // restore hub
            this.trigger("restore", hubId);
        }
        event.preventDefault();        
    }
});

