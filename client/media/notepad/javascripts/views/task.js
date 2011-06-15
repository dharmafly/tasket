 var TaskView = View.extend({
         tagName: 'li',
         events: {
         },

        /*
         * Display object name in browser console.
         *
         *
         */
         constructor: function () {
             Backbone.View.prototype.constructor.apply(this, arguments);
         },

         initialize: function () {
             this.id = this.model.id;
         },

         render: function () {
             return $(this.el).html(tim('task', {
                 itemText: this.model.get('description')
             }))[0];
         }

 });
