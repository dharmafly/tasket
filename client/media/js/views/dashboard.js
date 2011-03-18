var Dashboard = View.extend({
    tagName: 'section',
    className: 'dashboard',
    render: function () {
        var rendered = tim('dashboard');
        this.elem.html(rendered);
        return this;
    }
});

