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

    // Returns the Model as a plain JavaScript object.
    toJSON: function () {
        // Expand the flattened attributes before returning.
        var attributes = Backbone.Model.prototype.toJSON.apply(this, arguments);
        return jQuery.expand(attributes);
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
    
    
    // TODO: check and improve efficiency if possible
    parse: function(data){
        var current = this.toJSON();
        
         _(data).each(function(newModel){
            var found = false;
            
            // Using jQuery's .each instead of Underscore's, so that we can break the loop
            jQuery(current).each(function(index, model){
                if (model.id === newModel.id){
                    current[index] = newModel;
                    found = true;
                    return false; // break the loop
                }
            });
            
            if (!found){
                current.push(newModel);
            }
        });
        return current;
    }
});
