var passportLocal = require('passport-local');
var bCrypt = require('bcrypt-nodejs');
/*NOTE: passport middle ware is case sensitive on username and password fields
  and it requires the form passed to it to be all lowercase else it kicks
  the request to the default redirect page provided before even calling the 
  strategy defined for that route*/
  
var fs = require('fs');
var path = require('path');
var ObjectId = require('mongodb').ObjectId;

module.exports = function(passport  , dbResource){
	//models
	var Users = dbResource.model('Users');
	var Tags = dbResource.model('Tags');

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
			else if(!result[0]){
				
				return done(null ,false);
			}
			else {
			    return done(null , result[0]);
			}
		   
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
		} 
		else {
			Users.find({'username':username}).toArray(function(err , result){
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
		
		Users.find({'username':username}).toArray(function(err, result){
			if(err){
				return done(err);
			}
			//check if username already exists
			if(result[0]){
				return done(null , false);
			} else {
				createTags();
			}
			
		});
		
	    //create a contact list for this user
		function createTags() {
			Tags.insertOne({"tags" : ['general']} , function(err , result){
				if(err){
					return done(err);
				}
				newUser.tags_id = result.ops[0]._id;
				newUser.password = createHash(password);
				createUser();
			});
		}
		
		//Add the user in the users collections
		function createUser() {
			Users.insertOne(newUser , function(err,result){
				if(err){
					return done(err);
				} else {
					return done(null , result.ops[0]);
				}
			});
		}
		
	}));

};