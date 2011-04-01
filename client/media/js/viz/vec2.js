if(typeof Float32Array != 'undefined') {
	glMatrixArrayType = Float32Array;
} else if(typeof WebGLFloatArray != 'undefined') {
	glMatrixArrayType = WebGLFloatArray;
} else {
	glMatrixArrayType = Array;
}


vec2 = {};


vec2.create = function(vec) {
	var dest = new glMatrixArrayType(2);
	
	if(vec) {
		dest[0] = vec[0];
		dest[1] = vec[1];
	}
	
	return dest;
};

vec2.set = function(vec, dest) {
	dest[0] = vec[0];
	dest[1] = vec[1];
	//dest[2] = vec[2];
	
	return dest;
};

vec2.add2 = function(vec, vec2, dest) {
	
	dest[0] = vec[0] + vec2[0];
	dest[1] = vec[1] + vec2[1];
	//dest[2] = vec[2] + vec2[2];
	return dest;
};

vec2.add = function(vec, vec2) {
	vec[0] += vec2[0];
	vec[1] += vec2[1];
};

vec2.subtract2 = function(vec, vec2, dest) {
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
};

vec2.subtract = function(vec, vec2){
	vec[0] -= vec2[0];
	vec[1] -= vec2[1];
};

vec2.scale = function(vec, val) {
		vec[0] *= val;
		vec[1] *= val;
		return vec;
};

vec2.scale2 = function(vec, val, dest) {
	
	dest[0] = vec[0]*val;
	dest[1] = vec[1]*val;
	//dest[2] = vec[2]*val;
	return dest;
};

vec2.normalize = function(vec, dest) {
	if(!dest) { dest = vec; }
	
	var x = vec[0], y = vec[1];//, z = vec[2];
	var len = Math.sqrt(x*x + y*y);
	
	if (!len) {
		dest[0] = 0;
		dest[1] = 0;
		//dest[2] = 0;
		return dest;
	} else if (len == 1) {
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
};

vec2.length = function(vec){
	var x = vec[0], y = vec[1];//, z = vec[2];
	return Math.sqrt(x*x + y*y);
};


vec2.dist = function(vec, vec2){
	var dx = vec[0] - vec2[0];
	var dy = vec[1] - vec2[1];
	return Math.sqrt(dx*dx + dy*dy);
};

vec2.dot = function(vec, vec2){
	return vec[0]*vec2[0] + vec[1]*vec2[1];// + vec[2]*vec2[2];
};

