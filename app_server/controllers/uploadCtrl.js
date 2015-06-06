module.exports =function(app) {
	var fs = require('fs');
	var serverUpload = function(req , res){
		var namedFile='';
		req.busboy.on('file' , function(fieldname , file , filename ,encoding  , mimetype){
			var ws = fs.createWriteStream('upload' + fieldname +filename);
			file.pipe(ws , {"end":false});
			
			file.on('end'  ,function(){
				namedFile = 'upload' + fieldname +filename;
			});
		});
		
		req.busboy.on('finish' , function(){
			console.log('Busboy is finished');
			res.status(201).send(namedFile);
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