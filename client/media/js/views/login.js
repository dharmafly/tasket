var Login = Form.extend({
    constructor: function Login() {
        Form.prototype.constructor.apply(this, arguments);
    },

    submit: function (event) {
        var credentials;

        if (event) {
            event.preventDefault();
        }

        credentials = _.map(this.elem.serializeArray(), function (input) {
            return input.value;
        });

        // Login and add callbacks to the returned obejct.
        Tasket.login(credentials[0], credentials[1])
            .success(_.bind(this._onSuccess, this))
            .error(_.bind(function (xhr) {
                this._onError({}, xhr);
            }, this));

        return this.trigger('submit', this);
    },

    render: function () {
        var html = tim('login');
        this.elem.html(html);
        return this;
    },

    _onSuccess: function (data) {
        this.trigger('success', data.user, this);
    }
});

