//this holds the logic behind this specific resource
module.exports  =function(app){
	var resourceGet=function(req , res) {
		res.set('Content-Type','application/json');
		res.status(200).send({data:'GET Ok '+ req.userId});
	};

	var resourcePut=function (req , res) {
		res.set('Content-Type','application/json');
		res.status(200).send({data:'PUT Ok '+ req.userId});
	};

	var resourcePost=function(req , res) {
		res.set('Content-Type','application/json');
		res.status(200).send({data:'POST Ok '+ req.userId});
	};


	var resourceDelete=function(req , res) {
		res.set('Content-Type','application/json');
		res.status(200).send({data:'DELETE Ok '+ req.userId});
	};

	return {
		"get" : resourceGet,
		"put" : resourcePut,
		"post" : resourcePost,
		"remove" : resourceDelete
	};
}; 