var MongoClient  = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var assert = require('assert');
var DBOpened = false;

//This object will hold opened connections to the collections the app uses
var openedColls = {};
var url = '';

//import the language driver
module.exports = function(dbName , authObj){
   
	//This functions accesses the database and creates a pool of opened 
	//connections to the required collections needed by the app
	var initColls = function (cb) {
		if(!isDBOpened()){
			MongoClient.connect(url , function(err , db){
				if(err){
					throw new Error('DB connection error ');
				} else { 
					assert.equal(null ,err);
					console.log('Connected correcctly to the database '+dbName);
					openedColls.Users = db.collection('Users');
					openedColls.Contacts = db.collection('Contacts');
					openedColls.Transactions = db.collection('Transactions');
					openedColls.Services = db.collection('Services');
					DBOpened = true;
					
					/*db.collection('Tests').insert(
					   {name:'hello'},
                      function(err , result){
						  console.log(result);
					  }					   
					);*/
					
					return cb();
				}
			});
		} else {
			return cb();
		}
		
	};
	
    //This function returns the valid collection to the client module
	var model = function(coll){
		if(!openedColls[coll]){
			throw new Error('The model or collection required does not exists');
		}
		return openedColls[coll];
	};
	
	//
	var isDBOpened = function(){
		return DBOpened;
	}
	
	//Do stuff with  dbName and authObj
	//url = 'mongodb://127.0.0.1:27017/'+dbName.trim();
	url = 'mongodb://'+ authObj.dbuser+ ':'+authObj.dbpassword+'@ds051738.mongolab.com:51738/'+dbName.trim();
	return {
		initColls : initColls,
		model : model
	};
};

