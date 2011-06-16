 var TaskFormView = View.extend({
         events: {
             'click .cancel-add-item': '_onCancelClicked',
             'change input': '_onInputChange'
         },

         /* Caches a reference to the add-item link */
         addItemElement: null,

        /*
         * Display object name in browser console.
         *
         *
         */
         constructor: function TaskFormView () {
             Backbone.View.prototype.constructor.apply(this, arguments);
         },

         initialize: function (options) {
             this.elem = jQuery(this.el);
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
         * Moves the input field into the target list item element, displays it, and
         * fills it with the task descrition text.
         *
         * task   - An instance of the Task model.
         * target - The target element of the edit control button.
         *
         * returns itself.
         *
         */

         editTask: function (task, target) {
             var taskDescription = task.get("description");
             this.reset();

             this.$("input")
                 .val(taskDescription)
                 .attr("data-cid", task.cid)
                 .attr("data-original-description", taskDescription);

             jQuery(target).parents("li:not(.edit)").find("p")
                 .html(this.el);

             this.elem.show();

             return this;
         },


        /**
         * Clears input attributes and, if needed, reposition the view element under the
         * add-item control.
         *
         *
         * Returns itself.
         *
         */

         reset: function () {
             var parentParagraph = this.elem.parents("p"),
                 originalDescription = this.$("input").attr("data-original-description");

             // cache a reference to addItem element at the first time the method is run
             if (!this.addItemElement) {
                 this.addItemElement = this.elem.prev();
             }


             if (! this.elem.prev().hasClass("add-item")) {
                 this.addItemElement.show().after(this.el);
                 parentParagraph.text(originalDescription);
             }

             this.$("input")
                 .val("")
                 .removeAttr("data-cid")
                 .removeAttr("data-original-description");

             return this;
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
             this.reset().addItemElement.show();
             this.elem.hide();
             event.preventDefault();
         },

        /**
         *
         * Handles change events on the form input element.
         *
         * Triggers the 'update-item' event when the input element has a 'data-cid' attribute defined.
         * Will trigger an 'add-item' if it does not.
         *
         * event - An event object.
         *
         * Returns nothing.
         *
         */
         _onInputChange: function (event) {
             var input = jQuery(event.target),
                 inputText = input.val(),
                 cid = input.attr("data-cid"),
                 triggerArguments = cid ?
                   ["update-item", cid, {description: inputText}] :
                   ["add-item", inputText];


             // the form input has to be re-positioned before than the task model emits a change event
             // and TaskView gets re-rendered.

             this.reset().elem.hide();
             TaskFormView.prototype.trigger.apply(this, triggerArguments);
             event.preventDefault();
         }

 });
