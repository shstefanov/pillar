
var types = {
	
	"float":         Float32Array,
	"float32":       Float32Array,
	"float64":       Float64Array,
	
	"int":           Int32Array,
	"int32":         Int32Array,
	"int16":         Int16Array,
	"int8":          Int8Array,

	"uint":          Uint32Array,
	"uint32":        Uint32Array,
	"uint16":        Uint16Array,
	"uint8":         Uint8Array,
	"uint8clamp":    Uint8ClampedArray,

	"boolean":       Uint8ClampedArray,
	"string":        Array, 
	"ref":           Array,
}

var prototypes = {
	
	"float":         Number,
	"float32":       Number,
	"float64":       Number,
	
	"int":           Number,
	"int32":         Number,
	"int16":         Number,
	"int8":          Number,

	"uint":          Number,
	"uint32":        Number,
	"uint16":        Number,
	"uint8":         Number,
	"uint8clamp":    Number,
	

	"boolean":       Boolean,
	"string":        String, 

}

function Pillar(options){
	this.length      = 0;
	this.max_length  = options.length;
	this.validator   = {}
	this.index       = [];
	this.parseIn     = {};
	this.parseOut    = {};
	this.column      = {}; 
	this.types       = {};
	this.free_slots  = [];
	var columns = this.column_list = Object.keys(options.fields), num = columns.length;
	for(var i=0;i<num;i++){
		var name  = columns[i];
		var type  = options.fields[name], Column;
		if(typeof type === "function"){
			this.types[name] = type; Column = Array;
		}
		else if(typeof type === "string"){
			Column  = types[type] || Array;
			if(prototypes[type]) this.types[name] = prototypes[type];
		}
		else{  // Expect object 
			Column = type.column || Array;
			if(type.type)        this.types     [name]  = type.type;
			if(type.validator)   this.validator [name]  = type.validator;
			if(type.parseIn)     this.parseIn   [name]  = type.parseIn;
			if(type.parseOut)    this.parseOut  [name]  = type.parseOut;
		}
		this.column[name] = new Column(options.length);
	}
}

function invalidFieldTypeError(name){
	throw new Error("Invalid field type: " + name );
}

function invalidFieldValueError(name, val){
	throw new Error("Invalid field value for "+name+": " + val );
}

function missingFieldError(name){
	throw new Error("Missing field: " + name );
}

Pillar.prototype.add = function(obj){

	if(this.length === this.max_length) throw new Error("Collection is full");

	var parsed = {}, name;
	
	for(name in this.parseIn){
		parsed[name] = obj.hasOwnProperty(name)? this.parseIn[name](obj[name]) : missingFieldError(name);
	}

	for(name in this.types){
		if((obj.hasOwnProperty(name) || missingFieldError(name)) && !( (parsed.hasOwnProperty(name)? parsed[name] : obj[name] ).constructor === this.types[name])) invalidFieldTypeError(name);
	}

	for(name in this.validator){
		var value = parsed.hasOwnProperty(name)? parsed[name] : obj[name];
		if(!obj.hasOwnProperty(name) || !this.validator[name]( value )) invalidFieldValueError(name, value);
	}

	var l = this.free_slots.shift();
	if(l === undefined) { l = this.length; this.length++; }

	for(var i=0;i<this.column_list.length;i++){
		name = this.column_list[i];
		this.column[name][l] = parsed.hasOwnProperty(name)? parsed[name] : obj[name];
	}
	this.index.push(l);
	return l;
}

Pillar.prototype.remove = function(index){
	var ii = this.index.indexOf(index);
	if(ii === -1) return;
	this.free_slots.push(this.index.splice(ii,1)[0]);
	this.length--;
}

Pillar.prototype.get = function(index, target){
	var ii = this.index.indexOf(index);
	if(ii===-1) return;
	index = this.index[ii];
	var result = target || {};
	for(var i=0;i<this.column_list.length; i++){
		var name = this.column_list[i];
		result[name] = this.parseOut[name]?this.parseOut[name](this.column[name][index]):this.column[name][index];
	}
	return result;
}

Pillar.prototype.set = function(index, obj){
	for(var i=0;i<this.column_list.length; i++){
		var name = this.column_list[i];
		if(obj.hasOwnProperty(name) && obj[name] !== this.column[name][index]){
			this.column[name][index] = obj[name];
			// TODO - call watchers and listeners here
		}
	}
}

Pillar.prototype.find = function(query){ // WRONG !!!
	var result = [], l = this.column_list.length, must_match = 0, match_fields = []; 
	for(var i=0;i<l; i++) {
		var name = this.column_list[i];
		if(query.hasOwnProperty(name)) {
			must_match++;
			match_fields.push(name);
		}
	}
	models: for(var i=0;i<this.length;i++){
		for(var j=0;j<must_match;j++){
			var name = match_fields[j];
			var value = this.column[name][i];
			if(value !== query[name]) continue models;
		}
		result.push(this.get(i));
	}
	return result;
};

Pillar.prototype.findOne = function(query){
	var result = null, l = this.column_list.length, must_match = 0, match_fields = []; 
	for(var i=0;i<l; i++) {
		var name = this.column_list[i];
		if(query.hasOwnProperty(name)) {
			must_match++;
			match_fields.push(name);
		}
	}
	models: for(var i=0;i<this.length;i++){
		for(var j=0;j<must_match;j++){
			var name = match_fields[j];
			var value = this.column[name][i];
			if(value !== query[name]) continue models;
		}
		return this.get(i);
	}
	return result;
};

Pillar.prototype.each = function(fn){
	var result = {}, index = this.index;
	for(var i=0,m = index[0];i<index.length;i++,m=index[i]) fn(this.get(m, result), m, this) && this.set(i, result);
}

module.exports = Pillar;
