// ABSTRACT MODEL
var Model = Backbone.Model.extend({
    url: function() {
        var url = Tasket.endpoint + this.type + "s/";
        return this.isNew() ? url : url + this.id;
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

    url: function(){
        var url = Tasket.endpoint + this.type + "s/",
            bootstrapping = this.seed && !this.length,
            ids;
        // If the page has just loaded, and nothing is yet loaded, then seed this with default objects
        
        if (!bootstrapping){
            ids = this.pluck("id").sort();
            url += "?ids=" + ids;
        }
        return url;
    }
});
