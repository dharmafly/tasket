var DashboardDetail = Lightbox.extend({
    events: {
        'click .back, .close': 'hide'
    },

    tagName: 'section',

    className: 'detail',

    constructor: function DashboardDetail() {
        Lightbox.prototype.constructor.apply(this, arguments);
    },

    title: function (title) {
        this.jQuery('h1').text(title);
        return this;
    },

    render: function () {
        var template = tim('dashboard-detail');
        this.elem.html(template);
        return this;
    }
});

