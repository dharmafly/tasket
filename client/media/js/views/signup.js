var SignUp = FormUpload.extend({
    constructor: function SignUp() {
        Form.prototype.constructor.apply(this, arguments);

        // Remove the password fields from the User model.
        this.bind("submit", function (user) {
            _.each(["password", "password-confirm"], function (attribute) {
                user.unset(attribute, {silent: true});
            });
        });
    },

    url: function () {
        return this.model.url() + "/image/";
    },

    render: function () {
        var html = tim("signup");
        this.elem.html(html).find(".loading").hide();
        return this;
    }
});
