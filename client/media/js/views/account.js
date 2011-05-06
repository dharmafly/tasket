var Account = SignUp.extend({
    render: function () {
        var data = this.model.toJSON();

        this.elem.html(tim("account", data)).find(".loading").hide();
        return this;
    }
});
