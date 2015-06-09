var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var ObjectId = require('mongodb').ObjectId;

//Grab models from the dbResource that are relevant this api
var dbResource = require('../app_server/models/dbResource')('test' , {});

//models
var Contacts = dbResource.model('Contacts');
var Transactions = dbResource.model('Transactions');
var Users = dbResource.model('Users');

//api routes
module.exports = function(){
	router.use(function(req , res , next){
	   if(req.isAuthenticated()){
		  console.log('This User is authenticated'); 
		  return next();
	   }
	   else{
		   console.log('This is not auth ');
		   res.status(403).send({"error":{"msg":"invalid login credentials while in session"}});
	   }
   });
	router.param('id' , function(req , res , next , id){
		req.id  = id;
		return next();
	});
	
	router.route('/contact')
	   .post(function(req , res){
		   /*To add contact we will need to do the following
		    *1.create the transaction document in the transactions collection
			*2.Update the contact schema with the data gotten and 
			*3.Update their contacts collections appropriately
		   */
		   var contactSchema = {
				color : "red",
				transHistoryId : '',
				userId : '',
				ring : "true",
				alert : "true"
			};
			
			var tranSchema = {
				"transLog" : ["This is where transaction logs will be pushed"]
			};
			
			var query = req.body;
			Transactions.insertOne(tranSchema , function(err , result){
				if(err){
					res.status(500).send('Not ok contact was not added 0');
				}
				else {
					contactSchema.transHistoryId = result.ops[0]._id.toString();
					
					//insert his contact into my contact list and vice-versa
					contactSchema.userId = query.hisId;
					Contacts.update({"_id":ObjectId(query.myCId)} , {"$addToSet":{"contacts":contactSchema}} ,function(err , result){
						if(err){
							res.status(500).send('Not ok contact was not added 1');
						} else {
							contactSchema.userId = query.myId;
							Contacts.update({"_id":ObjectId(query.hisCId)} , {"$addToSet":{"contacts":contactSchema}} ,function(err , result){
								if(err){
									res.status(500).send('Not ok contact was not added 2');
								} else {
									res.status(200).send('okk contact addded');
								}
							});
						}
					});
				}
			})
		})
		
		.put(function(req , res){
			console.log(req.body);
			//look for the contact in the contacts collection array that matches the contact to be updated
			
			Contacts.update(
				{"_id":ObjectId(req.body.contactsId)} ,
				{"$pull":{
					"contacts":req.body.oldData
				}} , 
				function(err , result){
					if(err){
						res.status(500).send('Not ok 1');
					} else {
						Contacts.update(
						   {"_id":ObjectId(req.body.contactsId)} ,
						   {"$addToSet":{
								"contacts":req.body.newData
						   }} , 
						   function(err  , result){
							   if(err){
								   res.status(500).send('Not ok 1');
							   } else {
								   res.status(200).send('contacts updated');
							   }
						   }
						);
					}
				}
			);
		})
		
		.delete(function(req , res){
			console.log('command for deleting contact recieved');
			res.status(200).send('command for deleting contact recieved');
		});
		
		
	router.route('/contacts/:id')
		.get( function(req , res){
			console.log('contacts id : '+req.id);
			Contacts.find({'_id' : ObjectId(req.id)}).toArray(function(err , result){
			   return res.status(200).send(result[0]);
			});
		});
		
	router.get('/transactions/:id' , function(req , res){
		console.log(req.id);
		Transactions.find({'_id' : ObjectId(req.id)}).toArray(function(err , result){
		   console.log(result[0]);
		   return res.status(200).send(result[0]);
		});
	});
	
	router.get('/search' , function(req , res){
		var text = req.query.searchText
		console.log(text);
		Users.find({'$or':[
		   {'username':text},
		   {'email':text}
		]} , {"vendorDetails":1 ,"profilePic":1 , "contactsId":1 , "fullName":1}).toArray(function(err, result){
			if(err){
				res.status(500).send('failed to get data');
			}
			if(!result[0]){
				res.status(400).send('No user found');
			} else {
				console.log(result[0]);
				res.status(200).send(result[0]);
			}
			
		});
		
		
	});
	
	router.route('/user')
	   .put(function(req ,res){
		   console.log(req.body);
		   req.body._id = ObjectId(req.body._id);
		   Users.update({"_id":ObjectId(req.body._id)} , req.body ,  function(err , result){
			    if(err){
					console.log('update err');
					res.sendStatus(500);
				} else {
					console.log('update ok');
				    res.status(200).send('Upadate ok');
				}
				
		   });
		   
	   });
	
	router.post('/user_image_array' , function(req , res){
		//convert the ids in the array to object ids
		for(var i=0; i<req.body.length; i++){
			 req.body[i] = ObjectId(req.body[i]);
		}
		
	    Users.find(
		   {"_id": {"$in":req.body}} , 
		   {"profilePic":1 , "username":1 , "contactsId":1}
		).toArray(function(err , result){
			if(err){
				res.status(500).send('Cannot complete operation user_image_array');
			} else {
				console.log(result);
				res.status(200).send(result);
			}
		});
	});
	
	return router;
};
