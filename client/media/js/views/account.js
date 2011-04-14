var Account = SignUp.extend({
    render: function () {
        var data = this.model.toJSON();

        // Temporary workaround for the server returning the email address
        // field as an array which will break tim().
        if (typeof data.email !== "string") {
            data.email = "";
        }

        this.elem.html(tim("account", data)).find(".loading").hide();
        return this;
    }
});
