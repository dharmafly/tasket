require.def('kgd/core', [], function(){
	return {
		//consts: {},
		//math: {},

		include: function(filename){
			var head = document.getElementsByTagName('head')[0];

			script = document.createElement('script');
			script.src = filename;
			script.type = 'text/javascript';

			head.appendChild(script)
		},

		extend: function(child, supertype){
			child.prototype.__proto__ = supertype.prototype;
			child.prototype._super = supertype;
		},

		foo: function(){
			return 'hello';
		}
	}

});
require.def('kgd/consts', [], function(){
	return {
		LEFT: 0, 
		RIGHT: 1,
		ON: 0,
		OFF: 1
	}
});
require.def('kgd/aux', ['./core'], function(core){

	aux = {};
	aux.getRandomPVM = function(origin, range_x, range_dx, range_m){
		var pvm = {};
		p = vec2.create([2*(Math.random()-0.5)*range_x, 2*(Math.random()-0.5)*range_x]);
		if(origin){ vec2.add(p, origin);}
		pvm.x = p[0];
		pvm.y = p[1];
		pvm.m = (Math.random()+0.5)*range_m;
		pvm.dx = (Math.random()-0.5)*range_dx;
		pvm.dy = (Math.random()-0.5)*range_dx;
		return pvm;
		//this.objects.push(new kgd.World.Thing(this, {
					//x:p.e(1), y:p.e(2), dx:dx, dy:dy, m:m
				//}));
	};

	aux.isFloat = function(value){
		if (isNaN(value) || value.toString().indexOf(".") < 0) {
			return false;
		} else {
			if (parseFloat(value)) {
				return true;
			} else {
				return false;
			}
		}
	};

	aux.getColorFromRGB = function(_rgb, scale){
		if(typeof scale === 'undefined'){ scale = 1;}
		var rgb = _rgb.slice();
		rgb[0] *= scale;
		if(rgb[0] > 255){ rgb[0] = 255;}
		rgb[1] *= scale;
		if(rgb[1] > 255){ rgb[1] = 255;}
		rgb[2] *= scale;
		if(rgb[2] > 255){ rgb[2] = 255;}

		return "rgb(" + Math.floor(rgb[0]) + "," + Math.floor(rgb[1]) + "," + Math.floor(rgb[2]) + ")";
	};

	aux.containsArrObj = function(a, obj){
		var i = a.length;
		while (i--) {
			if (a[i] === obj) {
				return true;
			}
		}
		return false;
	};

	aux.removeItemFromArray = function(i, a){
		var idx = a.indexOf(i); // Find the index
		if(idx!=-1){ a.splice(idx, 1);}
	};

	aux.setObjParam = function(obj, params, param, deflt){
		if(typeof deflt === 'undefined'){ deflt = null;}
		if(typeof(params[param]) === 'undefined'){
			obj[param] = deflt;
		}
		else{
			obj[param] = params[param];
		}
	};

	aux.degToRad = function(deg){
		return (deg/180.0)*Math.PI;
	};

	aux.coordString = function(c, label){
		return label + ' ' + c[0].toFixed(2) + ', ' + c[1].toFixed(2);
	};


	return aux;
});
require.def('kgd/client', ['./consts', './aux'], function(consts, aux){
	client = {};
	// borrowed from typeface-0.14.js
	// http://typeface.neocracy.org
	client.Text = {
	  renderGlyph: function(ctx, face, cha) {

		var glyph = face.glyphs[cha];

		if (glyph.o) {

		  var outline;
		  if (glyph.cached_outline) {
			outline = glyph.cached_outline;
		  } else {
			outline = glyph.o.split(' ');
			glyph.cached_outline = outline;
		  }

		  var outlineLength = outline.length;
		  for (var i = 0; i < outlineLength; ) {

			var action = outline[i++];

			switch(action) {
			  case 'm':
				ctx.moveTo(outline[i++], outline[i++]);
				break;
			  case 'l':
				ctx.lineTo(outline[i++], outline[i++]);
				break;

			  case 'q':
				var cpx = outline[i++];
				var cpy = outline[i++];
				ctx.quadraticCurveTo(outline[i++], outline[i++], cpx, cpy);
				break;

			  case 'b':
				var x = outline[i++];
				var y = outline[i++];
				ctx.bezierCurveTo(outline[i++], outline[i++], outline[i++], outline[i++], x, y);
				break;
			}
		  }
		}
		if (glyph.ha) {
		  ctx.translate(glyph.ha, 0);
		}
	},

	  renderText: function(text, size, x, y, color) {
		  if(typeof(color) === 'undefined'){
			  color = 'rgb(240, 240, 240)';
		  }
		  this.context.save();
		  this.context.setTransform(1,0,0,1,0,0);
		  //this.context.scale(1/this.ppm,1/this.ppm);

		  this.context.translate(x, y);
		  this.context.fillStyle = color;

		  var pixels = size * 72 / (this.face.resolution * 100);
		  this.context.scale(pixels, -1 * pixels);
		  this.context.beginPath();
		  var chars = text.split('');
		  var charsLength = chars.length;
		  for (var i = 0; i < charsLength; i++) {
			  this.renderGlyph(this.context, this.face, chars[i]);
		  }
		  this.context.fill();

		  this.context.restore();
	  },

	  context: null,
	  face: null,
	  ppm: null
	};

		
	client.DEFAULT_KEY_CODES = {
	  32: 'space',
	  37: 'left',
	  38: 'up',
	  39: 'right',
	  40: 'down',
	  70: 'f',
	  71: 'g',
	  72: 'h',
	  73: 'i',
	  76: 'l',
	  77: 'm',
	  80: 'p',
	  82: 'r',
	  48: '0',
	  49: '1',
	  50: '2',
	  51: '3',
	  52: '4'
	}

	client.KEY_CODES = {};

	client.KEY_STATUS = { keyDown:false };
	client.setKeyCodes = function(kcd){
		for (code in kcd) {
			client.KEY_CODES[code] = kcd[code];
			client.KEY_STATUS[kcd[code]] = false;
		}
	}

	client.setKeyCodes(client.DEFAULT_KEY_CODES);

	(function(){
		$(window).keydown(function (e) {
				client.KEY_STATUS.keyDown = true;
				if (client.KEY_CODES[e.keyCode]) {
					e.preventDefault();
					client.KEY_STATUS[client.KEY_CODES[e.keyCode]] = true;
				}
			}).keyup(function (e) {
					client.KEY_STATUS.keyDown = false;
					if (client.KEY_CODES[e.keyCode]) {
						e.preventDefault();
						client.KEY_STATUS[client.KEY_CODES[e.keyCode]] = false;
					}
		});
	})();


	client.getMouseCoords = function(event, c)
	{
		if(event == null)
		{
			event = window.event; 
		}
		if(event == null)
		{
			return null; 
		}
		if(event.pageX || event.pageY){
			//return {x:event.pageX / scaleFactor, y:event.pageY / scaleFactor};
			return {x:event.pageX-c.offsetLeft, y:event.pageY-c.offsetTop};
		}
		return null;
	}

	client.setMouseCoords = function(mc, event, c)
	{
		if(event == null)
		{
			event = window.event; 
		}
		if(event == null)
		{
			return null; 
		}

		if(event.offsetX){
			mc[0] = event.offsetX; 
			mc[1] = event.offsetY;
		}
		else if(event.layerX || event.layerY){
			//return {x:event.pageX / scaleFactor, y:event.pageY / scaleFactor};
			//return {x:event.pageX-c.offsetLeft, y:event.pageY-c.offsetTop};
			mc[0] = event.layerX; 
			mc[1] = event.layerY;
		}
	}








	return client;
});
/*
 * Kyran Dale 2010
 * Adapted from:
 * glMatrix.js - High performance matrix and vector operations for WebGL
 * version 0.9.4
 */
 
/*
 * Copyright (c) 2010 Brandon Jones
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not
 *    be misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 */

require.def('kgd/maths/v2', [], function(){

	// Fallback for systems that don't support WebGL
	if(typeof Float32Array != 'undefined') {
		glMatrixArrayType = Float32Array;
	} else if(typeof WebGLFloatArray != 'undefined') {
		glMatrixArrayType = WebGLFloatArray;
	} else {
		glMatrixArrayType = Array;
	}

	/*
	 * vec3 - 3 Dimensional Vector
	 */
	var v2 = {};
	v2.vec2 = {};
	vec2 = v2.vec2;

	/*
	 * vec2.create
	 * Creates a new instance of a vec2 using the default array type
	 * Any javascript array containing at least 2 numeric elements can serve as a vec3
	 *
	 * Params:
	 * vec - Optional, vec3 containing values to initialize with
	 *
	 * Returns:
	 * New vec3
	 */
	vec2.create = function(vec) {
		var dest = new glMatrixArrayType(2);
		
		if(vec) {
			dest[0] = vec[0];
			dest[1] = vec[1];
		}
		
		return dest;
	};

	/*
	 * vec2.createFromRot
	 * Creates a new instance of a vec2 using the default array type
	 * Any javascript array containing at least 2 numeric elements can serve as a vec3
	 *
	 * Params:
	 * vec - Optional, vec3 containing values to initialize with
	 *
	 * Returns:
	 * New vec3
	 */
	vec2.createFromRot = function(rot, length) {
		var dest = new glMatrixArrayType(2);
		
		dest[0] = Math.cos(rot)*length;
		dest[1] = Math.sin(rot)*length;
		
		return dest;
	};
	/*
	 * vec3.set
	 * Copies the values of one vec3 to another
	 *
	 * Params:
	 * vec - vec3 containing values to copy
	 * dest - vec3 receiving copied values
	 *
	 * Returns:
	 * dest
	 */
	vec2.set = function(vec, dest) {
		dest[0] = vec[0];
		dest[1] = vec[1];
		//dest[2] = vec[2];
		
		return dest;
	};

	/*
	 * vec3.add
	 * Performs a vector addition
	 *
	 * Params:
	 * vec - vec3, first operand
	 * vec2 - vec3, second operand
	 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
	 *
	 * Returns:
	 * dest if specified, vec otherwise
	 */
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
	/*
	 * vec3.subtract
	 * Performs a vector subtraction
	 *
	 * Params:
	 * vec - vec3, first operand
	 * vec2 - vec3, second operand
	 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
	 *
	 * Returns:
	 * dest if specified, vec otherwise
	 */
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

	/*
	 * vec3.negate
	 * Negates the components of a vec3
	 *
	 * Params:
	 * vec - vec3 to negate
	 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
	 *
	 * Returns:
	 * dest if specified, vec otherwise
	 */
	vec2.negate = function(vec, dest) {
		if(!dest) { dest = vec; }
		
		dest[0] = -vec[0];
		dest[1] = -vec[1];
		//dest[2] = -vec[2];
		return dest;
	};

	/*
	 * vec3.scale
	 * Multiplies the components of a vec3 by a scalar value
	 *
	 * Params:
	 * vec - vec3 to scale
	 * val - Numeric value to scale by
	 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
	 *
	 * Returns:
	 * dest if specified, vec otherwise
	 */
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
	/*
	 * vec3.normalize
	 * Generates a unit vector of the same direction as the provided vec3
	 * If vector length is 0, returns [0, 0, 0]
	 *
	 * Params:
	 * vec - vec3 to normalize
	 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
	 *
	 * Returns:
	 * dest if specified, vec otherwise
	 */
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

	/*
	 * vec3.cross
	 * Generates the cross product of two vec3s
	 *
	 * Params:
	 * vec - vec3, first operand
	 * vec2 - vec3, second operand
	 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
	 *
	 * Returns:
	 * dest if specified, vec otherwise
	 */
	vec2.cross = function(vec, vec2, dest){
		if(!dest) { dest = vec; }
		
		var x = vec[0], y = vec[1];//, z = vec[2];
		var x2 = vec2[0], y2 = vec2[1];//, z2 = vec2[2];
		
		dest[0] = x*y2 - x2*y;
		//dest[1] = z*x2 - x*z2;
		//dest[2] = x*y2 - y*x2;
		return dest;
	};

	/*
	 * vec3.length
	 * Caclulates the length of a vec3
	 *
	 * Params:
	 * vec - vec3 to calculate length of
	 *
	 * Returns:
	 * Length of vec
	 */
	vec2.length = function(vec){
		var x = vec[0], y = vec[1];//, z = vec[2];
		return Math.sqrt(x*x + y*y);
	};


	vec2.dist = function(vec, vec2){
		var dx = vec[0] - vec2[0];
		var dy = vec[1] - vec2[1];
		return Math.sqrt(dx*dx + dy*dy);
	};

	/*
	 * vec3.dot
	 * Caclulates the dot product of two vec3s
	 *
	 * Params:
	 * vec - vec3, first operand
	 * vec2 - vec3, second operand
	 *
	 * Returns:
	 * Dot product of vec and vec2
	 */
	vec2.dot = function(vec, vec2){
		return vec[0]*vec2[0] + vec[1]*vec2[1];// + vec[2]*vec2[2];
	};

	/*
	 * vec3.direction
	 * Generates a unit vector pointing from one vector to another
	 *
	 * Params:
	 * vec - origin vec3
	 * vec2 - vec3 to point to
	 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
	 *
	 * Returns:
	 * dest if specified, vec otherwise
	 */
	vec2.direction = function(vec, vec2, dest) {
		if(!dest) { dest = vec; }
		
		var x = vec[0] - vec2[0];
		var y = vec[1] - vec2[1];
		//var z = vec[2] - vec2[2];
		
		var len = Math.sqrt(x*x + y*y);
		if (!len) { 
			dest[0] = 0; 
			dest[1] = 0; 
			//dest[2] = 0;
			return dest; 
		}
		
		len = 1 / len;
		dest[0] = x * len; 
		dest[1] = y * len; 
		//dest[2] = z * len;
		return dest; 
	};

	/*
	 * vec3.str
	 * Returns a string representation of a vector
	 *
	 * Params:
	 * vec - vec3 to represent as a string
	 *
	 * Returns:
	 * string representation of vec
	 */
	vec2.str = function(vec) {
		return '[' + vec[0] + ', ' + vec[1] + ']'; 
	};

	vec2.rotate = function(t, vec, dest) {
		var R, x, y;
		if(!dest){ dest = vec;}
		R = new mat2.rotM(t);
		x = vec[0];
		y = vec[1];
		dest[0] = R[0] * x + R[1] * y;
		dest[1] = R[2] * x + R[3] * y;
		return dest;
	};

	vec2.rotateV = function(vec, vec2, dest)
	{
		if(!dest){dest = vec;}
		dest[0] = vec[0]*vec2[0] - vec[1]*vec2[1];
		dest[1] = vec[0]*vec2[1] + vec[1]*vec2[0];

		return dest;
	};

	/*
	 * mat3 - 3x3 Matrix
	 */
	v2.mat2 = {};
	//mat2 = v2.mat2;
	var mat2 = {};
	var mat3 = {};

	/*
	 * mat3.create
	 * Creates a new instance of a mat3 using the default array type
	 * Any javascript array containing at least 9 numeric elements can serve as a mat3
	 *
	 * Params:
	 * mat - Optional, mat3 containing values to initialize with
	 *
	 * Returns:
	 * New mat3
	 */
	mat2.create = function(mat) {
		var dest = new glMatrixArrayType(4);
		
		if(mat) {
			dest[0] = mat[0];
			dest[1] = mat[1];
			dest[2] = mat[2];
			dest[3] = mat[3];
			//dest[4] = mat[4];
			//dest[5] = mat[5];
			//dest[6] = mat[6];
			//dest[7] = mat[7];
			//dest[8] = mat[8];
			//dest[9] = mat[9];
		}
		
		return dest;
	};

	/*
	 * mat3.set
	 * Copies the values of one mat3 to another
	 *
	 * Params:
	 * mat - mat3 containing values to copy
	 * dest - mat3 receiving copied values
	 *
	 * Returns:
	 * dest
	 */
	mat2.set = function(mat, dest) {
		dest[0] = mat[0];
		dest[1] = mat[1];
		dest[2] = mat[2];
		dest[3] = mat[3];
		//dest[4] = mat[4];
		//dest[5] = mat[5];
		//dest[6] = mat[6];
		//dest[7] = mat[7];
		//dest[8] = mat[8];
		return dest;
	};

	/*
	 * mat3.identity
	 * Sets a mat3 to an identity matrix
	 *
	 * Params:
	 * dest - mat3 to set
	 *
	 * Returns:
	 * dest
	 */
	mat2.identity = function(dest) {
		dest[0] = 1;
		dest[1] = 0;
		dest[2] = 1;
		dest[3] = 0;
		//dest[4] = 1;
		//dest[5] = 0;
		//dest[6] = 0;
		//dest[7] = 0;
		//dest[8] = 1;
		return dest;
	};

	// Rotation matrix about some axis. If no axis is
	// supplied, assume we're after a 2D transform
	mat2.rotM = function(theta) {
		return mat2.create([Math.cos(theta),  -Math.sin(theta), Math.sin(theta),   Math.cos(theta)]);
	  //var axis = a.dup();
	  //if (axis.elements.length != 3) { return null; }
	  //var mod = axis.modulus();
	  //var x = axis.elements[0]/mod, y = axis.elements[1]/mod, z = axis.elements[2]/mod;
	  //var s = Math.sin(theta), c = Math.cos(theta), t = 1 - c;
	  //// Formula derived here: http://www.gamedev.net/reference/articles/article1199.asp
	  //// That proof rotates the co-ordinate system so theta
	  //// becomes -theta and sin becomes -sin here.
	  //return Matrix.create([
		//[ t*x*x + c, t*x*y - s*z, t*x*z + s*y ],
		//[ t*x*y + s*z, t*y*y + c, t*y*z - s*x ],
		//[ t*x*z - s*y, t*y*z + s*x, t*z*z + c ]
	  //]);
	};


	mat2.mulV = function(vec, R, dest) {
		//var R, x, y;
		if(!dest) dest = vec;
		//R = new mat2.rotation(t);
		x = vec[0];
		y = vec[1];
		dest[0] = R[0] * x + R[1] * y;
		dest[1] = R[2] * x + R[3] * y;
		return dest;
	}


	return v2;

});
	








require.def('kgd/world/Thing', ['../consts', '../aux', '../client', '../maths/v2'], function(consts, aux, client, v2){

	Thing = function(world, params){
		if (typeof(params.m) == 'undefined'){params.m = 1;}
		this.world = world;
		this.context = world.context;
		this.p = v2.vec2.create([params.x, params.y]);
		this.dp =v2.vec2.create([params.dx, params.dy]);
		aux.setObjParam(this, params, 'dir', v2.vec2.create([1,0]));
		aux.setObjParam(this, params, 'speed', 0);
		this.m = params.m;
		this.f = v2.vec2.create([0,0]);
		this.radius = 10;
		this.active = true;
		aux.setObjParam(this, params, 'color', world.FOREGROUND_COLOR);
		aux.setObjParam(this, params, 'parent', null);
		this.id = world.generateId();
	};

	Thing.prototype = {
		update: function(dt){
			v2.vec2.add(this.p, v2.vec2.scale(this.dp, dt, v2.vec2.create([0, 0])));
			v2.vec2.add(this.dp, v2.vec2.scale(this.f, dt/this.m, v2.vec2.create([0, 0])));
			//this.p = this.p.add(this.dp.x(dt));
			//this.dp = this.dp.add(this.f.x(dt/this.m));
		},

		draw: function(){
			ctx = this.context;
			ctx.strokeStyle = this.world.FOREGROUND_COLOR;
			ctx.fillStyle = this.world.FOREGROUND_COLOR;
			ctx.beginPath();
			ctx.arc(this.p[0], this.p[1], Math.sqrt(this.m*this.world.thingDrawCoeff), 0, Math.PI*2, true);
			//ctx.arc(0, 0, 100, 0, Math.PI*2, true);
			ctx.closePath();
			ctx.stroke();
			//ctx.fill();
		},

		getPos: function(){
			if(this.parent){
				return this.parent.p;
			}
			return this.p;
		},

		placeRandomly: function(){
			this.dp[0] = 0;
			this.dp[1] = 0;
			this.p[0] = 2.0*(Math.random()-0.5)*this.world.dim[0];
			this.p[1] = 2.0*(Math.random()-0.5)*this.world.dim[1];
		}, 

		containsPos: function(pos){
			var d = v2.vec2.dist(this.p, pos);
			if(d < this.radius){ return d; }
			return false;
		}

	};

	Thing.Breadcrumb = function(){
		this.p = vec2.create();
		this.dp = vec2.create();
		this.nxt = null;
		this.prv = null;
	};

	Thing.Breadcrumb.prototype.set = function(p, dp){
		v2.vec2.set(p, this.p);
		v2.vec2.set(dp, this.dp);
	};

	Thing.Breadcrumb.prototype.connect = function(bc){
		this.nxt = bc;
		bc.prv = this;
	};

	Thing.Trail = function(l){
		this.length = l;
		this.head = new Thing.Breadcrumb();
		this.head.name = 'head';
		var bcp = new Thing.Breadcrumb();
		this.head.connect(bcp);

		for(var i=0; i<l; i++){
			var bc = new Thing.Breadcrumb();
			bc.name = i;
			bcp.connect(bc);
			bcp = bc;
		}

		bcp.connect(this.head);

		l = 8;
	};

	Thing.Trail.prototype.add = function(p, dp){
		this.head = this.head.next;
		this.head.set(p, dp);
	};

	return Thing;

});
require.def('kgd/world/signals', ['../core', '../consts', '../aux', './Thing'], function(core, consts, aux, Thing){ 

	signals = {};

	signals.Light = function(world, params){
		Thing.call(this, world, params);
		this.colorRGB = consts.LIGHT_RGB;
		this.I = params.I;
		this.state = consts.ON;
		this.radius = 2;
	}


	signals.Light.prototype = {
		draw: function(){
			ctx = this.context;
			ctx.save();
			ctx.fillStyle = aux.getColorFromRGB(this.colorRGB, 1);
			ctx.beginPath();
			p = this.getPos();
			ctx.arc(p[0], p[1], this.radius, 0, Math.PI*2, true);
			ctx.fill();
			ctx.restore();
		} 
	}

	core.extend(signals.Light, Thing);

	return signals;
});
require.def('kgd/world/vehicle/sensors', ['../../core', '../../aux', '../../consts', '../../maths/v2'], function(core, aux, consts, v2){
	sensors = {};

	sensors.Sensor = function(vehicle, params){
		this.vehicle = vehicle;
		this.world = vehicle.world;
		this.rot = aux.degToRad(params.rot);
		this.length = params.length;
		this.offset = v2.vec2.createFromRot(this.rot, this.length);
		this.p = v2.vec2.create();
		this.act = 0;
		this.colorRGB = consts.DEFAULT_SENSOR_RGB;
		this.color = aux.getColorFromRGB(this.colorRGB, 1);
	}

	sensors.Sensor.prototype = {
		draw: function(){
			ctx = this.vehicle.context;
			ctx.strokeStyle = this.color;
			ctx.fillStyle = this.color;
			ctx.beginPath();
			// sensor lines
			ctx.beginPath();
			ctx.moveTo(this.offset[0], this.offset[1]);
			ctx.lineTo(0,0);
			ctx.stroke();
			// sensor bulbs
			ctx.globalAlpha = this.act;
			ctx.fillStyle = consts.LIGHT_COLOR;
			ctx.beginPath();
			ctx.arc(this.offset[0], this.offset[1], this.act*this.world.vDrawBulbFF, 0, Math.PI*2, true);
			ctx.fill();
			ctx.globalAlpha = 1;
		},

		update: function(){}
	}

	sensors.LightSensor = function(vehicle, params){
		sensors.Sensor.call(this, vehicle, params);
		this.colorRGB = consts.LIGHT_RGB;
		this.color = aux.getColorFromRGB(this.colorRGB);

	}

	sensors.LightSensor.prototype = {
		update: function(){
			var s_dir = v2.vec2.create();
			v2.vec2.rotateV(this.offset, this.vehicle.dir, s_dir);
			for(var i=0; i<this.world.lights.length; i++){
				l = this.world.lights[i];
					//for(var k=0; k<v.sensors.length; k++){
				//s = v.sensors[k];
				//var s_dir = v2.vec2.create([0,0]);
				//mat2.mulV(s.offset, v_rotM, s_dir);
				if(this.vehicle == l.parent){ continue; }
				var v_to_l = this.vehicle.cachedGeom[l.id].to_o;
				var dist = this.vehicle.cachedGeom[l.id].dist;
				var s_dot_l = v2.vec2.dot(s_dir, v_to_l);
				var theta = Math.atan2(v_to_l[1]*s_dir[0]-s_dir[1]*v_to_l[0], s_dot_l);
				theta = Math.abs(theta);
				if(theta > this.world.vVisibleAngle){
					this.act += 0; 
				}
				else if(this.world.vRecInputFactorL > 0){
					this.act += l.I * (this.world.vVisibleAngle - theta)/Math.pow(dist, this.world.vRecInputFactorL);
				}
				else{
					this.act += this.world.vVisibleAngle - theta;
				}
			}
		}
	}

	core.extend(sensors.LightSensor, sensors.Sensor);


	sensors.Whisker = function(vehicle, params){
		sensors.Sensor.call(this, vehicle, params);
	}

	sensors.Whisker.prototype = {
		update: function(){
			this.testForContacts(this.world.shapes, this.vehicle.p, this.vehicle.dir);
		},

		testForContacts: function(shapes, startPt, dir){
			//--- first rotate whisker by robot dir to create new line
			this.act = 0;
			var endPt = new v2.vec2.create(); 
			var offset_g = new v2.vec2.create();

			v2.vec2.rotateV(this.offset, dir, offset_g);
			endPt[0] = startPt[0] + offset_g[0];
			endPt[1] = startPt[1] + offset_g[1];

			for(var i=0; i<shapes.length; i++){
				alpha = shapes[i].whiskerContact( startPt, endPt);
				if(alpha)
				{
					if( alpha > this.act )
						this.act = alpha;
				}
			}
		},


		testForContactBeer: function(shape, startPt )
		{
			var endPt = new v2.vec2.create();
			endPt[0] = startPt[0] + this.offset[0];
			endPt[1] = startPt[1] + this.offset[1];

			var act=0;
			if( shape.whiskerContact( startPt, endPt, act ) )
			{
				if( act > this.act )
					this.act = act;
			}
		},

		draw: function(){
			ctx = this.vehicle.context;
			ctx.strokeStyle = this.color;
			ctx.fillStyle = this.color;
			var endPt = v2.vec2.create();
			v2.vec2.scale(this.offset, 1-this.act, endPt);
			// sensor lines
			ctx.beginPath();
			ctx.moveTo(endPt[0], endPt[1]);
			ctx.lineTo(0,0);
			ctx.stroke();
			// sensor bulbs
			//ctx.globalAlpha = this.act;
			ctx.fillStyle = consts.LIGHT_COLOR;
			ctx.beginPath();
			ctx.arc(endPt[0], endPt[1], this.act*this.world.vDrawBulbFF, 0, Math.PI*2, true);
			ctx.fill();
			//ctx.globalAlpha = 1;
		}

	}

	core.extend(sensors.Whisker, sensors.Sensor);

	return sensors;
});
require.def('kgd/world/vehicle/Vehicle', ['../../core', '../../consts', '../Thing', './sensors', '../../maths/v2'], function(core, consts, Thing, sensors, v2){

	Vehicle = function(world, params){
		Thing.call(this, world, params);
		
		this.rotVel = 0;
		this.sensorLength = 7;
		this.I = 1;
		this.lightFlag = false;
		this.sensorVL = new sensors.LightSensor(this, {rot:consts.DEFAULT_SENSOR_ANGLE, length:this.sensorLength});
		this.sensorVR = new sensors.LightSensor(this, {rot:-consts.DEFAULT_SENSOR_ANGLE, length:this.sensorLength});
		this.sensors = [this.sensorVL, this.sensorVR];
		this.cachedGeom = {};
		this.active = true;
	}

	Vehicle.prototype = {
		draw: function(){
			theta = Math.atan2(this.dir[1], this.dir[0]);
			ctx = this.context;
			ctx.save();
			//ctx.translate(this.p[0]+this.world.origin[0], this.p[1]+this.world.origin[1]);
			ctx.translate(this.p[0], this.p[1]);
			ctx.rotate((Math.PI * 2) + theta);
			ctx.strokeStyle = this.world.FOREGROUND_COLOR;
			ctx.fillStyle = this.world.FOREGROUND_COLOR;
			ctx.lineWidth = 0.1;
			ctx.beginPath();
			ctx.moveTo(1,0);
			ctx.lineTo(-4,-5);
			ctx.bezierCurveTo(-1, -2, -1, 2, -4, 5);
			ctx.lineTo(1,0);
			ctx.fill();
			for(var i=0; i<this.sensors.length; i++){
				this.sensors[i].draw();
			}
			ctx.restore();
			//if(aux.containsArrObj(this.world.lights, this)){
				//World.Light.prototype.draw.call(this);
			//}
		},

		update: function(dt){
			// first cache distances and directions
			for(var i=0; i<this.world.objects.length; i++){
				o = this.world.objects[i];
				var v_to_o = v2.vec2.subtract2(o.getPos(), this.p, v2.vec2.create([0, 0]));
				var d = v2.vec2.length(v_to_o);
				//if(d < 0.000001){
					//console.log('ooooppss');
				//}
				this.cachedGeom[o.id] = {to_o:v_to_o, dist:d};
			} 
				
			// update my sensors
			for(var i=0; i < this.sensors.length; i++){
				this.sensors[i].act = 0;
				this.sensors[i].update();
			}

			var vComp = this.world.vVelFudgeFactor*(this.sensorVL.act + this.sensorVR.act)/2;
			var rComp = (this.sensorVL.act - this.sensorVR.act)/this.world.vDiam;

			// randomize the outputs
			vComp *= (1.0 + (Math.random()-0.5)*this.world.vOutputNoise);
			rComp *= (1.0 + (Math.random()-0.5)*this.world.vOutputNoise);

			//v2.vec2.scale(this.dp, (1+vComp*dt)*this.world.vDampingVel);
			this.speed  += vComp*dt;
			this.rotVel += rComp*dt;
			this.speed  *= this.world.vDampingVel;
			this.rotVel *= this.world.vDampingRot;
		
			// gate vel
			//var s = v2.vec2.length(v.dp);
			if(this.speed > this.world.vMaxSpeed){
				this.speed = this.world.vMaxSpeed;
				//v2.vec2.scale(v.dp, this.vMaxSpeed/s);
			}

			if(this.active){
				v2.vec2.add(this.p, v2.vec2.scale2(this.dir, this.speed*dt,  v2.vec2.create(0, 0))); 
				v2.vec2.rotate(this.rotVel*dt, this.dir);
				// torroidal
				this.world.toroidalWrap(this.p);
			}

		}

	}
	core.extend(Vehicle, Thing);

	return Vehicle;
});
require.def('kgd/world/World', ['../consts', '../aux', '../client', '../maths/v2', './signals', './vehicle/Vehicle'], function(consts, aux, client, v2, signals, Vehicle){
	consts.DEFAULT_SENSOR_COLOR = 'rgb(0,255,0)'; 
	consts.DEFAULT_SENSOR_RGB = [255, 0, 0];
	consts.DEFAULT_FOREGROUND_RGB = [255, 255, 255];
	consts.DEFAULT_BACKGROUND_RGB = [0, 0, 0];

	consts.LIGHT_COLOR = 'rgb(255,233,0)'; 
	consts.LIGHT_RGB = [255,233,0]; 

	World = function(){
		this.canvas = null;
		this.context = null;
		this.origin = v2.vec2.create([0,0]);
		this.dim = v2.vec2.create([400, 400]);
		this.dimx2 = null;
		this.ppm = 1;
		this.objects = [];
		this.selectedObject = null;
		this.physics_dt = 0.1;
		this.mouseDownPos = null;
		this.mousePos = new v2.vec2.create([0,0]);
		this.mouseState = null;
		this.BACKGROUND_COLOR = 'rgb(0,0,0)';
		this.FOREGROUND_COLOR = 'rgb(255,255,255)';
		this.MASS_DRAW_COEFF = 0.5;
		this.MASS_DEFAULT = 1;
		this.SPEED_INIT = 1;
		this.thingDrawCoeff = 1;

		// for simplicities sake:
		this.vehicles = [];
		this.lights = [];
		this.shapes = [];

		this.VehicleType = Vehicle;
		this.LightType = signals.Light;

		this.idCount = 0;
	};

	World.prototype = {
		setApp: function(app){
			this.app = app;
			this.canvas = app.canvas;
			this.context = app.context;
			// Using a quadrant scheme with origin at centre
			this.dim = v2.vec2.create([app.canvas.width/(2*this.ppm), app.canvas.height/(2*this.ppm)]);
			this.dimx2 = this.dim[0]*2;
			this.origin = v2.vec2.create([this.dim[0], this.dim[1]]);
			this.context.scale(this.ppm, this.ppm);
			//this.context.lineWidth = 0.1;
			this.context.translate(this.origin[0], this.origin[1]);
		},

		update: function(dt){
			var updates = dt/this.physics_dt;
			for(var i=0; i<updates; i++){
				this.updateCycle(this.physics_dt);
			}
		},

		updateCycle: function(dt){
			for(var i=0; i<this.objects.length; i++){
				this.objects[i].update(dt);
			}
		},

		generateId: function(){
			var id = this.idCount++;
			return id;
		},

		draw: function(){
			for(var i=0; i<this.objects.length; i++){
				this.objects[i].draw();
			}
		},

		screenStats: function(){},
			//ctx = this.context;
			//ctx.save();
			//ctx.scale(1/this.ppm, 1/this.ppm)
			//ctx.fillStyle    = '#fff';
			//ctx.font         = '10px sans-serif';
			//ctx.textBaseline = 'top';
			//ctx.fillText  (aux.coordString(this.mousePos, 'Mouse:'), 8-this.dim[0], 8-this.dim[1]);
			//ctx.fillText  ('Body count: ' + this.objects.length, 8-this.dim[0], 18-this.dim[1]);
			//ctx.restore();
		//},

		clearScreen: function(){
			this.context.fillStyle = this.BACKGROUND_COLOR;
			this.context.strokeStyle = this.FOREGROUND_COLOR;
			this.context.fillRect(-this.origin[0], -this.origin[1], this.canvas.width, this.canvas.height);
		},


		keyDown: function(event){
			var k = client.DEFAULT_KEY_CODES[event.keyCode];
			switch(k){
			case '-1':
				break;
				//case '0': case '1': case '2': case '3':
			default:
				console.log('Switching to world state ' + k);
				this.setUp(k);
				//this.app.FSM.state = 'waiting';
				break;
			}
		},

		mouseDown: function(e){},

		mouseUp: function(e){},

		mouseMove: function(e){
			this.mousePos[0] = e.layerX;
			this.mousePos[1] = e.layerY;
			//client.setMouseCoords(this.mousePos, e, this.canvas);
			this.canvasToWorldCoords(this.mousePos);
		},

		canvasToWorldCoords: function(cc){
			v2.vec2.scale(cc, 1/this.ppm);
			v2.vec2.subtract(cc, this.dim);
		},

		getObjectAtMouse: function(){
			this.selectedObject = null;
			var closestDist = Number.MAX_VALUE;
			for(var i=0; i<this.objects.length; i++){
				o = this.objects[i];
				d = o.containsPos(this.mousePos);
				if(d !== false && d < closestDist){
					closestDist = d;
					this.selectedObject = o;
				}
			}
			return this.selectedObject;
		},


		setUp: function(k){
			
		},

		toroidalWrap: function(v){
			var x = v[0];
			var y = v[1];
			if(x > this.dim[0]){
				x -= this.dimx2;
				v[0] = x;
			}
			else if(x < -this.dim[0]){
				x += this.dimx2;
				v[0] = x;
			}

			if(y > this.dim[1]){
				y -= this.dimx2;
				v[1] = y;
			}
			else if(y < -this.dim[0]){
				y += this.dimx2;
				v[1] = y;
			}
		},


		// utility methods - could be sub-prototyped
		addVehicle: function(params){
			if(typeof params === 'undefined'){
				params = aux.getRandomPVM(null, this.dim[0], 1, 1);
			}
			v = new this.VehicleType(this, params);
			this.vehicles.push(v);
			this.objects.push(v);
			return v;
		},

		addLight: function(params){
			if(typeof params === 'undefined'){
				params = aux.getRandomPVM(null, this.dim[0], 1, 1);
			}
			l = new this.LightType(this, params);
			this.lights.push(l);
			this.objects.push(l);
			return l;
		},

		addLightVehicle: function(params){
			if(typeof params === 'undefined'){
				params = aux.getRandomPVM(null, this.dim[0], 1, 1);
				params.I = 1.0;
			}
			v = this.addVehicle(params);
			l = this.addLight(params);
			l.parent = v;
			v.light = l;
			return v;
		}
	};

	return World;

});
require.def('kgd/simpleApp/SimpleApp', ['../consts', '../aux', '../client'], function(consts, aux, client){

	SimpleApp = function(){
		//this.world = new com.World(this.canvas);
		app = this;
		/** the current activity, e.g. main menu, game etc. **/
		this.world = null;
		/** last frame time **/
		this.lastFrameTime = Date.now();
		this.thisFrameTime;
		this.elapsedTime;
		/** delta time in seconds **/
		this.delta = 0;
		this.pauseFlag = false;
		this.timer = null;
		this.fps = 30;
		this.mainLoopId;
		this.loggingFlag = false;
		this.sliders = [];

		document.onkeydown = function(e){
			app.keyDown(e);
		};

		$('#mycanvas').mousedown(function(e){
			app.world.mouseDown(e);
		});

		$('#mycanvas').mouseup(function(e){
			app.world.mouseUp(e);
		});

		$('#mycanvas').mousemove(function(e){
			app.world.mouseMove(e);
		});


		//document.onmousemove = function(event){
			//app.world.mouseMove(event);
		//};


	}

	SimpleApp.prototype = {
		init: function(world){
			this.FSM = new SimpleApp.FSM(this);
			this.canvas = document.getElementById('mycanvas');
			this.context = this.canvas.getContext('2d');
			this.context.fillStyle = world.BACKGROUND_COLOR;
			this.context.strokeStyle = world.FOREGROUND_COLOR;
			client.Text.context = this.context;
			client.Text.ppm = world.ppm;
			client.Text.face = vector_battle;
			this.setWorld(world);
			app = this;
			this.mainLoopId = setInterval(function(){app.mainLoop();}, 1000/app.fps);
		},

		setWorld: function(world){
			this.world = world;
			this.world.setApp(this);
		},	

		mainLoop: function(){
			// clear screen 
			this.world.clearScreen();
			this.FSM.execute();
			this.world.screenStats();

			this.thisFrameTime = Date.now();
			this.elapsedTime = this.thisFrameTime - this.lastFrameTime;
			this.lastFrameTime = this.thisFrameTime;
			this.delta = this.elapsedTime / 1000;
			this.log('In the Mainloop with delta ' + this.delta);

			//this.onMainLoop();
		},

		onBoot: function(){
			this.world.init();
		},
		onWaiting: function(){
			client.Text.renderText(window.ipad ? 'Touch Screen to Start' : 'Press Space to Start', 24, this.canvas.width/2 - 187, this.canvas.height/2);
			if (client.KEY_STATUS.space || window.gameStart) {
				client.KEY_STATUS.space = false; // hack so we don't shoot right away
				window.gameStart = false;
				this.state = 'start';
			}
		},
		onStart: function(){},
		onRun: function(){
			this.world.update(this.delta);
			this.world.draw();
		},
		onStop: function(){},
		onPaused: function(){
			client.Text.renderText(window.ipad ? 'Touch Screen to Start' : 'Simple App is Paused', 24, this.canvas.width/2 - 270, this.canvas.height/2);
		},
		
		keyDown: function(e){
			var k = client.DEFAULT_KEY_CODES[e.keyCode];
			switch(k){
			case 'space':
				this.FSM.state = 'start';
				break;
			case 'p': // pause
				if (this.mainLoopId) {
					clearInterval(this.mainLoopId);
					this.mainLoopId = null;
					client.Text.renderText('PAUSED', 72, this.canvas.width/2 - 160, 120);
				} else {
					this.lastFrameTime = Date.now();
					var that = this;
					this.mainLoopId = setInterval(function(){that.mainLoop()}, 10);
				}
				break;
			default:
				this.world.keyDown(e);
				break;
			}
		},

		keyUp: function(e){},
		mouseDown: function(e){},
		mouseUp: function(e){},
		log: function(str){
			if(this.loggingFlag){
				console.log(str);
			}
		},

		addOptions: function(selector, options, fn){
			var container = $('#' + selector);
			for(name in options){
				opt = options[name];
				container.append("<option value='" + name + "'>" + opt.title + "</option>");
			}

			$('#' + selector).change(fn);
		},

		addSlider: function(wld, vr,  label, min, max, fn){
			var id_num = this.sliders.length;
			var isFloatFlag = false;
			min_sl = min;
			max_sl = max;
			live_var_sl = wld[vr];
			if(aux.isFloat(max)){
				isFloatFlag = true;
				min_sl = 0;
				max_sl = 350;
				live_var_sl = 350*((live_var_sl-min)/(max-min));
			}
			var container = $("<div class='slider_box'></div>");
			var slider_div = $('<p><label for="slider_out_' +id_num+'">'+ label +':</label><input type="text" id="slider_out_'+ id_num +'" style="border:0; color:#f6931f; font-weight:bold;" /></p><div id="sliderbar_'+id_num+'"></div>');
			container.append(slider_div);
			cp = $('#control_panel');
			cp.append(container);
			var sb = $("#sliderbar_"+id_num).slider({
					//orientation: "vertical",
					range: "min",
					min: min_sl,
					max: max_sl,
					value: live_var_sl,
					slide: function(event, ui) {
						if(isFloatFlag){
							wld[vr] = min + (ui.value/350)*(max-min);
						}
						else{
							wld[vr] = ui.value;
						}
						$("#slider_out_"+id_num).val(wld[vr]);
						if(fn){
							fn(wld[vr]);
						}
						console.log(label + ' set to ' + wld[vr]);

					}
				});
			$("#slider_out_"+id_num).val(wld[vr]);

			this.sliders.push(sb);

		},

		addDOMElementWithCallback: function(panel, cname, el, cb){
			var container = $("<div class='" + cname + "'></div>");
			var element = $(el);
			container.append(element);
			var cp = $(panel);
			cp.append(container);
			$(element).click(cb);
		}
		

	}


	SimpleApp.FSM = function(app){

		this.app = app;
		this.state = 'boot';
	}

	SimpleApp.FSM.prototype = {
		execute: function(){
			this[this.state]();
		},

		boot: function(){
			this.app.onBoot();
			this.state = 'waiting';
		},

		waiting: function(){
			this.app.log('FSM: waiting ');
			this.app.onWaiting();
		},

		start: function(){
			this.app.onStart();
			this.state = 'run';
		},

		run: function(){
			this.app.onRun();
		},

		stop: function(){
			this.app.onStop();
		},
		
		paused: function(){
			this.app.onPaused();
		}
	}

	return SimpleApp;

});

// examples of use:
// tk = Tasketter();
// tk.addProject({key:'pA', title:'some project', width:200, height:150});
// task = tk.addTaskToProject({key:'tA', title='some task', width:100, height:50});
// /* to tether task by elastic to point in environment */
// task.addTether(200, 200);
// task.removeTether();
// /* to (un)fix in place */
// task.fix();
// /* to remove/replace use the 'active' boolean */
// task.active = true/false;
// /* For walls, use top, bottom, left and right to specify position and wallsFlag to turn on/off detection /*
// tk.right = 300;
// tk.top = 300;
// tk.wallsFlag = true;
// /* to set/animate task/project height and width: */
// task.setHeight(200);
// task.setWidth(200);

/*global vec2*/


//(function () {

var BIG_NUMBER = 999999,
// Default box sizes
	PROJECT_WIDTH = 150,
	PROJECT_HEIGHT = 75,
	TASK_WIDTH = 100,
	TASK_HEIGHT = 50;

function TaskNode(world, params) {
	//Thing.call(this, world, params);
	this.world = world;
	this.context = world.context;
	this.p = vec2.create([params.x, params.y]);
	this.dp = vec2.create([params.dx, params.dy]);
	this.f = vec2.create([0, 0]);
	this.tether = null;
	this.m = 1;
	this.key = params.key;
	this.title = params.title;
	this.width = params.width;
	this.height = params.height;
	this.offw = this.width / 2;
	this.offh = this.height / 2;
	this.links_to = [];
	this.links_from = [];
	this.active = true;
	this.fixed = false;
	this.MIN_DRAW_SIZE = 14;
	// add node key to world's dictionary
	world.nodesByKey[this.key] = this;
}

TaskNode.prototype = {
	getPos: function () {
		return {'x' : this.p[0], 'y' : this.p[1]};
	},

	setHeight: function (h) {
		this.height = h;
		this.offh = h / 2;
	},

	setWidth: function (w) {
		this.width = w;
		this.offw = w/2;
	},

	addTether: function(x, y){
		this.tether = vec2.create([x, y]);
	},

	removeTether: function(){
		this.tether = null;
	},

	placeRandomly: function(){
		this.dp[0] = 0;
		this.dp[1] = 0;
		this.p[0] = 2.0*(Math.random()-0.5)*this.world.dim[0];
		this.p[1] = 2.0*(Math.random()-0.5)*this.world.dim[1];
	}, 

	fix: function(){
		this.fixed = true;
	},

	unFix: function(){
		this.fixed = false;
	},

	makeCentralNode: function(){
		this.world.selectedObject = this;
		this.world.randomizeNodes();
		this.world.deactivateNodes();
		this.activateConnectedNodes();
		this.active = true;
		this.fixed = true;
		this.p[0] = 0;
		this.p[1] = 0;
	},

	activateConnectedNodes: function(){
		var l, i;
		for(i=0; i<this.links_from.length; i++){
			l = this.links_from[i];
			l.node.active = true;
		}

		for(i=0; i<this.links_to.length; i++){
			l = this.links_to[i];
			l.node.active = true;
		}
	},

	// Drawing methods redundant in headless tasket ---

	draw: function(){
		if(!this.active){return;}
		var ctx = this.context;
		ctx.strokeStyle = '#f00';
		ctx.strokeRect(this.p[0] - this.offw, this.p[1] - this.offh, this.width, this.height);
		ctx.font         = 'bold 12px sans-serif';
		ctx.fillStyle    = '#fff';
		ctx.fillText(this.title, this.p[0], this.p[1]);
		if(this.tether){
			ctx.moveTo(this.p[0], this.p[1]);
			ctx.lineTo(this.tether[0], this.tether[1]);
			ctx.stroke();
		}
	},

	drawLinks: function(){
		if(!this.active){return;}
		var i, n, l, ctx = this.context;
		ctx.beginPath();
		for(i=0; i<this.links_to.length; i++){
			l = this.links_to[i];

			n = l.node;
			if(!n.active){continue;}
			ctx.moveTo(n.p[0], n.p[1]);
			ctx.lineTo(this.p[0], this.p[1]);
		}
		ctx.stroke();
	}

};

//core.extend(TaskNode, Thing);

function ProjectNode(world, params){
	TaskNode.call(this, world, params);
}

ProjectNode.prototype = {
	draw: function(){
		if(!this.active){return;}
		var ctx = this.context;
		ctx.strokeStyle = '#00f';
		ctx.strokeRect(this.p[0] - this.offw, this.p[1] - this.offh, this.width, this.height);
		ctx.font         = 'bold 12px sans-serif';
		ctx.fillStyle    = '#fff';
		ctx.fillText(this.title, this.p[0], this.p[1]);
	}
};

function mozextend(child, supertype){
	child.prototype.__proto__ = supertype.prototype;
	child.prototype._super = supertype;
}

mozextend(ProjectNode, TaskNode);

function Link(node, value){
	this.node = node;
	this.value = value;
}

function Tasketter(){
	//World.call(this);
	// dim gives bounds for random node placement
	this.dim = vec2.create([100,100]);
	this.v2null = vec2.create([0,0]);
	this.nodes = [];
	this.objects = this.nodes;
	this.nodeIJs = [];
	this.physics_dt = 0.5;
	this.MASS_DRAW_COEFF = 4;
	this.inScaleFac = 0.75;
	this.inCoulombK = 100.0;
	this.inBBRepulsion = 60.0;
	this.inWallRepulsion = 120.0;
	this.inHookeK = 0.25;
	this.inHookeEquilib = 60;
	this.inVelDampK = 0.1;
	this.runningTime = 0;
	this.nodesByKey = {};
	this.context = null;
	this.top = BIG_NUMBER;
	this.bottom = -BIG_NUMBER;
	this.left = -BIG_NUMBER;
	this.right = BIG_NUMBER;
	this.wallsFlag = true;
}

Tasketter.prototype = {
	init: function(){
		//this.context.lineWidth = 1;

		this.parseData(this.projData);
		this.randomizeNodes();
		// ProjectNode 0 is fixed and central
		this.nodes[0].makeCentralNode();
	},

	//mergeParams: function(base, add){
		//var params = {};
		//for(p in base){params[p] = base[p];}
		//for(p in add){params[p] = add[p];}
		//return params;
	//},
	reset: function(){
		this.nodes.length = 0;
		this.nodeIJs.length = 0;
	},

	addProject: function(params){
		this.nodes.length = 0;
		this.nodeIJs.length = 0;
		
		// add a project node - fixed by default (index will be 0)
		this.nodes.push(new ProjectNode(this, $.extend({x:0, y:0, dx:0, dy:0, width:PROJECT_WIDTH, height:PROJECT_HEIGHT},params)));
		this.nodeIJs.push({});
		this.nodes[0].fixed = true;
		return this.nodes[0];
	},


	addTask: function(params){
		var task = new TaskNode(this, $.extend({x:0, y:0, dx:0, dy:0, width:TASK_WIDTH, height:TASK_HEIGHT}, params));
		this.nodes.push(task);
		this.nodeIJs.push({});
		return task;
	},

	addTaskToProject: function(params, pKey){
		var pNode, node;
		if(typeof pKey === 'undefined'){
			pNode = this.nodes[0];
		}
		else{
			pNode = this.nodesByKey[pKey];
		}

		node = this.addTask(params);
		this.addLink({target:node.key, source:pNode.key, value:1});
		return node;
	},

	getTask: function(key){
		return this.nodesByKey[key];
	},

	hideTask: function(key){
		this.nodesByKey[key].active = false;
	},

	parseData: function(data){
		var i, l, h;
		this.addProject(data);

		// add task nodes - indexed from 1 to t+1
		for(i=0; i<data.tasks.length; i++){
			this.nodes.push(new TaskNode(this, $.extend({x:0, y:(i+1)*50, dx:0, dy:0}, data.tasks[i])));
			this.nodeIJs.push({});
		}

		// by default link all tasks to project - can be overridden in data-file
		if(typeof data.links === 'undefined'){
			data.links = [];
			for(i=0; i<data.tasks.length; i++){
				data.links.push({'source':data.key, 'target':data.tasks[i].key, 'value':1});
			}
		}

		for(i=0; i<data.links.length; i++){
			l = data.links[i];
			this.addLink(l);
		}
	},

	// links specified by key
	addLink:  function(l){	
		var target_i, source_i, h, nij;
		target_i = this.nodes.indexOf(this.nodesByKey[l.target]);
		source_i = this.nodes.indexOf(this.nodesByKey[l.source]);
		this.nodes[target_i].links_to.push(new Link(this.nodes[source_i], l.value));
		this.nodes[source_i].links_from.push(new Link(this.nodes[target_i], l.value));
		if(target_i > source_i){
			h = target_i;
			l = source_i;
		}
		else{
			h = source_i;
			l = target_i;
		}
		nij = this.nodeIJs[l][h];
		if(nij){
			this.nodeIJs[l][h] +=1;
		}
		else{
			this.nodeIJs[l][h] = 1;
		}

	},

	randomizeNodes: function(){
		var i, n;
		for(i=0; i<this.nodes.length; i++){
			n = this.nodes[i];
			n.placeRandomly();
		}
	},

	deactivateNodes: function(){
		var i, n;
		for(i=0; i<this.nodes.length; i++){
			n = this.nodes[i];
			n.active = false;
			n.fixed = false;
		}
	},
			
	getProjBBox: function(){
		var bot_left = vec2.create([9999999,9999999]),
			top_right = vec2.create([-9999999, -9999999]),
			i, n_i;

		for(i=0; i<this.objects.length; i++){
			n_i = this.nodes[i];
			bot_left[0] = Math.min(bot_left[0], n_i.p[0] - n_i.offw);
			bot_left[1] = Math.min(bot_left[1], n_i.p[1] - n_i.offh);
			top_right[0] = Math.max(top_right[0], n_i.p[0] + n_i.offw);
			top_right[1] = Math.max(top_right[1], n_i.p[1] + n_i.offh);
		}

		return [bot_left, top_right];
	},

	benchmark: function(t, dt){
		var i, t0 = new Date().getTime();
		for(i=0; i<t; i+=dt){
			this.updateCycle(dt);
		}

		console.debug(new Date().getTime() - t0 + 'ms');

		return;
	},

	updateCycle: function(dt){
		var i, j, p_i, p_j, nij, hf, cf, f, r, d,
			tr, td, thf, tf,
			px, py, w, h, dpdt, fdt;
		this.runningTime += dt;
		for(i=0; i<this.nodes.length; i++){
			//this.nodes[i].f.setElements([0,0]);
			vec2.set(this.v2null, this.nodes[i].f);
		}

		for(i=0; i<this.nodes.length; i++){
			p_i = this.nodes[i];
			if(p_i.active){
				for(j=i+1; j<this.nodes.length; j++){
					p_j = this.nodes[j];
					if(p_j.active){
						r = vec2.subtract2(p_j.p, p_i.p, vec2.create([0,0]));
						// we add a small ammount to d to prevent division by 0
						d = vec2.length(r) + 0.01;
						// First calculate Coulomb repulsion
						// var cf = p_j.m*p_i.m / Math.pow(d, 2);
						cf = -this.inCoulombK/d;
						// repulsion based on nodes' bounding boxes
						if(this.nodeBBIntersect(p_i, p_j)){
							cf -= this.inBBRepulsion;
						}
						// calculate Hooke using nodeIJ links
						nij = this.nodeIJs[i][j];
						hf = 0;
						if(nij){
							hf = nij * (d - this.inHookeEquilib)*this.inHookeK;
						}
						f = vec2.normalize(r);
						vec2.scale(f, cf+hf);

						vec2.add(p_i.f, f);
						vec2.subtract(p_j.f, f);
					}
				}
				// some nodes are tethered to a point in the environment
				if(p_i.tether){
					// apply elastic attraction from tether point
					tr = vec2.subtract2(p_i.tether, p_i.p, vec2.create([0,0]));
					// we add a small ammount to d to prevent division by 0
					td = vec2.length(tr) + 0.01;
					thf = td * this.inHookeK;
					tf = vec2.normalize(tr);
					vec2.scale(tf, thf);
					vec2.add(p_i.f, tf);
				}

				// bounding walls' repulsion
				if(this.wallsFlag){
					px = p_i.p[0];
					py = p_i.p[1];
					w = p_i.offw;
					h = p_i.offh;
					// t, b, l, r
					if(py + h > this.top){p_i.f[1] -= this.inWallRepulsion;}
					else if(py - h < this.bottom){p_i.f[1] += this.inWallRepulsion;}
					if(px + w > this.right){p_i.f[0] -= this.inWallRepulsion;}
					else if(px - w < this.left){p_i.f[0] += this.inWallRepulsion;}
				}

				if(!p_i.fixed){
					dpdt = vec2.scale(p_i.dp, dt, vec2.create([0, 0]));
					vec2.add(p_i.p, dpdt);
					fdt = vec2.scale(p_i.f, dt/p_i.m, vec2.create([0, 0]));
					vec2.add(p_i.dp, fdt);
					// Damp velocities
					vec2.scale(p_i.dp, this.inVelDampK);
				}

			}
		}
	},

	nodeBBIntersect: function(n1, n2){
		//bool DoBoxesIntersect(Box a, Box b) {
		return (Math.abs(n1.p[0] - n2.p[0]) < (n1.offw + n2.offw)) &&
				(Math.abs(n1.p[1] - n2.p[1]) < (n1.offh + n2.offh));
		}


};

//})(); // use strict function wrap

//core.extenWrapd(Tasketter, World);

define("scripts/tasketter.js", function(){});
if(typeof Float32Array != 'undefined') {
	glMatrixArrayType = Float32Array;
} else if(typeof WebGLFloatArray != 'undefined') {
	glMatrixArrayType = WebGLFloatArray;
} else {
	glMatrixArrayType = Array;
}


var vec2 = {};


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
	
	var x = vec[0], y = vec[1], len;//, z = vec[2];
	len = Math.sqrt(x*x + y*y);
	
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
	var dx, dy;
	dx = vec[0] - vec2[0];
	dy = vec[1] - vec2[1];
	return Math.sqrt(dx*dx + dy*dy);
};

vec2.dot = function(vec, vec2){

	return vec[0]*vec2[0] + vec[1]*vec2[1];// + vec[2]*vec2[2];
};
define("scripts/vec2.js", function(){});
/*global require */

require.def('SA_tasket', ['kgd/core', 'kgd/consts', 'kgd/world/World','kgd/world/Thing',  'kgd/simpleApp/SimpleApp', /*'kgd/maths/v2',*/ 'scripts/tasketter.js', 'scripts/vec2.js'], function(core, consts, World, Thing, SimpleApp/*, v2*/){
	//vec2 = v2.vec2;
	var DEFAULT_PROJ = 'projectA';

	SA_tasket = function(){
		SimpleApp.call(this);
	};

	SA_tasket.prototype = {
		onBoot: function(){
			this.addSlider(this.world.tk, 'physics_dt', 'Time interval', 0.01, 3.1);
			this.addSlider(this.world.tk, 'inScaleFac', 'Image Scale Factor', 0.1, 1.5);
			this.addSlider(this.world.tk, 'inCoulombK', 'Coulomb K.', 0.0, 500.1);
			this.addSlider(this.world.tk, 'inBBRepulsion', 'BBox Repulsion K.', 0.0, 500.1);
			this.addSlider(this.world.tk, 'inHookeK', 'Hooke K.', 0.0, 0.5);
			this.addSlider(this.world.tk, 'inWallRepulsion', 'Wall Repulsion K.', 0.0, 500.1);
			this.addSlider(this.world.tk, 'inHookeEquilib', 'Hooke Equilibrium', -0.1, 100.1);
			this.addSlider(this.world.tk, 'inVelDampK', 'Vel. Damping', 0.0, 1.1);
			this.addSlider(this.world.tk, 'right', 'Right wall', -300.0, 500);
			this.addSlider(this.world.tk, 'top', 'Top wall', -100.0, 500);
			this.addSlider(this.world.tk, 'left', 'Left wall', -300.0, 500);
			this.addSlider(this.world.tk, 'bottom', 'Bottom wall', -100.0, 500);

			var that = this;

			this.world.tk.projData = tasket_data.projects[DEFAULT_PROJ];
			this.world.init();
			
		}

	};

	core.extend(SA_tasket, SimpleApp);

	TasketterWrap = function(){
		World.call(this);
		this.tk = new Tasketter();
		// for use by nodes' drawing method
		this.nodes = this.tk.nodes;
		this.drawBBFlag = true;
	};

	TasketterWrap.prototype = {
		init: function(){
			this.context.lineWidth = 1;
			this.tk.context = this.context;
			this.tk.init();
			this.updateIntro();
		},

		updateCycle: function(dt){
			this.tk.updateCycle(this.tk.physics_dt);
		},
		// Drawing and DOM-related ---- can be snipped for headless class		

		setUp: function(k){
			switch(k){
			case '0':
				this.tk.runningTime = 0;
				this.tk.randomizeNodes();
				// and make project the central node
				this.tk.nodes[0].makeCentralNode();
				break;
			case '1':
				this.tk.randomizeNodes();
				this.tk.nodes[0].makeCentralNode();
				this.tk.benchmark(200, 0.5);
			}
		},

		screenStats: function(){
			ctx = this.context;
			ctx.fillStyle    = '#fff';
			ctx.font         = '10px sans-serif';
			ctx.textBaseline = 'top';
			ctx.fillText(aux.coordString(this.mousePos, 'Mouse:'), 8-this.dim[0], 8-this.dim[1]);
			ctx.fillText(this.tk.runningTime, 8-this.dim[0], 18-this.dim[1]);
			//ctx.font         = 'bold 12px sans-serif';
			//ctx.strokeText('Hello world!', 10, 18);
		},

		draw: function(){
			var ctx = this.context;
			ctx.fillStyle = this.BACKGROUND_COLOR;
			ctx.strokeStyle = this.FOREGROUND_COLOR;
			ctx.fillRect(-this.origin[0], -this.origin[1], this.canvas.width, this.canvas.height);
			for(var i=0; i<this.tk.objects.length; i++){
				this.tk.nodes[i].drawLinks();
			}

			for(i=0; i<this.tk.objects.length; i++){
				this.tk.nodes[i].draw();
			}

			if(this.drawBBFlag){
				var bBox = this.tk.getProjBBox();
				ctx.strokeStyle = '#0f0';
				ctx.strokeRect(bBox[0][0]-2, bBox[0][1]-2, bBox[1][0] - bBox[0][0]+4, bBox[1][1] - bBox[0][1]+4);
			}


			if(this.tk.wallsFlag){
				var WALL_LIM = 500;
				ctx.strokeStyle = '#0ff';
				// t, b, l, r
				ctx.beginPath();
				ctx.moveTo(-WALL_LIM, this.tk.top);
				ctx.lineTo(WALL_LIM, this.tk.top);
				ctx.moveTo(-WALL_LIM, this.tk.bottom);
				ctx.lineTo(WALL_LIM, this.tk.bottom);
				ctx.moveTo(this.tk.left, WALL_LIM);
				ctx.lineTo(this.tk.left, -WALL_LIM);
				ctx.moveTo(this.tk.right, WALL_LIM);
				ctx.lineTo(this.tk.right, -WALL_LIM);
				ctx.stroke();
			}

		},

		updateIntro: function(){
			$('#intro h2').html(this.tk.projData.title);
			$('#intro #blurb').html(this.tk.projData.description);
		},

		mouseDown: function(e){
			if(this.getObjectAtMouse()){
				this.selectedObject.makeCentralNode();
			}
			console.log('Object selected: ' + this.selectedObject);
		},

		testTethering: function(){
			this.tk.reset();
			var n;
			for(var i=0; i<400; i+=50){
				n = this.tk.addTask({key:i});
				n.addTether(i-200, (0.5 - Math.random())*100);
			}
		}
					
	};

	core.extend(TasketterWrap, World);

	return {
		world: TasketterWrap,
		app: SA_tasket
	};

});

//require(["jquery", "jquery.alpha", "jquery.beta"], function($) {
    ////the jquery.alpha.js and jquery.beta.js plugins have been loaded.
    //$(function() {
        //$('body').alpha().beta();
    //});

/*global require*/	

var tasket_app;	
require(['SA_tasket'], function(tasket){
	$(function(){
		tasket_app = new tasket.app();
		var w = new tasket.world();

		tasket_app.init(w);
	});
});
define("main", function(){});
