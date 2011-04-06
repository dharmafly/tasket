// ABSTRACT MODEL
var Model = Backbone.Model.extend({
    url: function(relative) {
        var url = (relative ? "" : Tasket.endpoint) + this.type + "s/";
        return this.isNew() ? url : url + this.id;
    },
    
    initialize: function(){
        if (!this.get("createdTime")){
            this.set({createdTime: now()});
        }
    },
    
    report: function(msg){
        return "Tasket" + (this.type ? " " + this.type : "") + ": " + msg + " : " + (this.id || this.cid);
    },

    // Sets attributes on a model.
    set: function (attributes, options) {
        // Flatten the attributes into a object with only one level of properties.
        attributes = jQuery.flatten(attributes);
        return Backbone.Model.prototype.set.call(this, attributes, options);
    },

    // Coerce ids to strings to ensure sane comparisons.
    parse: function (response) {
        if (response && response.id) {
            response.id = "" + response.id;
        }
        return response;
    },

    // Returns the Model as a plain JavaScript object.
    toJSON: function () {
        // Expand the flattened attributes before returning.
        var attributes = Backbone.Model.prototype.toJSON.apply(this, arguments);
        return jQuery.expand(attributes);
    },

    /* Checks to see if all required attributes are present in the model.
     *
     * Examples
     *
     *   model.isComplete();
     *
     * Returns true if all required attributes are present.
     */
    isComplete: function () {
        if (this.required) {
            // If any required attributes are undefined then .any() will return
            // true and method returns false.
            return !_.any(this.required, function(property){
                return _.isUndefined(this.get(property));
            }, this);
        }
        return true;
    },

    validate: function(attrs) {
        var missing, report;
    
        // Validate if this is not a stub of a model with just an id - i.e. only on creating from scratch
        if (this.required && this.isNew()){
            missing = _.select(this.required, function(property){
                return _.isUndefined(this.get(property));
            }, this);
            
            if (missing.length){
                report = this.report(missing + " required");
                throw report;
                //return report;
            }
        }
    }
});

var CollectionModel = Backbone.Collection.extend({
    initialize: function(){
        this.type = this.model.prototype.type;
    },

    url: function(relative){
        var url = (relative ? "" : Tasket.endpoint) + this.type + "s/",
            bootstrapping = this.seed && !this.length,
            ids;
        // If the page has just loaded, and nothing is yet loaded, then seed this with default objects
        
        if (!bootstrapping){
            ids = this.pluck("id").sort();
            url += "?ids=" + ids;
        }
        return url;
    },

    filterByIds: function(ids){
        return new this.constructor(this.filter(function (model) {
            return _.indexOf(ids, model.id) > -1;
        }));
    },

    /* Check to see if all models in the collection are complete, ie. have
     * allrequired properties.
     *
     * Returns true if all models are complete.
     */
    isComplete: function () {
        return !this.any(function (model) {
            return !model.isComplete();
        });
    }
});
