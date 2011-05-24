var Form = View.extend({
    tagName: "form",
    
    events: {
        "submit": "submit"
    },
    
    constructor: function Form() {
        View.prototype.constructor.apply(this, arguments);
    },
    
    abort: false,
    
    submit: function (event) {
        var data = {};
            
        if (event) { 
            event.preventDefault();
        }

        this.reset();

        this.$(":input[name]:not([type=file])").each(function () {
            data[this.name] = jQuery(this).val();
        });

        this.trigger("beforeSave", data, this.model, this);
        
        // listeners to beforeSave may set the `abort` flag
        if (this.abort){
            this.trigger("error", this.model, this);
        }
        else {
            this.model.save(data, {
                success: _.bind(this._onSuccess, this),
                error:   _.bind(this._onError, this)
            });

            this.trigger("submit", this.model, this);
        }
        return this;
    },
    
    errors: function (errors) {
        var list = this.$(":input");

        list.each(function () {
            var input    = jQuery(this),
                messages = errors[this.name];

            if (messages) {
                input.parent().addClass("error");
                input.prev("label").html(function () {
                    var label  = jQuery(this),
                        text   = label.data("original");

                    if (!text) {
                        text = label.text();
                        label.data("original", text);
                    }

                    return text + ": <strong>" + messages.join(", ") + "</strong>";
                });
            }
        });

        return this;
    },
    
    reset: function () {
        this.abort = false;
    
        this.$(".error")
            .removeClass("error")
            .find("strong").remove();
            
        return this;
    },
    
    _onSuccess: function () {
        this.trigger("success", this.model, this);
    },
    
    _onError: function (model, xhr) {
        var errors = jQuery.parseJSON(xhr.responseText);
        this.errors(errors).trigger("error", this.model, this);
    }
});

