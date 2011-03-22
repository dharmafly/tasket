var SignUp = LightboxForm.extend({
    constructor: function SignUp() {
        LightboxForm.prototype.constructor.apply(this, arguments);
    },

    render: function () {
        var html = tim('signup');
        Lightbox.prototype.render.call(this, html);
        return this;
    }
});

