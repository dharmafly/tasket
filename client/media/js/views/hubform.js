var HubForm = LightboxForm.extend({
    constructor: function HubForm() {
        LightboxForm.prototype.constructor.apply(this, arguments);
    },
    render: function () {
        var template = tim('new-hub', {
            title:       this.model.get('title') || '',
            description: this.model.get('description') || '',
            isNew:       this.model.isNew(),
            isNotNew:   !this.model.isNew()
        });

        // Call the parent method to render the full lightbox.
        Lightbox.prototype.render.call(this, template);

        return this;
    }
});

