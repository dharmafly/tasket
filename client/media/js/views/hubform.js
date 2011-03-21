var HubForm = Lightbox.extend({
    events: {
        "submit form": "submit",
        "click form button": "submit"
    },
    constructor: function HubForm() {
        Lightbox.prototype.constructor.apply(this, arguments);
    },
    submit: function (event) {
        event.preventDefault();
        var data = {};

        this.reset();

        this.$('form :input').each(function () {
            data[this.name] = $(this).val();
        });
        this.model.save(data, {
            success: _.bind(this._onSuccess, this),
            error:   _.bind(this._onError, this)
        });
        this.trigger('submit');
    },
    errors: function (errors) {
        var list = this.$('form :input');

        list.each(function () {
            var input    = $(this),
                messages = errors[this.name];

            if (messages) {
                input.parent().addClass('error');
                input.prev('label').html(function () {
                    return $(this).text() + ': <strong>' + messages.join('. ') + '</strong>';
                });
            }
        });
    },
    reset: function () {
        this.$('.error strong').remove();
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
    },
    _onSuccess: function () {
        this.hide().trigger('success');
    },
    _onError: function (model, xhr) {
        var errors = jQuery.parseJSON(xhr.responseText);
        this.errors(errors).trigger('error');
    }
});

