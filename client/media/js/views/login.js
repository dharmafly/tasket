var Login = Form.extend({
    constructor: function Login() {
        Form.prototype.constructor.apply(this, arguments);

        // Add some very basic error handling.
        this.bind('error', _.bind(function (data) {
           if (data.status === 401) {
               this.errors({
                   username: ["Invalid username and password"]
               });
           }
        }, this));
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
        var user;

        if (!data.error) {
            user = new User(data.user);
            this.trigger('success', user, this);
        } else {
            this.trigger('error', data, this);
        }
    }
});

