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
	
	router.get('/contacts/:id' , function(req , res){
		console.log('contacts id : '+req.id);
		Contacts.find({'_id' : ObjectId(req.id)}).toArray(function(err , result){
		   return res.status(200).send(result[0]);
		});
	});
	
	router.get('/transactions/:id' , function(req , res){
		console.log('transactions id : '+req.id);
		Transactions.find({'_id' : ObjectId(req.id)}).toArray(function(err , result){
		   return res.status(200).send(result[0]);
		});
	});
	
	router.get('/search' , function(req , res){
		console.log(' gotten');
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
				res.status(200).send('No user found');
			} else {
				res.status(200).send(result[0]);
			}
			
		});
		
		
	});
	
	return router;
};
