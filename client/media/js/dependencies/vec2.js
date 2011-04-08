var vec2 = (function(window){
    "use strict";
    
    var GLMatrixArrayType,
        vec2;

    if (typeof window.Float32Array !== "undefined") {
	    GLMatrixArrayType = window.Float32Array;
    } else if(typeof window.WebGLFloatArray !== "undefined") {
	    GLMatrixArrayType = window.WebGLFloatArray;
    } else {
	    GLMatrixArrayType = Array;
    }

    vec2 = {
        create: function(vec) {
	        var dest = new GLMatrixArrayType(2);
	
	        if(vec) {
		        dest[0] = vec[0];
		        dest[1] = vec[1];
	        }
	
	        return dest;
        },

        set: function(vec, dest) {
	        dest[0] = vec[0];
	        dest[1] = vec[1];
	        //dest[2] = vec[2];
	
	        return dest;
        },
        
        add2: function(vec, vec2, dest) {
	
	        dest[0] = vec[0] + vec2[0];
	        dest[1] = vec[1] + vec2[1];
	        //dest[2] = vec[2] + vec2[2];
	        return dest;
        },
        
        add: function(vec, vec2) {
	        vec[0] += vec2[0];
	        vec[1] += vec2[1];
        },
        
        subtract2: function(vec, vec2, dest) {
	        //if(!dest || vec == dest) {
		        //vec[0] -= vec2[0];
		        //vec[1] -= vec2[1];
		        ////vec[2] -= vec2[2];
		        //return vec;
	        //}
	
	        dest[0] = vec[0] - vec2[0];
	        dest[1] = vec[1] - vec2[1];
	        //dest[2] = vec[2] - vec2[2];
	        return dest;
        },
        
        subtract: function(vec, vec2){
	        vec[0] -= vec2[0];
	        vec[1] -= vec2[1];
        },
        
        scale: function(vec, val) {
		        vec[0] *= val;
		        vec[1] *= val;
		        return vec;
        },
        
        scale2: function(vec, val, dest) {
	
	        dest[0] = vec[0]*val;
	        dest[1] = vec[1]*val;
	        //dest[2] = vec[2]*val;
	        return dest;
        },
        
        normalize: function(vec, dest) {
	        if(!dest) { dest = vec; }
	
	        var x = vec[0], y = vec[1], len;//, z = vec[2];
	        len = Math.sqrt(x*x + y*y);
	
	        if (!len) {
		        dest[0] = 0;
		        dest[1] = 0;
		        //dest[2] = 0;
		        return dest;
	        } else if (len === 1) {
		        dest[0] = x;
		        dest[1] = y;
		        //dest[2] = z;
		        return dest;
	        }
	
	        len = 1 / len;
	        dest[0] = x*len;
	        dest[1] = y*len;
	        //dest[2] = z*len;
	        return dest;
        },
        
        length: function(vec){
	        var x = vec[0], y = vec[1];//, z = vec[2];
	        return Math.sqrt(x*x + y*y);
        },
        
        dist: function(vec, vec2){
	        var dx, dy;
	        dx = vec[0] - vec2[0];
	        dy = vec[1] - vec2[1];
	        return Math.sqrt(dx*dx + dy*dy);
        },
        
        dot: function(vec, vec2){
	        return vec[0]*vec2[0] + vec[1]*vec2[1];// + vec[2]*vec2[2];
        }
    };

    return vec2;
}(window));
