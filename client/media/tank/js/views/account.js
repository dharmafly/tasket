var Account = SignUp.extend({
    constructor: function AccountForm() {
        SignUp.prototype.constructor.apply(this, arguments);
    },
    
    passwordRequired: false,
    
    render: function () {
        var data = this.model.toJSON();

        this.elem.html(tim("account", data)).find(".loading").hide();
        return this;
    }
});
