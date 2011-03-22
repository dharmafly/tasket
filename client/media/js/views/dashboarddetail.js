var DashboardDetail = View.extend({
    events: {
        'click .back, .close': 'hide'
    },

    tagName: 'section',

    className: 'detail',

    constructor: function DashboardDetail() {
        View.prototype.constructor.apply(this, arguments);
    },

    show: function () {
        this.elem.show();
        return this.trigger('show', this);
    },

    hide: function (event) {
        if (event) {
            event.preventDefault();
        }
        return this.trigger('hide', this);
    },

    render: function () {
        var template = tim('dashboard-detail', {
            title: this.model.get('title')
        });
        this.elem.html(template);
        return this;
    }
});

