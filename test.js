
const child_process = require('child_process');

/*
var baos = child_process.spawn('/usr/src/baos/baos-18.2.0/build/bin/BaosEventListener');
baos.stdout.on('data', function (data) {
      console.log('stdout: ' + data);
   });
baos.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
   });
baos.on('close', function (code) {
      console.log('child process exited with code ' + code);
   });
*/

/*
function connect()
{
var baos = child_process.spawn('/usr/src/baos/baos-18.2.0/build/bin/BaosEventListener');
baos.stdout.on('data', function (data) {
      console.log('stdout: ' + data);
   });
baos.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
   });
baos.on('close', function (code) {
      console.log('child process exited with code ' + code);
connect();
   });
}

connect();
*/

/*
setTimeout(function() {
  // Code, der erst nach 2 Sekunden ausgeführt wird
  console.log("exit...");
baos.stdin.write("exit\n");
}, 2000);
*/




//var buffer1 = Buffer.from('0e', 'hex');
//var buffer1 = Buffer.from('4e', 'hex');

//var dpStateLen = buffer1.readUInt8(0);   // 0x01001110;
//var dpLen = (dpStateLen & 0x0f);
//var dpLen = (dpStateLen & 0b00001111);



//var nextDpPTR = 4;	// First DP value starts at offset 4
//var dpLen = 14;
//nextDpPTR += 2 + dpLen; //  1 byte DP ID, 1 byte DP state/lenth, dpLen bytes DP value


//console.log(buffer1.readUInt8(0).toString());
//console.log(nextDpPTR.toString());



//var buffer1 = Buffer.from('0c79', 'hex'); // 22,9
//console.log(test(buffer1));


//var xx = "DPT9";

//if(/^DPT9(|.[0-9]{3})$/.test(xx))
//  console.log("match");


/*
var txbuffer = Buffer.alloc(4);
var dpID = "170";
txbuffer.write("f005", 'hex');
txbuffer.writeUInt8(parseInt(dpID), 2);
//txbuffer.write("aa", 2, 'hex');
txbuffer.write("01", 3, 'hex');
*/
					var txbuffer = Buffer.alloc(6 + 14);
					var str = "Test";
					
					txbuffer.write("f006", 'hex');					// SetDatapointValue.Req
					txbuffer.writeUInt8(170, 2);					// StartDatapoint
					txbuffer.writeUInt8(1, 3, 'hex');				// NumberOfDatapoints
					txbuffer.writeUInt8(170, 4);					// First DP ID
					txbuffer.writeUInt8(0b00110000 ^ parseInt("14"), 5, 'hex');	// state/length byte of first datapoint
					txbuffer.write(str.padEnd(14), 6);				// value

console.log(txbuffer);
console.log("#"+str.padEnd(14)+"#");

console.log("#"+Number(true)+"#");
console.log("#"+Number(false)+"#");

