/* Or use this example tcp client written in node.js.  (Originated with 
example code from 
http://www.hacksparrow.com/tcp-socket-programming-in-node-js.html.) */

var net = require('net');


// readFloat16fromBuffer implementation from ioBroker.openknx/lib/knx/src/dptlib/dpt9.js
const ldexp = (mantissa, exponent) =>
  exponent > 1023 // avoid multiplying by infinity
    ? mantissa * Math.pow(2, 1023) * Math.pow(2, exponent - 1023)
    : exponent < -1074 // avoid multiplying by zero
    ? mantissa * Math.pow(2, -1074) * Math.pow(2, exponent + 1074)
    : mantissa * Math.pow(2, exponent);
	
function readFloat16fromBuffer(buf){
	if (buf.length != 2)
    return log.error('Conversion error DPT9: buf should be 2 bytes long (got %d bytes)',
      buf.length
    );

  const sign = buf[0] >> 7;
  const exponent = (buf[0] & 0b01111000) >> 3;
  let mantissa = 256 * (buf[0] & 0b00000111) + buf[1];
  if (sign) mantissa = ~(mantissa ^ 2047);
  return parseFloat(ldexp(0.01 * mantissa, exponent).toPrecision(15));
}


function readDatapointValue(dpID, dpValueBuffer)
{
	// KNX DPT types -> https://bab-technologie.com/datentypen/
	
	if(dpID==170){
		console.log("read datapoint id "+dpID+", type string, buffer: "+dpValueBuffer.toString('hex')+" | "+dpValueBuffer.toString('utf8'));		
	}
	else if(dpID==244||dpID==245||dpID==248||dpID==249||dpID==250){
		console.log("read datapoint id "+dpID+", type 4OctetFloat, buffer: "+dpValueBuffer.toString('hex')+" | "+dpValueBuffer.readFloatBE());
	}
	else if(dpID==219||dpID==220){
		console.log("read datapoint id "+dpID+", type 2OctetFloat, buffer: "+dpValueBuffer.toString('hex')+" | "+readFloat16fromBuffer(dpValueBuffer));
	}
	else if(dpID==214||dpID==242){
		console.log("read datapoint id "+dpID+", type 4OctetUnsigned, buffer: "+dpValueBuffer.toString('hex')+" | "+dpValueBuffer.readUInt32BE());
	}	
	else console.log("read datapoint id "+dpID+", type unknown, buffer: "+dpValueBuffer.toString('hex'));
	
}



function rxDatapointValueInd(buffer) {
	// get packet info
	var StartDatapoint = buffer[2];
	var NumberOfDatapoints = buffer[3];
	console.log("StartDatapoint "+StartDatapoint.toString()+" and NumberOfDatapoints "+NumberOfDatapoints);
	
	var nextDpPTR = 4;	// First DP starts at offset 4 (with "First DP ID")
			
	for (let i=0; i<NumberOfDatapoints; i++) {
		// read datapoint info (header)
		var dpID = buffer[nextDpPTR];
		var dpStateLen = buffer[nextDpPTR+1];
		var dpLen = (dpStateLen & 0b00001111);
		
		// read datapoint value (payload)
		var dpValueBuffer = buffer.subarray((nextDpPTR+2), (nextDpPTR+2+dpLen));
		readDatapointValue(dpID, dpValueBuffer);	
		
		// set pointer to next datapoint
		nextDpPTR += 2 + dpLen; // 2 bytes for DP ID and StateLen + dpLen bytes
	}
}


var client = new net.Socket();
client.connect(12004, '192.168.1.101', function() {
	console.log('Connected');
//	client.write('Hello, server! Love, Client.');
});

client.on('data', function(data) {
	//console.log('\nReceived: ' + data.toString('hex'));
	console.log('');
	//client.destroy(); // kill client after server's response


	var hexString = data.toString('hex');
	var buffer1 = Buffer.from(hexString, 'hex');
	var str = buffer1.toString('utf8');
	//console.log('buffer1 contains:', buffer1.toString('hex'));
	console.log(Buffer.from(buffer1, 'utf8'));

	// Packet starts with F0 C1 (=DatapointValue.Ind)
	if(Buffer.from('f0c1', 'hex').compare(buffer1, 0, 2)==0)
	{
		rxDatapointValueInd(buffer1);
	}

//Received: f0c1d601d604000000fc
//<Buffer f0 c1 d6 01 d6 04 00 00 00 fc>



});

client.on('close', function() {
	console.log('Connection closed');
});


/*
// Convert 14 bytes string value ("Zwangsbetrieb") to string
var hexString="5a77616e67736265747269656220";
var buffer1 = Buffer.from(hexString, 'hex');
var str = buffer1.toString('utf8');
console.log(str);
*/
