var Account = SignUp.extend({
    render: function () {
        var html = tim("account", this.model.toJSON());
        this.elem.html(html).find(".loading").hide();
        return this;
    }
});
