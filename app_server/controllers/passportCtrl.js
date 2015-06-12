var passportLocal = require('passport-local');
var bCrypt = require('bcrypt-nodejs');
/*NOTE: passport middle ware is case sensitive on username and password fields
  and it requires the form passed to it to be all lowercase else it kicks
  the request to the default redirect page provided before even calling the 
  strategy defined for that route*/
  
var fs = require('fs');
var path = require('path');
var ObjectId = require('mongodb').ObjectId;

//Grab models from the dbResource that are relevant to passport
var dbResource = require('../../app_server/models/dbResource')('test' , {});
//models
var Users = dbResource.model('Users');
var Contacts = dbResource.model('Contacts');
var Services = dbResource.model('Services');

module.exports = function(passport){
	//Get collections or models needed for this routes
	//var food = dbResource.model('food');
	
	var isValidPassword = function(user , password){
		return bCrypt.compareSync(password , user.password);
	};
	var createHash = function(password){
		return bCrypt.hashSync(password , null , null);
	};
	
	//Tells passport how to get users full info
	passport.serializeUser(function(user , done){
		console.log('user serialized '+user._id);
		return done(null , user._id);
	});

	passport.deserializeUser(function(_id , done){
		//query database or cache for actual data
		console.log('user deserialized ' + _id);
		Users.find({'_id' : ObjectId(_id)}).toArray(function(err , result){
			if(err){
				return done(err ,false);
			}
			if(!result[0]){
				return done(null ,false);
			}
		    return done(null , result[0]);
		});
	});
	
	//Strategy to use when logging in existing users
	passport.use('login' , new passportLocal.Strategy({passReqToCallback: true},function(req , username , password , done){
		//check if username exists
		//check if password is correct
		//sign in user
		console.log('passport login called');
		
		if(req.isAuthenticated()){
			return done(null , req.user);
		} else {
			Users.find({'$or':[
			   {'username':username},
			   {'email':username}
			]}).toArray(function(err , result){
				if(err){
					return done(err);
				}
				else if(!result[0]){
					 return done(null , false);
				}
				
				else if(!isValidPassword(result[0] , password)){
					return done(null , false);
				}
				 else{
					 return done(null , result[0]);
				 }
			});
		}
	}));
	
	//Strategy to use when signing up a new user
	passport.use('signup' , new passportLocal.Strategy({passReqToCallback: true},function(req , username , password , done){
		//sign in users in with newly created document
		
		var newUser = req.body;
		console.log('passport signup called with data below');
		
		Users.find({'$or':[
		   {'username':username},
		   {'email':req.body.email}
		]}).toArray(function(err, result){
			if(err){
				return done(err);
			}
			//check if username already exists
			if(result[0]){
				return done(null , false);
			} else {
				createContactList();
			}
			
		});
		
	    //create a contact list for this user
		function createContactList() {
			Contacts.insertOne({"contacts" : []} , function(err , result){
				if(err){
					return done(err);
				}
				newUser.contactsId = result.ops[0]._id;
				newUser.password = createHash(password);
				createUser()
				
			});
		}
		
		//Add the user in the users collections
		function createUser() {
			Users.insertOne(newUser , function(err,result){
				if(err){
					return done(err);
				} else {
					return done(null , {
						_id : result.ops[0]._id
					});
				}
			});
		}
		
	}));

};