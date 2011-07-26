/*!
* Cache
*   github.com/premasagar/mishmash/tree/master/cache/
*
*//*
    localStorage caching
*//*

    by Premasagar Rose
        dharmafly.com

    license
        opensource.org/licenses/mit-license.php

    **

    creates global object
        Cache

    **

    v0.1.1

*//*global window */

var Cache = (function(window){
    "use strict";

    var JSON = window.JSON,
        localStorage;
            
    /////
    
    
    // Is localStorage available? If always known to exist, then this block may be removed, and the line above changed to: localStorage = window.localStorage;
    try {
        localStorage = window.localStorage;
    }
    catch(e){}
    
    if (!localStorage){
        return (function(){
            var Mock = function(){},
                p = Mock.prototype;
                
            p.set = p.remove = function(){ return this; };
            p.get = p.wrapper = p.time = function(){};
            p.localStorage = false;
            return Mock;
        }());
    }
    
    
    /////
    
        
    function Cache(namespace){
        this.prefix = namespace ? namespace + "." : "";
    }
    Cache.prototype = {
        localStorage: true,
        
        set: function(key, value, returnWrapper){
            var wrapper = {
                v: value,
                t: (new Date()).getTime()
            };
            localStorage[this.prefix + key] = JSON.stringify(wrapper);
            return returnWrapper !== true ? this : wrapper;
        },
        
        wrapper: function(key){
            var cached = localStorage[this.prefix + key];
            return cached ? JSON.parse(cached) : cached;
        },
        
        get: function(key){
            var wrapper = this.wrapper(key);
            return wrapper ? wrapper.v : wrapper;
        },
        
        time: function(key){
            var wrapper = this.wrapper(key);
            return wrapper ? JSON.parse(wrapper).t : wrapper;
        },
        
        remove: function(key){
            localStorage.removeItem(this.prefix + key);
            return this;
        }
    };
    
    return Cache;
}(window));
