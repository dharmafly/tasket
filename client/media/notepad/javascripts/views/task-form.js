 var TaskFormView = View.extend({

         events: {
             'click .cancel-add-item': '_onCancelClicked',
             'change input': '_onInputChange'
         },
        /*
         * Display object name in browser console.
         *
         *
         */
         constructor: function () {
             Backbone.View.prototype.constructor.apply(this, arguments);
         },


         /*
         * Public: Renders the view.
         *
         * Returns the view's DOM element.
         *
         */
         render: function () {
             return $(this.el).html(tim('task-form', {}))[0];
         },

         /*
         * Public: Hides this view (the task form) and shows the "Add new item" control.
         *
         * Returns nothing.
         *
         */
         reset: function () {
             $(this.el).hide().prev().show();
         },


        /*
         *
         * Handles the cancel link click event
         *
         * event - An event object.
         *
         * Returns nothing.
         *
         */
         _onCancelClicked: function (event) {
             this.reset();
             event.preventDefault();
         },

        /**
         *
         * Handles change events on the form input element.
         *
         * Triggers the 'add-item' event when the view has not model instance.
         * When a model instance is defined, it will trigger the 'update-item' event instead.
         *
         * event - An event object.
         *
         * Returns nothing.
         *
         */
         _onInputChange: function (event) {
             if (!this.model) {
                 this.trigger('add-item', event.target.value);
             }

             this.$("input").val("");
             this.hide();
         }

 });
