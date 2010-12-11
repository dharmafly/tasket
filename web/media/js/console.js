'use strict';

/*!
* Console
*   github.com/premasagar/mishmash/tree/master/console/
*
*//*
    cross-browser JavaScript debug console logging

    by Premasagar Rose
        dharmafly.com

    license:
        opensource.org/licenses/mit-license.php
        
    v1.2

*//*

    usage
    _('any', 'arbitrary', Number, 'of', arguments);
    
    The function can easily be assigned to a different var, instead of '_'

*/

var _

= (function(){
    var
        window = this,
        ua = window.navigator.userAgent,
        console = window.console,
        opera = window.opera,
        debug, log;
    
    // Doesn't support console API
    if (!console){
        // Opera 
        return (opera && opera.postError) ?
             function(){
                 var i, argLen, log = opera.postError, args = arguments, arg, subArgs, prop;
                 log(args);
                 
                 argLen = args.length;
                 for (i=0; i < argLen; i++){
                     arg = args[i];
                     if (typeof arg === 'object' && arg !== null){
                        subArgs = [];
                        for (prop in arg){
                            try {
                                if (arg.hasOwnProperty(prop)){
                                    subArgs.push(prop + ': ' + arg[prop]);
                                }
                            }
                            catch(e){}
                        }
                        log('----subArgs: ' + subArgs);
                     }
                 }
             } :
             function(){};
    }
    else {
        debug = console.debug;
        log = console.log;
        
        if (debug){
            // WebKit complains if console's debug function is called on its own
            if (/webkit/i.test(ua)){
                return function(){
                    var i = 0,
                        args = arguments,
                        len = args.length,
                        arr = [];
                    
                    if (len === 1){
                        console.debug(args[i]);
                    }
                    else if (len > 1){
                        for (; i < len; i++){
                            arr.push(args[i]);
                        }
                        console.debug(arr);
                    }
                };
            }
            return debug;
        }
        if (log){ // old WebKit
            if (typeof log.apply === 'function'){
                return function(){
                    log.apply(console, arguments);
                };
            }
            else { // IE8
                return function(){
                    var args = arguments,
                        len = arguments.length,
                        indent = '',
                        i;
                        
                    for (i=0; i < len; i++){
                        log(indent + args[i]);
                        indent = '---- ';
                    }
                };
            }
        }
    }
}());

/*jslint browser: true, devel: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true */
