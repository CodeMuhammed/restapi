var fs = require('fs');
var path  = require('path');

module.exports =function(app) {
	
	var serverUpload = function(req , res){
		var namedFile='';
		req.busboy.on('file' , function(fieldname , file , filename ,encoding  , mimetype){
			namedFile=path.join('public' , 'img' ,  'upload' + fieldname +filename);
			var ws = fs.createWriteStream(namedFile);
			file.pipe(ws , {"end":false});
			
			file.on('end'  ,function(){
				console.log('upload ended');
			});
		});
		
		req.busboy.on('finish' , function(){
			console.log('Busboy is finished');
			res.status(201).send(namedFile.substr(7));
		});
	};

	var awsUpload = function(req , res){
		res.status(200).send('aws upload recieved');
	};

    return {
		'serverUpload' : serverUpload,
	    'awsUpload' : awsUpload
	};
    
};