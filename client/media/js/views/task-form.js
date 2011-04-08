var TaskForm = Form.extend({
    constructor: function TaskForm() {
        Form.prototype.constructor.apply(this, arguments);
        this.bind("beforeSave", function(data){
            if (data.estimate){
                data.estimate = parseInt(data.estimate, 10);
            }
        });
    },
    render: function () {
        var template = tim('new-task', {
            description:  this.model.get('description') || '',
            estimates:    this._estimates(),
            isNew:        this.model.isNew(),
            isNotNew:    !this.model.isNew()
        });

        this.elem.html(template);

        return this;
    },
    _estimates: function () {
        var current = this.model.get('estimate');
        return _.map(Task.ESTIMATES, function (value, text) {
            return {
                text: text,
                value: value,
                selected: current === value
            };
        });
    }
});

