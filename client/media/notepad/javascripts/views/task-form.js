 var TaskFormView = View.extend({
         events: {
             'click .cancel-add-item': '_onCancel',
             'change input': '_onInputChange'
         },
         tagName: 'span',

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
             this.addItemView = options.addItemView;
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
             console.debug('editing task %o',target);
             task = task || this.model;


             var taskDescription = task.get("description"),
                 originalDescription = this.$("input").attr("data-original-description"),
                 parentParagraph = this.elem.parents("p");


             this.$("input")
                 .val(taskDescription)
                 .attr("data-cid", task.cid)
                 .attr("data-original-description", taskDescription);

             jQuery(target).parents("li:not(.edit)").find("p")
                 .html(this.el);

             console.info('paragrah:'+originalDescription);
             parentParagraph.text(originalDescription);

             this.elem.show().find("input").focus();
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
             this.$("input").val("");
             this.elem.hide();
             return this;
         },

         defaultPosition: function () {
            var taskView = this.addItemView;
            this.editTask(taskView.model, taskView.$(".edit a"));
         },

         elementInDefaultPosition: function () {
             return this.elem.parents("li")[0] === this.addItemView.el;
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
         _onCancel: function (event) {
             console.info('canceling %o',this.el);

             var originalDescription = this.$("input").attr("data-original-description"),
                 parentParagraph = this.elem.parents("p");

             parentParagraph.text(originalDescription);

             if (! this.elementInDefaultPosition()) {
                 this.defaultPosition();
             }
             this.reset();
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
            console.info('input change');
            // var input = jQuery(event.target),
            //     inputText = input.val(),
            //     cid = input.attr("data-cid"),
            //     triggerArguments = this.elementInDefaultPosition() ?
            //       ["add-item", inputText]:
            //       ["update-item", cid, {description: inputText}] ;


            // if (!this.elementInDefaultPosition()) {
            //     //this.defaultPosition();
            // }
            // this.reset();

            // TaskFormView.prototype.trigger.apply(this, triggerArguments);
            // event.preventDefault();
         }

 });
