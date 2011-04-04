var SignUp = FormUpload.extend({
    constructor: function SignUp() {
        Form.prototype.constructor.apply(this, arguments);
    },

    url: function () {
        // API requires a URL without user ID.
        return '/users/image/';
    },

    render: function () {
        var html = tim('signup');
        this.elem.html(html).find('.loading').hide();
        return this;
    }
});
