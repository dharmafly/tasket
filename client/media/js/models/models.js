// ABSTRACT MODEL
var Model = Backbone.Model.extend({
    url: function() {
        var base =  Tasket.endpoint + this.type + "s/";
        return this.isNew() ? base : base + this.id;
    },
    
    initialize: function(){
        if (!this.get("createdTime")){
            this.set({createdTime: now()});
        }
    },
    
    report: function(msg){
        return "Tasket" + (this.type ? " " + this.type : "") + ": " + msg + " : " + this.cid;
    },
    
    validate: function(attrs) {
        var missing, report;
    
        // Validate if this is not a stub of a model with just an id - i.e. only on creating from scratch
        if (!this.id && this.required){
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

    url: function(){
        var base = Tasket.endpoint + this.type + "s/";
        // If the page has just loaded, and nothing is yet loaded, then seed this with default objects
        return this.seed && !this.length ? base : base + "?ids=" + this.pluck("id");
    }
});
