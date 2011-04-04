/* View for handling multipart/form-data uploads. This should be replaced
 * eventually with a nice ajax uploaded. Currently the server only supports
 * uploads using multipart/form-data. As binary data cannot easily be uploaded
 * using XMLHttpRequest we use a form within an iframe to do the heavy lifting
 * for us.
 */
var FormUpload = Form.extend({

    /* Pretty output in Webkit Inspector */
    constructor: function FormUpload() {
        Form.prototype.constructor.apply(this, arguments);
    },

    /* Should be overidded by the extending view to provide the url for
     * for the form within the iFrame. Will throw an error if not implemented.
     *
     * Returns nothing.
     */
    url: function () {
        throw "Must be implemented by extending object";
    },

    /* Toggles the loading element in the view. This should be displayed when
     * the iFrame is submitted and removed once loaded.
     *
     * Returns itself.
     */
    toggleLoading: function() {
        var loading = this.$(".loading");
        if (loading.is(":visible")) {
            loading.hide();
            $(this.iframe).show();
        } else {
             loading.show();
             $(this.iframe).hide();
        }
        return this;
    },

    /* Updates the contents of the iframe with the form html. This needs to be
     * called by the implementor once the view has been rendered and appended
     * to the DOM.
     *
     * NOTE: The input name is taken from the form field that is replaced by
     * the iFrame.
     *
     * Examples
     *
     *   $("#content").append(view.render().el);
     *   view.updateFrame();
     *
     * Returns itself.
     */
    updateFrame: function () {
        if (!this.iframe) {
            this._createFrame();
        }

        this.iframe.contentWindow.document.open();
        this.iframe.contentWindow.document.write(tim("iframe-upload", {
            name: this.name,
            stylesheet: $('link[rel=stylesheet]')[0].href
        }));
        this.iframe.contentWindow.document.close();

        return this;
    },

    /* Creates a new iframe element and replaces the current file input in the
     * view. Also grabs the input name in order to append it to the iframe
     * element.
     *
     * Returns iframe element.
     */
    _createFrame: function () {
        var input = this.$("input[type=file]");

        this.name = input.attr("name");
        this.iframe = $("<iframe>", {
            id: "field-image",
            scrolling: "no",
            frameBorder: 0,
            allowTransparency: true,
            css: {
                width: "100%",
                height: input.outerHeight(),
                margin: 0,
                padding: 0,
                overflow: "hidden",
                borderWidth: 0,
                borderStyle: "none",
                backgroundColor: "transparent"
            }
        })[0];

        input.replaceWith(this.iframe);
        return this.iframe;
    },

    /* Overrides the default Form _onSuccess method to also submit the form
     * within the iframe. Updates the view model with json data returned by
     * the server on upload.
     *
     * Triggers the "success" event once the iFrame has reloaded.
     *
     * Returns nothing.
     */
    _onSuccess: function () {
        var view = this,
            form = $("form", this.iframe.contentWindow.document.body);

        // Bail early if no file is present.
        if (!form.find('input').val()) {
            view.trigger("success", view.model, view);
            return;
        }

        // Hide the iframe and show loading text.
        this.toggleLoading();

        // Set the onload handler for when the iframe reloads.
        this.iframe.onload = function onload() {
            var response = this.contentWindow.document.body.innerHTML,
                data;

            try {
                data = $.parseJSON(response);
                view.model.set(data);
                view.updateFrame().toggleLoading();
                view.trigger("success", view.model, view);
                this.onload = null;
            } catch (error) {}
        };

        // Grab the element from the jQuery wrapper.
        form = form[0];

        // Update the form action.
        form.action = this.url();

        // Submit the form.
        form.submit();
    },
});
