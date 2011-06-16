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

             this.elem = jQuery(this.el);
             _.bindAll(this, 'remove','showActionControls');

             this.model.bind("remove", view.remove);

             this.elem.attr('data-cid', this.model.cid);
         },

         render: function () {
             jQuery(this.el).html(tim('task',{
                 itemText: this.model.get('description')
             }));

             //make action controllers invisible if the task has not been saved yet.
             if (!this.model.id) {
                 this.elem.find("ul.edit-item").addClass("invisible");
             }
             return this.el;
         },

        /*
         * Handles the 'change:id' event emitted by the view's model.
         *
         * returns nothing.
         *
         */

         showActionControls: function () {
             this.$("ul.edit-item").removeClass("invisible");
         }

 });
