var Login = LightboxForm.extend({
    constructor: function Login() {
        LightboxForm.prototype.constructor.apply(this, arguments);
    },

    submit: function (event) {
        var credentials;

        if (event) {
            event.preventDefault();
        }

        credentials = _.map(this.$('form').serializeArray(), function (input) {
            return input.value;
        });

        // Login and add callbacks to the returned obejct.
        Tasket.login(credentials[0], credentials[1])
            .success(_.bind(this._onSuccess, this))
            .error(_.bind(function (xhr) {
                this._onError({}, xhr);
            }, this));

        return this.trigger('submit');
    },

    render: function () {
        var html = tim('login');
        Lightbox.prototype.render.call(this, html);
        return this;
    }
});

