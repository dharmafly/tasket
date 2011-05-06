var Account = SignUp.extend({
    constructor: function Account() {
        Form.prototype.constructor.apply(this, arguments);
        
        // Remove the password fields from the User model.
        this.bind("submit", function (user) {
            _.each(["password", "password-confirm"], function (attribute) {
                user.unset(attribute, {silent: true});
            });
        });
    },
    
    render: function () {
        var data = this.model.toJSON();

        this.elem.html(tim("account", data)).find(".loading").hide();
        return this;
    }
});
