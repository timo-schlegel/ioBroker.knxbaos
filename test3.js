/* Or use this example tcp client written in node.js.  (Originated with 
example code from 
http://www.hacksparrow.com/tcp-socket-programming-in-node-js.html.) */

var net = require('net');

var client = new net.Socket();
client.connect(12004, '192.168.1.101', function() {
	console.log('Connected');
//	client.write('Hello, server! Love, Client.');
});

client.on('data', function(data) {
	console.log('Received: ' + data.toString('hex'));
	//client.destroy(); // kill client after server's response

var hexString = data.toString('hex');
var buffer1 = Buffer.from(hexString, 'hex');
var str = buffer1.toString('utf8');
//console.log('buffer1 contains:', buffer1.toString('hex'));
console.log(Buffer.from(buffer1, 'utf8'));



});

client.on('close', function() {
	console.log('Connection closed');
});



// Convert 14 bytes string value ("Zwangsbetrieb") to string
var hexString="5a77616e67736265747269656220";
var buffer1 = Buffer.from(hexString, 'hex');
var str = buffer1.toString('utf8');
console.log(str);
