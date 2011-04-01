var SignUp = FormUpload.extend({
    constructor: function SignUp() {
        Form.prototype.constructor.apply(this, arguments);
    },

    url: function () {
        return this.model.url() + '/images/';
    },

    render: function () {
        var html = tim('signup');
        this.elem.html(html).find('.loading').hide();
        return this;
    }
});
