var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId;
module.exports = function(dbResource){
  var Tradr = dbResource.model('Tradr');
  console.log('tradr');
  router.route('/update')
      .post(function(req , res){
          console.log(req.body);
          Tradr.insertOne(req.body, function(err , result){
              if(err){
                   res.status(500).send('Data not updated at this time');
              }
              else {
                res.status(200).send('tradr updated on the server');
              }
          });
      });

	return router; 
};
