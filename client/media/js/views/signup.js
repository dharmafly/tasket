var SignUp = Form.extend({
    constructor: function SignUp() {
        Form.prototype.constructor.apply(this, arguments);
    },

    render: function () {
        var html = tim('signup');
        this.elem.html(html);
        return this;
    }
});

