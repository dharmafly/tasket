(function ( window, $, undefined) {
   'use strict';
    var Task = Backbone.View.extend({
            tagName: 'li',
            className: 'start completed',

           /*
            * Display object name in browser console.
            *
            *
            */
            constructor: function () {
                Backbone.View.prototype.constructor.apply(this, arguments);
            },

           /*
            * Renders the view.
            *
            * Returns the view's element.
            *
            */
            render: function () {
                return $(this.el).html(App.Utils.getTemplate('task'), this.model.toJSON())[0];
            }


    });
    this.Task = Task;

}).call(App.Views, window, jQuery, undefined);
