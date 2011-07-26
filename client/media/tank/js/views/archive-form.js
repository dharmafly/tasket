var ArchiveForm = Form.extend({
    events: _.extend({}, Form.prototype.events, {
        "click .restore": "_onRestore"
    }),

    constructor: function ArchiveForm() {
        Form.prototype.constructor.apply(this, arguments);
    },
    
    renderLoading: function(){
        var template = tim("archive-form-loading");
        this.elem.html(template);
        
        return this;
    },
    
    render: function (archivedHubData) {
        var template = tim("archive-form", { 
                noArchivedProjects: !archivedHubData.length, 
                archivedProjects: archivedHubData
            });
        
        this.elem.html(template);
        
        return this;
    },
    

    // overwrite default form method
    submit: function(event) {
        if (event) {
            event.preventDefault();
        }
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
            this.trigger("restoreHub", hubId);
        }
        event.preventDefault();        
    }
});

