var ForgotDetails = Form.extend({
    constructor: function ForgotDetailsForm() {
        Form.prototype.constructor.apply(this, arguments);
    },

    submit: function (event) {
        var form = this,
            data = {};

        if (event) {
            event.preventDefault();
        }

        this.$(":input[name]:not([type=file])").each(function () {
            data[this.name] = jQuery(this).val();
        });
        
        if (!data.username && !data.email){
            form.errors({
                username: ["Username or email required"]
            });
            
            this.trigger("error", this);
        }
        else {
            // Login and add callbacks to the returned obejct.
            Tasket.forgotDetails(data)
                .success(_.bind(this._onSuccess, this));
                
            this.trigger("submit", this);
        }

        return this;
    },

    render: function () {
        var html = tim("forgot-details");
        this.elem.html(html);
        return this;
    },

    _onSuccess: function () {
        this.$("h1").text("Thank you!");
        this.$(":not(h1)").remove();
        this.elem.append("<p>We've emailed you a link to reset your password.</p>");
        this.trigger("success", null, this);
    }
});
