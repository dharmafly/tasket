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
             var view = this;
             _.bindAll(this, 'remove');
             this.model.bind("remove", view.remove);
             jQuery(this.el).attr('data-cid', this.model.cid);
         },

         render: function () {
             return $(this.el).html(tim('task', {
                 itemText: this.model.get('description')
             }))[0];
         }

 });
