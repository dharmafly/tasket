 var TaskView = View.extend({
         tagName: 'li',
         /* keep track of the previous value of the Task's description*/
         previousDescription: null,
         events: {
         },

        /*
         * Display object name in browser console.
         *
         *
         */
         constructor: function TaskView () {
             Backbone.View.prototype.constructor.apply(this, arguments);
         },

         initialize: function (options) {
             var view = this;

             this.elem = jQuery(this.el);

             _.bindAll(this, "remove", "showActionControls", "render");

             this.elem.attr('data-cid', this.model.cid);

             this.model
                 .bind("remove", view.remove)
                 .bind("change:description", function (task) {
                     view.$("p").text(task.get("description"));
                 })
                 .bind("change:state", function (task) {
                     var state = task.get("state");

                     if (state === "done") {
                         view.elem.addClass("completed");
                     } else {
                         view.elem.removeClass("completed");
                     }

                 })
                 .bind("change:starred", function (task) {
                     var starred = !!task.get("starred");

                     if (starred && !view.elem.hasClass("star")) {
                        view.elem.addClass("star");
                     }

                     if (!starred) {
                         view.elem.removeClass("star");
                     }

                 });

         },

         render: function () {
             var starred = !!this.model.get("starred"),
                 done = this.model.get("state") == "done",
                 description = this.model.get("description");

             jQuery(this.el).html(tim("task", {
                 itemText: description
             }));

             //make action controllers invisible if the task has not been saved yet.
             if (!this.model.id) {
                 this.elem.find("ul.edit-item").addClass("invisible");
             }

             if (starred) {
                 this.elem.addClass("star");
             }
             if (done) {
                 this.elem.addClass("completed");
             }

            return this.el;
         },


        /*
         *
         *
         *
         *
         *
         */
         makeEditable: function () {
             var input  = $('<input type="text" placeholder="New item"/>'),
                 cancel = $('<a href="#" class="cancel">cancel</a> '),
                 paragraph = this.$("p"),
                 description = this.previousDescription = this.model.get("description");

             if (description) {
               input.val(description);
             }

             paragraph.empty().append(input);
             paragraph.append(cancel);
             paragraph.find("input").focus();
         },


         /*
         *
         *
         */
         reset: function () {
             if (this.model.isNew()) {
                 this.collection.remove(this.model);
             } else {
                 console.info('setting previous description');
                 this.$("p").text(this.previousDescription);
             }
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
