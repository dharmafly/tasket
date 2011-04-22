var HubForm = FormUpload.extend({

    events: _.extend({}, FormUpload.prototype.events, {
        "click .delete": "_onDelete"
    }),

    /* Pretty output in Webkit Inspector */
    constructor: function HubForm() {
        FormUpload.prototype.constructor.apply(this, arguments);
    },

    /* Get the url for the form upload. Method is required by FormUpload.
     * 
     * Returns a url string.
     */
    url: function () {
        return this.model.url() + "/image/";
    },

    /* Renders the contents of the view.
     *
     * Returns itself.
     */
    render: function () {
        var template = tim("hub-form", {
            title:       this.model.get("title") || "",
            description: this.model.get("description") || "",
            isNew:       this.model.isNew(),
            isNotNew:   !this.model.isNew()
        });

        this.elem.html(template).find(".loading").hide();
        return this;
    },

    /* DOM Event callback. Deletes the current hub on the server and broadcasts
     * the "delete" event passing in the model and view to all listeners. 
     *
     * event - A click browser Event object.
     *
     * Returns nothing.
     */
    _onDelete: function (event) {
        if (window.confirm(app.lang.DELETE_HUB_CONFIRM)) {
            this.model.destroy();
            this.trigger("delete", this.model, this);
        }
        event.preventDefault();
    }
});
