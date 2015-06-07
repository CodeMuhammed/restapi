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
	
	router.route('/addContact')
	   .post(function(req , res){
		   var contactSchema = {
				color : "red",
				transHistoryId : '',
				userId : '',
				ring : "true",
				aler : "true"
			};
			
			console.log(req.body);
			res.status(200).send('contacts');
		});
		
		
	router.route('/contacts/:id')
		.get( function(req , res){
			console.log('contacts id : '+req.id);
			Contacts.find({'_id' : ObjectId(req.id)}).toArray(function(err , result){
			   return res.status(200).send(result[0]);
			});
		});
		
	router.get('/transactions/:id' , function(req , res){
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
		]} , {"vendorDetails":1 ,"profilePic":1}).toArray(function(err, result){
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
	
	return router;
};
