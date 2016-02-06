var express = require('express');

var app = express();
var http = require('http').Server(app);
var bodyParser = require('body-parser');


app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 


var util = require('util'),
    exec = require('child_process').exec,
    child;





app.use("/", express.static(__dirname + '/'));


app.get('/', function (req, res) {
  res.sendfile('index.html', {root: __dirname});
});

app.post('/annotations', function(req,res){
	console.log('annotations call: ', req.body);
	console.log('sending: ', './generateAnnotation.sh -a '+req.body.starttime+' '+req.body.endtime+ ' ' + req.body.text);
	child = exec('./generateAnnotation.sh -a '+req.body.starttime+' '+req.body.endtime+ ' ' + req.body.text, // command line argument directly in string
	  function (error, stdout, stderr) {      // one easy function to capture data/errors
	    console.log('stdout: ' + stdout);
	    console.log('stderr: ' + stderr);
	    if (error !== null) {
	      console.log('exec error: ' + error);
	    }
	});



	res.end();
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});