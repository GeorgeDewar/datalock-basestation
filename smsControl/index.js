var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var unirest = require('unirest');
var CryptoJS = require('crypto-js');

var blunoMAC = "D0:39:72:A0:9A:BE";


var authorized_numbers = ["+64275551234"];
var app_key = "REDACTED";
var app_secret = "REDACTED";
var api_host = "http://smsapi.dalek.co.nz";


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))


function a2hex(str) {
  var arr = [];
  for (var i = 0, l = str.length; i < l; i ++) {
    var hex = Number(str.charCodeAt(i)).toString(16);
    arr.push(hex);
  }
  return arr.join('');
}

app.post('/unlockDoor', function(req, res){
	var sender = req.body.sender;
	var command = req.body.shortcode;
	var message = req.body.message;
	var application = req.body.application;
	var signature = req.body.signature;
	var payload = {
		message: message,
		sender: sender,
		application: application,
		shortcode: command
	};
	console.log(payload);
	console.log(signature);
	var check_sig = CryptoJS.HmacSHA256(JSON.stringify(payload), app_secret).toString();
	console.log(check_sig);
	if(check_sig === signature){
		//verified payload
		if(authorized_numbers.indexOf(sender) !== -1){
			//allowed sender
			res.send('ok');
			
			unlockDoor(sender);
			
		} else {
			sendSMS(sender, "You are not permitted to unlock the door.");
			res.send('nope');
		}
		

	} else{
		res.send('sigfail');
	}
	
});

var sys = require('sys')
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout) }

function unlockDoor(sender){
	console.log('Unlocking door!');
	exec("gatttool -b " + blunoMAC + " --char-write -a 0x0025 -n "+a2hex('unlock'), function(error, stdout, stderr){
		sendSMS(sender, "The door has been unlocked!");
	});
}

function sendSMS(to, message){
	var payload = {to: to, message: message};
	var signature = CryptoJS.HmacSHA256(JSON.stringify(payload), app_secret).toString();
	payload.app_key = app_key;
	payload.signature = signature;
	unirest.get(api_host + '/api/sendSMS').query(payload).end(function(res){
		console.log('SMS sent!');
	});
}

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});
