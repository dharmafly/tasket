var HubForm = FormUpload.extend({

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
        var template = tim("new-hub", {
            title:       this.model.get("title") || "",
            description: this.model.get("description") || "",
            isNew:       this.model.isNew(),
            isNotNew:   !this.model.isNew()
        });

        this.elem.html(template).find(".loading").hide();
        return this;
    }
});
