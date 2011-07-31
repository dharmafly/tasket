/*!
* getScript
*   github.com/premasagar/mishmash/tree/master/getscript/
*
*//*
    load single or multiple JavaScript files, with callbacks and optional settings

    by Premasagar Rose
        dharmafly.com

    license
        opensource.org/licenses/mit-license.php
        
    v0.1

*//*

    creates method
        getScript
        
    examples
        single script
            getScript('http://example.com/jquery.js', callback);
        
        set options
            charset:
                added as an attribute to the <script> element ('utf-8' by default);
            target:
                an iframe or other window (global 'window' by default);
            keep:
                boolean - should the script element in the document head remain after the script has loaded? (false by default)
            
        getScript('http://example.com/jquery.js', callback, {charset:'utf-8', target:window, keep:false});
        
        // multiple scripts
        getScript(["jquery.js", "example.js"], callback);
        
        // using getScript.ready in place of callbacks:
        getScript(
            "foo.js",
            getScript.ready(
                "blah.js",
                getScript.ready(["1.js", "2.js", "3.js")
            )
        );
        
    callback(status)
        status === true if the script loaded successfully (or all scripts, in the case of multiple scripts). status === false if the script load failed -> but in older versions of IE, the callback will never fire at all (to handle this, set a timeout in your calling script)
        
    TODO
        ordered loading of multiple scripts that have dependencies on one another
        use options.timeout = 60 seconds, for older IEs that don't support onerror
        
*//*global window */

var getScript = (function(window){
    "use strict";
    
    var now = (new Date()).getTime(),
        method, slice, toString;
        
    function getScript(srcs, callback, options){
        /**
         * Load a script into a <script> element
         * @param {String} src The source url for the script to load
         * @param {Function} callback Called when the script has loaded
         */
        function single(src, callback, options){
            var charset = options.charset,
                keep = options.keep,
                target = options.target,
                path = options.path || "",
                document = target.document,
                head = document.head || document.getElementsByTagName('head')[0],
                script = document.createElement('script'),
                loaded = false;
                
            function finish(){
                // Clean up circular references to prevent memory leaks in IE
                script.onload = script.onreadystatechange = script.onerror = null;
                
                // Remove script element once loaded
                if (!keep){
                    head.removeChild(script); 
                }                    
                callback.call(target, loaded);
            }
            
            script.type = 'text/javascript'; // This is the default for HTML5+ documents, but should should be applied for pre-HTML5 documents, or errors may be seen in some browsers.
            script.charset = charset;
            
            script.onload = script.onreadystatechange = function(){
                var state = this.readyState;
                
                if (!loaded && (!state || state === "complete" || state === "loaded")){
                    loaded = true;
                    finish();
                }
            };
            
            // NOTE: doesn't work in IE. Maybe IE9?
            script.onerror = finish;
            
            // Async loading (extra hinting for compliant browsers)
            script.async = true;
            
            // Apply the src
            script.src = path + src + (options.noCache ? "?v=" + now : "");
            
            // Go...
            head.appendChild(script);
        }

        // **

        /**
         * Load array of scripts into script elements.  
         *
         * Note, there is only one callback function here, called after each is loaded
         *
         * @param {Array} srcs array of source files to load
         * @param {Function} callback
         */
        function multiple(srcs, callback, options){
            var length = srcs.length,
                loadCount = 0,
                checkIfComplete, i;
            
            // Check if all scripts have loaded
            checkIfComplete = function(loaded){
                if (!loaded || ++loadCount === length){
                    callback.call(options.target, loaded);
                }
            };
            
            // Doesn't call callback until after all scripts have loaded
            for (i = 0; i < length; i++){
                // Falsey arguments may result from conditional assignment of script srcs, and are simply ignored
                if (!srcs[i]){
                    callback.call(options.target, true);
                }
                else {
                    single(srcs[i], checkIfComplete, options);
                }
            }
        }

        // **
        
        method = (typeof srcs === "string") ? single : multiple;
        
        callback = callback || function(){};
        
        options = options || {};
        if (!options.charset){
            options.charset = "utf-8";
        }
        if (!options.target){
            options.target = window;
        }
              
        return method.call(window, srcs, callback, options);
    }
    
    // end main getScript function. What follows are some methods to allow syntactic sugar.
    

    // **

    /**
     * Allow chaining in callback.
     *
        getScript(
            "foo.js",
            ready(
                "blah.js",
                getScript.ready(["1.js", "2.js", "3.js")
            )
        );
     *
     *
     * @param {Array} srcs array of source files to load
     * @param {Function} callback
     * @param {Object} options to send through
     */
    function ready(srcs, callback, options){
        return function(loaded){
            if (loaded !== false){
                getScript(srcs, callback, options);
            }
            else if (callback){
                callback(loaded);
            }
        };
    }
    

    // **

    /**
     * Load an array of srcs in series, one after the next.
     *
     * @param {Array} srcs array of source files to load
     * @param {Function} callback
     * @param {Object} options to send through
     */
    function sync(srcs, callback, options){
        var i = srcs.length - 1,
            callbacks = [];
        
        for (; i; i--){
            callbacks[i] = ready(srcs[i], callbacks[i + 1] || callback, options);
        }
        
        return getScript(srcs[0], callbacks[1], options);
    }
    
    
    // **

    
    // Array methods, from underscore.js
    slice = Array.prototype.slice;
    toString = Object.prototype.toString; 
        
    function isArray(obj){
        return toString.call(obj) === '[object Array]';
    }


    /**
     * Load multiple arguments in series, one after the next. Arguments may be a string src or an array of string srcs.
     *
     * @param {Array} srcs array of source files to load
     * @param {Function} callback
     * @param {Object} options to send through
     */
    function inSequence(srcs, callback, options){
        var args = slice.call(arguments),
            len = args.length,
            last = args.slice(-1)[0],
            secondLast = args.slice(-2,-1)[0],
            srcEndPos = len - 2;
            
        if (typeof last === "object" && !isArray(last)){
            options = last;
            callback = secondLast;
        }
        else {
            options = null;
            callback = last;
            srcEndPos ++;
        }
        if (typeof callback !== "function"){
            callback = null;
            srcEndPos ++;
        }
        
        srcs = args.slice(0, srcEndPos);
        return sync(srcs, callback, options);
    }

    return inSequence;
}(window));
