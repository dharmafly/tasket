var Account = SignUp.extend({
    constructor: function AccountForm() {
        SignUp.prototype.constructor.apply(this, arguments);
    },
    
    render: function () {
        var data = this.model.toJSON();

        this.elem.html(tim("account", data)).find(".loading").hide();
        return this;
    }
});
