//this holds the logic behind this specific resource
module.exports  =function(app , dbResource){
	var Beta = dbResource.model('Beta');

	var resourceGet=function(req , res) {
		 //Get Beta testers from Beta collection
		  Beta.find({})
		  .toArray(function(err , result){
				if(err){
					res.status(500).send('Cannot complete operation get /Beta');
				} else {
					res.status(200).json(result);
				}
		  });
	};

	var resourcePost=function(req , res) {
		Beta.find(req.body).toArray(function(err , result){
			if(err){
				res.status(500).send('Cannot complete operation get /Beta');
			}
			else if(!result[0]){
				insertBeta();
			}
			else {
			    res.status(200).json('Congratulations you are already on the list. Your feedback is paramount to us. We will keep you updated as we make progress with purslr');
			}
		   
		});

		function insertBeta(){
			Beta.insertOne(req.body , function(err, result){ 
				 if(err){
					res.status(500).send(err); 
				 } else {
					 res.status(200).json('Congratulations you are on the list. Your feedback is paramount to us. We will keep you updated as we make progress with purslr');
				 }
			 });
		}
	};

	return {
		"get" : resourceGet,
		"post" : resourcePost
	};
}; 