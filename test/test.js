describe("TCollection", function(){

	var assert = require("assert");

	var TCollection = require("../index.js");

	it("Has apropriate typed arrays", function(next){
		var collection = new TCollection({
			length: 1000,
			fields:{
				"Custom":        Object,
				
				"float":         "float",
				"float32":       "float32",
				"float64":       "float64",
				
				"int":           "int",
				"int32":         "int32",
				"int16":         "int16",
				"int8":          "int8",

				"uint":          "uint",
				"uint32":        "uint32",
				"uint16":        "uint16",
				"uint8":         "uint8",
				"uint8clamp":    "uint8clamp",
				

				"boolean":       "boolean",
				"string":        "string",
				"ref":           "ref",				
			}

		});

		assert.equal(collection.length, 0);

		assert.equal(collection.types.Custom === Object,                          true );

		assert.equal(collection.column.Custom      instanceof Array,              true );

		assert.equal(collection.column.float       instanceof Float32Array,       true );
		assert.equal(collection.column.float32     instanceof Float32Array,       true );
		assert.equal(collection.column.float64     instanceof Float64Array,       true );

		assert.equal(collection.column.int         instanceof Int32Array,         true );
		assert.equal(collection.column.int32       instanceof Int32Array,         true );
		assert.equal(collection.column.int8        instanceof Int8Array,          true );

		assert.equal(collection.column.uint        instanceof Uint32Array,        true );
		assert.equal(collection.column.uint32      instanceof Uint32Array,        true );
		assert.equal(collection.column.uint8       instanceof Uint8Array,         true );
		assert.equal(collection.column.uint8clamp  instanceof Uint8ClampedArray,  true );

		assert.equal(collection.column.boolean     instanceof Uint8ClampedArray,  true );
		assert.equal(collection.column.string      instanceof Array,              true );
		assert.equal(collection.column.ref         instanceof Array,              true );

		next();
	});

	var collection;
	it("Adds some objects with fields of all types", function(next){

		collection = new TCollection({
			length: 1000,
			fields: {
				"id":            "int",
				
				"float":         "float",
				"float32":       "float32",
				"float64":       "float64",
				
				"int":           "int",
				"int32":         "int32",
				"int16":         "int16",
				"int8":          "int8",

				"uint":          "uint",
				"uint32":        "uint32",
				"uint16":        "uint16",
				"uint8":         "uint8",
				"uint8clamp":    "uint8clamp",
				

				"boolean":       "boolean",
				"string":        "string",
				"ref":           "ref",				
			}
		});

		for(var i=0;i<1000;i++){
			collection.add({

				"id":            i,
				
				"float":         i+0.1,
				"float32":       i+0.2,
				"float64":       i+0.3,
				
				"int":           i*10,
				"int32":         i*20,
				"int16":         Math.round(i/1000),
				"int8":          i%50,

				"uint":          i+100,
				"uint32":        i+200,
				"uint16":        Math.round(i/1000)+22,
				"uint8":         i%200,
				"uint8clamp":    i%255,
				

				"boolean":       !!(i%255),
				"string":        "id-"+i,
				"ref":           {id:i},

			});
		}

		next();

	});

	it("Model has data as expected", function(next){
		assert.equal(collection.length, 1000);
		collection.each(function(object, i){
			object.float   = parseFloat(object.float.toFixed(1));
			object.float32 = parseFloat(object.float32.toFixed(1));
			object.float64 = parseFloat(object.float64.toFixed(1));

			assert.deepEqual(object, {

				"id":            i,
				
				"float":         i+0.1,
				"float32":       i+0.2,
				"float64":       i+0.3,
				
				"int":           i*10,
				"int32":         i*20,
				"int16":         Math.round(i/1000),
				"int8":          i%50,

				"uint":          i+100,
				"uint32":        i+200,
				"uint16":        Math.round(i/1000)+22,
				"uint8":         i%200,
				"uint8clamp":    i%255,
				

				"boolean":       !!(i%255)?1:0,
				"string":        "id-"+i,
				"ref":           {id:i},

			});
		});
		next();
	});

	it("Adds and removes objects", function(next){
		var collection = new TCollection({
			length: 5,
			fields: {
				"aa": "int",
				"bb": "string",
			}
		});

		var indexes = [
			collection.add({aa: 1,  bb: "str1"}),
			collection.add({aa: 3,  bb: "str1"}),
			collection.add({aa: 6,  bb: "str1"}),
			collection.add({aa: 12, bb: "str1"}),
			collection.add({aa: 12, bb: "str1"}),
		];

		assert.deepEqual(indexes, [0,1,2,3,4]);

		assert.throws(function(){
			collection.add({aa: 32, bb: "str1"});
		}, Error);

		collection.remove(1);
		assert.equal(collection.get(1), undefined );
		var inserted = collection.add({aa: 16,  bb: "str18"});
		assert.equal(inserted, 1 );
		next();

	});

	it("Creates and handles fields of specific types", function(next){
		var CustomType = function(){};
		var OtherType  = function(){};

		var collection = new TCollection({
			length: 5,
			fields: {
				"field_a": "int",
				"field_b": CustomType,
			}
		});

		var m_1 = collection.add({ field_a: 1, field_b: new CustomType()	});
		assert.deepEqual(collection.get(m_1), { field_a: 1, field_b: new CustomType() });

		assert.throws(function(){
			collection.add({ field_a: 1, field_b: new OtherType()	});
		}, Error);

		next();

	});

	it("Define type as object with options", function(next){
		var ClassA = function(v){ this.a = v};
		var ClassB = function(v){ this.b = v};

		var collection = new TCollection({
			length: 10,
			fields: {

				"field_a": { 
					column:     Array, 
					type:       ClassA, 
					validator:  function(obj){ return obj.a  > 5;                         },
					parseIn:    function(obj){        obj.parsedA   = true; return obj;   },
					parseOut:   function(obj){        return "ObjectA->"+JSON.stringify(obj);  },
				},

				"field_b": { 
					column:     Array, 
					type:       ClassB, 
					validator:  function(obj){ return obj.b         < 5;                  },
					parseIn:    function(obj){        obj.parsedB   = true; return obj;   },
					parseOut:   function(obj){        obj.unparsedB = true; return obj;   },
				}

			}
		});


		var i = collection.add({
			field_a: new ClassA(6),
			field_b: new ClassB(4),
		});

		assert.equal(collection.column.field_a[0].parsedA === true, true);
		assert.equal(collection.column.field_a[0].hasOwnProperty("unparsedA"), false);
		
		assert.equal(collection.column.field_b[0].parsedB === true, true);
		assert.equal(collection.column.field_b[0].hasOwnProperty("unparsedB"), false);

		var object_a = collection.get(i);
		assert.deepEqual(object_a, { 
			field_a: 'ObjectA->{"a":6,"parsedA":true}',
  			field_b: { b: 4, parsedB: true, unparsedB: true } 
  		});

  		assert.throws(function(){
  			var i = collection.add({
				field_a: new ClassA(5),
				field_b: new ClassB(4),
			});
  		}, Error);
		



		

		next();

	});


});