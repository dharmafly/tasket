var SignUp = Lightbox.extend({
    constructor: function SignUp() {
        Lightbox.prototype.constructor.apply(this, arguments);
    },
    render: function () {
        var html = tim('signup');
        Lightbox.prototype.render.call(this, html);
        return this;
    }
});

