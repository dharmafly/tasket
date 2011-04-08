var Login = Form.extend({
    constructor: function Login() {
        Form.prototype.constructor.apply(this, arguments);
    },

    submit: function (event) {
        var form = this,
            credentials;

        if (event) {
            event.preventDefault();
        }

        credentials = _.map(this.elem.serializeArray(), function (input) {
            return input.value;
        });

        // Login and add callbacks to the returned obejct.
        Tasket.login(credentials[0], credentials[1])
            .success(_.bind(this._onSuccess, this))
            .error(function (xhr) {
                form.errors({
                    username: ["Invalid username and password"]
                });
                form.trigger("error", xhr, form);
            });

        return this.trigger("submit", this);
    },

    render: function () {
        var html = tim("login");
        this.elem.html(html);
        return this;
    },

    _onSuccess: function (data) {
        var user = new User(data.user);
        this.trigger("success", user, this);
    }
});
