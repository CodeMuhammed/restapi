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
	   /*To add contact we will need to do the following
		*1.create the transaction document in the transactions collection
		*2.Update the contact schema with the data gotten and 
		*3.Update their contacts collections appropriately
	   */
	   .post(function(req , res){
		   var contactSchema = {
				color : "red",
				transHistoryId : '',
				userId : '',
				alert : 'true',
				type : '',
				tokenObject : {},
				services : []
			};
			
			var tranSchema = {
				"transLog" : []
			};
			
			var query = req.body;
			
			//Create a new transaction history that will hold the transaction references
			Transactions.insertOne(tranSchema , function(err , result){
				if(err){
					res.status(500).send('Not ok contact was not added 0');
				}
				else {
					contactSchema.transHistoryId = result.ops[0]._id.toString();
					addMineToHis();
				}
			});
			
			//add my contact to his contact list
			function addMineToHis() {
				contactSchema.userId = query.myId;
				contactSchema.type = 'bill from';
				Contacts.update({"_id":ObjectId(query.hisCId)} , {"$addToSet":{"contacts":contactSchema}} ,function(err , result){
					if(err){
						res.status(500).send('Not ok contact was not added 1');
					} else {
						addHisToMine();
					}
				});
			}
			
			//add his contact to my contact list
			function addHisToMine() {
				contactSchema.tokenObject=req.body.tokenObject;
				contactSchema.userId = query.hisId;
				contactSchema.type = 'bill to';
				Contacts.update({"_id":ObjectId(query.myCId)} , {"$addToSet":{"contacts":contactSchema}} ,function(err , result){
					if(err){
						res.status(500).send('Not ok contact was not added 2');
					} else {
						res.status(200).send('Contact added successfully');
					}
				});
			}
			
		})
		
		/*To update a contact , we will need to do the following 
		 *1.Remove the old contact from the contact list that matches the id
		 *2.If this is successful ,  we replace it with the new contact definition
		*/
		.put(function(req , res){
			console.log(req.body);
			//look for the contact in the contacts collection array that matches the contact to be updated
			//and remove it from the list
			Contacts.update(
				{"_id":ObjectId(req.body.myCId)} ,
				{"$pull":{
					"contacts":req.body.oldData
				}} , 
				function(err , result){
					if(err){
						res.status(500).send('Not ok 1');
					} else {
						addNewContact();
					}
				}
			);
			
			//After the removal is done , add the update version back
			function addNewContact(){
				Contacts.update(
				   {"_id":ObjectId(req.body.myCId)} ,
				   {"$addToSet":{
						"contacts":req.body.newData
				   }} , 
				   function(err  , result){
					   if(err){
						   res.status(500).send('Not ok 1');
					   } else {
						   if(req.body.newData.type==='both'){
							   updateHisType('both');
						   }
						   else if(req.body.oldData.type==='both'){
							   updateHisType('bill to');
						   }
						   else {
							    res.status(200).send('contacts updated');
						   }
					   }
				   }
				);
			}
			
			
			//When the subscription type has been set to both ,the other guy also needs to be aware
			function updateHisType(type){
				console.log('It was recorded now take action '+req.body.hisCId);
				
				Contacts.update(
				   {"_id":ObjectId(req.body.hisCId) , "contacts.transHistoryId" : req.body.newData.transHistoryId} ,
				   {"$set":{
						"contacts.$.type": type
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
			
	    })
		
		/*The Delete route is pretty elaborate But it really is very simple and i will try to explain in detail what it is doing
		 *First note that when doing $unset to delete an element from an array , it replaces the value at that position with a null
		 *which means that for the data to be consistent we have to clean up the null values after we delete any thing
		*/
		.delete(function(req , res){
				
			//delete the contact in my list
			Contacts.update({"_id":ObjectId(req.query.myCId) , "contacts.userId":req.query.hisId} , {
				"$unset":{
					"contacts.$":1
				}
			} , 
			function(err , result){
				if(err){
					res.status(500).send('delete not successful 1');
				} else {
					doTaskB();
				}
			});
			
			function doTaskB(){
				//clean my list of null values
				Contacts.update({"_id":ObjectId(req.query.myCId)} ,{
					"$pull":{
						"contacts":null
					}
				} ,
				function(err ,result){
					if(err){
						res.status(500).send('delete not successful 2');
					}
					else{
						doTaskC();
					}
				})
			};
			
			function doTaskC(){
				//Delete the contact in his list
				Contacts.update({"_id":ObjectId(req.query.hisCId) , "contacts.userId":req.query.myId} , {
					"$unset":{
						"contacts.$":1
					}
				}, 
				function(err , result){
					if(err){
						res.status(500).send('delete not successful 3');
					} else {
						doTaskD();
					}
				});
			};
			
			function doTaskD(){
				//clean his list of null values 
				Contacts.update({"_id":ObjectId(req.query.hisCId)} ,{
					"$pull":{
						"contacts":null
					}
				} ,
			   function(err , result){
					 if(err){
						 res.status(500).send('delete not successful 4');
					 } else {
						 doTaskE();
					 }
				});
			};
			
			function doTaskE(){
				//Delete the transaction history Id
				Transactions.remove({"_id":ObjectId(req.query.transHistoryId)} ,
				   function(err , result){
						 if(err){
							 res.status(500).send('delete not successful 5');
						 } else {
							 res.status(200).send('Delete Ok');
						 }
					});
			};
			
		});
		
    //This returns the contact list from the contact list collection that matches the id in the url params
	router.route('/contacts/:id')
		.get( function(req , res){
			console.log('contacts id : '+req.id);
			Contacts.find({'_id' : ObjectId(req.id)}).toArray(function(err , result){
			   return res.status(200).send(result[0]);
			});
		});
    
	//This returns the transaction log from the transactions collection that matches the id in the url params
	router.get('/transactions/:id' , function(req , res){
		console.log(req.id);
		Transactions.find({'_id' : ObjectId(req.id)}).toArray(function(err , result){
		   console.log(result[0]);
		   return res.status(200).send(result[0]);
		});
	});
	
	//This searches the user collection and return the found contact ..This is usually done when we want to search and
	//add a new user
	router.get('/search' , function(req , res){
		var text = req.query.searchText
		console.log(text);
		Users.find({'$or':[
		   {'username':text},
		   {'email':text}
		]} , 
		{"vendorDetails":1 ,"profilePic":1 , "contactsId":1 , "fullName":1}).toArray(
		function(err, result){
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
	
	//This updates the user ..when the profile preferences changes from the client side
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
	
	//This returns certain fields from the user collection where the documents matches an array of ids
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
				res.status(200).send(result);
			}
		});
	});
	
	return router;
};
