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

         render: function () {
             return $(this.el).html(tim('task-form', {}))[0];
         },

         hide: function () {
             $(this.el).hide().prev().show();
         },
         _onCancelClicked: function (event) {
             this.hide();
             event.preventDefault();
         },

         _onInputChange: function (event) {
           this.hide();
         }


 });
