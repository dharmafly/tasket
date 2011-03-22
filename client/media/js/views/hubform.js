var HubForm = Form.extend({
    constructor: function HubForm() {
        Form.prototype.constructor.apply(this, arguments);
    },
    render: function () {
        var template = tim('new-hub', {
            title:       this.model.get('title') || '',
            description: this.model.get('description') || '',
            isNew:       this.model.isNew(),
            isNotNew:   !this.model.isNew()
        });

        this.elem.html(template);

        return this;
    }
});

