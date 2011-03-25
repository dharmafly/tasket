var Form = View.extend({
    events: {
        "submit": "submit"
    },
    tagName: 'form',
    constructor: function Form() {
        View.prototype.constructor.apply(this, arguments);
    },
    submit: function (event) {
        var data = {};
        if (event) { 
            event.preventDefault();
        }

        this.reset();

        this.$(':input').each(function () {
            data[this.name] = $(this).val();
        });

        this.model.save(data, {
            success: _.bind(this._onSuccess, this),
            error:   _.bind(this._onError, this)
        });

        this.trigger('submit', this.model, this);
    },
    errors: function (errors) {
        var list = this.$(':input');

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
    _onSuccess: function () {
        this.trigger('success', this.model, this);
    },
    _onError: function (model, xhr) {
        var errors = jQuery.parseJSON(xhr.responseText);
        this.errors(errors).trigger('error', this.model, this);
    }
});

