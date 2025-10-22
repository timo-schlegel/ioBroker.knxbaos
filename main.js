"use strict";

/*
 * Created with @iobroker/create-adapter v2.6.1
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");

// Load your modules here, e.g.:
// const fs = require("fs");
const net = require('net');

class Knxbaos extends utils.Adapter {

    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: "knxbaos",
        });
		
		this.baosClient = new net.Socket();
		this.debug = false;
		
        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        // this.on("objectChange", this.onObjectChange.bind(this));
        // this.on("message", this.onMessage.bind(this));
        this.on("unload", this.onUnload.bind(this));
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here

		// Reset the connection indicator during startup
        this.setState('info.connection', false, true);
		this.connected = false;
		
        // return, if unconfigured	
		if(!this.config.ipaddr || !this.config.port){
			this.log.info("ip address and/or port not configured, do not start");
			return;
		}
		
		// return, if invalid ip address is configured
		if (!/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(this.config.ipaddr)){
			this.log.info("invalid ip address, can not connect to: "+this.config.ipaddr);
			return;
		}
		
		// connect to BAOS module
		this.baosClient.connect(this.config.port, this.config.ipaddr, () => {
			this.log.info("Connected")
			this.setState('info.connection', true, true);
			this.connected = true;
		});
		
		this.baosClient.on('data', (data) => {			
			// create buffer with hex values from TCP client
			var hexString = data.toString('hex');
			var buffer1 = Buffer.from(hexString, 'hex');
			//if(this.debug) this.log.info("rx: "+buffer1.toString('hex'));	

			// process packets starting with F0 85 (=GetDatapointValue.Res)
			if(Buffer.from('f085', 'hex').compare(buffer1, 0, 2)==0)
			{
				this.rxDatapointValueInd(buffer1);
			}
			
			// process packets starting with F0 C1 (=DatapointValue.Ind)
			if(Buffer.from('f0c1', 'hex').compare(buffer1, 0, 2)==0)
			{
				this.rxDatapointValueInd(buffer1);
			}			
		});
		
		this.baosClient.on('close', () => {
			this.log.info('Connection closed');
			this.setState('info.connection', false, true);
			this.connected = false;
		});

		// enable keepalive (required to detect connetion errors)
		this.baosClient.setKeepAlive(true, 0);

		this.baosClient.on('error', () => {
    		this.log.info('Connection error');
			this.baosClient.destroy();
		});


// ####################################################################################
// TODO (Node.js Re-connecting Socket) -> https://gist.github.com/sio2boss/6334089
// ####################################################################################

        /*
        For every state in the system there has to be also an object of type state
        Create/update all variables based on adapter configuration
        */
		await this.config.datapoints.forEach((dp) => {
			
			// set variable type
			switch(dp.datatype) {
				case "DPT1":
					this.setObjectAsync(dp.ID.toString(), {
						"type": "state",
						"common": {
							"name": dp.description,
							"type": "boolean",
							"role": "value",
							"read": true,
							"write": true,
						},
						native: {},
					}); break;
					
				case "DPT1.001":
					this.setObjectAsync(dp.ID.toString(), {
						"type": "state",
						"common": {
							"name": dp.description,
							"type": "boolean",
							"role": "switch",
							"read": true,
							"write": true,
						},
						native: {},
					}); break;					
					
				case "DPT9":
					this.setObjectAsync(dp.ID.toString(), {
						"type": "state",
						"common": {
							"name": dp.description,
							"type": "number",
							"role": "value",
							"read": true,
							"write": true,
						},
						native: {},
					}); break;					

				case "DPT9.001":
					this.setObjectAsync(dp.ID.toString(), {
						"type": "state",
						"common": {
							"name": dp.description,
							"type": "number",
							"role": "value.temperature",
							"unit": "°C",
							"read": true,
							"write": true,
						},
						native: {},
					}); break;
					
				case "DPT12":
					this.setObjectAsync(dp.ID.toString(), {
						"type": "state",
						"common": {
							"name": dp.description,
							"type": "number",
							"role": "value",
							"read": true,
							"write": true,
						},
						native: {},
					}); break;
					
				case "DPT14":
					this.setObjectAsync(dp.ID.toString(), {
						"type": "state",
						"common": {
							"name": dp.description,
							"type": "number",
							"role": "value",
							"read": true,
							"write": true,
						},
						native: {},
					}); break;
					
				case "DPT16":
					this.setObjectAsync(dp.ID.toString(), {
						"type": "state",
						"common": {
							"name": dp.description,
							"type": "string",
							"role": "value",
							"read": true,
							"write": true,
						},
						native: {},
					}); break;
			}

		});

        // In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
        // this.subscribeStates("testVariable");
        // You can also add a subscription for multiple states. The following line watches all states starting with "lights."
        // this.subscribeStates("lights.*");
        // Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
        this.subscribeStates("*");

        /*
            setState examples
            you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
        */
        // the variable testVariable is set to true as command (ack=false)
        //await this.setStateAsync("testVariable", true);

        // same thing, but the value is flagged "ack"
        // ack should be always set to true if the value is received from or acknowledged from the target system
        //await this.setStateAsync("testVariable", { val: true, ack: true });

        // same thing, but the state is deleted after 30s (getState will return null afterwards)
        //await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });
		
		// request datapoint values from BAOS device
		let time = 0;
		await this.config.datapoints.forEach((dp) => {
			setTimeout(() => {this.txGetDatapointValueReq(dp.ID)}, time);
			time += 100;
		});
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);
			
			if(this.connected) {
				// run callback once FIN ACK is received
				this.baosClient.on('close', () => {
					callback();
				});
				
				// Send FIN packet (close TCP connection)
				this.baosClient.end();
			}
			else callback();
			
        } catch (e) {
            callback();
        }
    }

    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
    // /**
    //  * Is called if a subscribed object changes
    //  * @param {string} id
    //  * @param {ioBroker.Object | null | undefined} obj
    //  */
    // onObjectChange(id, obj) {
    //     if (obj) {
    //         // The object was changed
    //         this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
    //     } else {
    //         // The object was deleted
    //         this.log.info(`object ${id} deleted`);
    //     }
    // }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {
        if (state) {
            // The state was changed
			if(!state.ack) {
				// ack is true when state was updated from baos device... in this case we do not send to send the state change back			
				let dpID = Number(id.substr(this.namespace.length+1)); // knxbaos.0.202 -> 202
				if(this.debug) this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
				this.writeDatapointValue(dpID, state.val);
			}
        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }

    // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
    // /**
    //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
    //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
    //  * @param {ioBroker.Message} obj
    //  */
    // onMessage(obj) {
    //     if (typeof obj === "object" && obj.message) {
    //         if (obj.command === "send") {
    //             // e.g. send email or pushover or whatever
    //             this.log.info("send command");

    //             // Send response in callback if required
    //             if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
    //         }
    //     }
    
	// }
	
	// readFloat16fromBuffer implementation from ioBroker.openknx/lib/knx/src/dptlib/dpt9.js	
	readFloat16fromBuffer(buf){
		const ldexp = (mantissa, exponent) =>
		exponent > 1023 // avoid multiplying by infinity
			? mantissa * Math.pow(2, 1023) * Math.pow(2, exponent - 1023)
			: exponent < -1074 // avoid multiplying by zero
			? mantissa * Math.pow(2, -1074) * Math.pow(2, exponent + 1074)
			: mantissa * Math.pow(2, exponent);
		
		if (buf.length != 2)
		return this.log.error('Conversion error DPT9: buf should be 2 bytes long (got ' + buf.length.toString() + ' bytes)');

		const sign = buf[0] >> 7;
		const exponent = (buf[0] & 0b01111000) >> 3;
		let mantissa = 256 * (buf[0] & 0b00000111) + buf[1];
		if (sign) mantissa = ~(mantissa ^ 2047);
		return parseFloat(ldexp(0.01 * mantissa, exponent).toPrecision(15));
	}
	
	// writeFloat16toBuffer implementation from ioBroker.openknx/lib/knx/src/dptlib/dpt9.js	
	writeFloat16toBuffer(value){
		const ldexp = (mantissa, exponent) =>
		exponent > 1023 // avoid multiplying by infinity
			? mantissa * Math.pow(2, 1023) * Math.pow(2, exponent - 1023)
			: exponent < -1074 // avoid multiplying by zero
			? mantissa * Math.pow(2, -1074) * Math.pow(2, exponent + 1074)
			: mantissa * Math.pow(2, exponent);
		
		const frexp = (value) => {
		  if (value === 0) return [0, 0];
		  const data = new DataView(new ArrayBuffer(8));
		  data.setFloat64(0, value);
		  let bits = (data.getUint32(0) >>> 20) & 0x7ff;
		  if (bits === 0) {
			data.setFloat64(0, value * Math.pow(2, 64));
			bits = ((data.getUint32(0) >>> 20) & 0x7ff) - 64;
		  }
		  const exponent = bits - 1022;
		  const mantissa = ldexp(value, -exponent);
		  return [mantissa, exponent];
		};		
		
		const arr = frexp(value);
		const [mantissa, exponent] = arr;
		// find the minimum exponent that will upsize the normalized mantissa (0,5 to 1 range)
		// in order to fit in 11 bits ([-2048, 2047])
		let e = 0;
		let max_mantissa = 0;
		for (e = exponent; e >= -15; e--) {
			max_mantissa = ldexp(100 * mantissa, e);
			if (max_mantissa > -2048 && max_mantissa < 2047) break;
		}
		const sign = mantissa < 0 ? 1 : 0;
		const mant = mantissa < 0 ? ~(max_mantissa ^ 2047) : max_mantissa;
		const exp = exponent - e;
		// yucks
		return Buffer.from([(sign << 7) + (exp << 3) + (mant >> 8), mant % 256]);		
	}
	
	txGetDatapointValueReq(dpID)
	{
			var txbuffer = Buffer.alloc(4);
			txbuffer.write("f005", 'hex');
			txbuffer.writeUInt8(dpID, 2);
			txbuffer.write("01", 3, 'hex');
			this.baosClient.write(txbuffer);
	}
	
	rxDatapointValueInd(buffer) {
			// get packet info
			var StartDatapoint = buffer[2];
			var NumberOfDatapoints = buffer[3];
			
			var nextDpPTR = 4;	// First DP starts at offset 4 (with "First DP ID")
					
			for (let i=0; i<NumberOfDatapoints; i++) {
				// read datapoint info (header)
				var dpID = buffer[nextDpPTR];
				var dpStateLen = buffer[nextDpPTR+1];
				var dpLen = (dpStateLen & 0b00001111);
				
				// read datapoint value (payload)
				var dpValueBuffer = buffer.subarray((nextDpPTR+2), (nextDpPTR+2+dpLen));
				this.readDatapointValue(dpID, dpValueBuffer);	
				
				// set pointer to next datapoint
				nextDpPTR += 2 + dpLen; // 2 bytes for DP ID and StateLen + dpLen bytes
			}			
	}
	
	readDatapointValue(dpID, dpValueBuffer)
	{
		// KNX DPT types -> https://bab-technologie.com/datentypen/

		if(this.config.datapoints)
		{
			var res = this.config.datapoints.find(datapoint => datapoint.ID === dpID);
			if(res){
				
				if(/^DPT1(|.[0-9]{3})$/.test(res.datatype)){
					if(this.debug) this.log.info("read datapoint id "+dpID+", type Boolean, buffer: "+dpValueBuffer.toString('hex')+" | "+Boolean(dpValueBuffer.readUInt8()));
					this.setStateAsync(dpID.toString(), { val: Boolean(dpValueBuffer.readUInt8()), ack: true }); // Boolean
				}
				else if(/^DPT9(|.[0-9]{3})$/.test(res.datatype)){
					if(this.debug) this.log.info("read datapoint id "+dpID+", type 2OctetFloat, buffer: "+dpValueBuffer.toString('hex')+" | "+this.readFloat16fromBuffer(dpValueBuffer));
					this.setStateAsync(dpID.toString(), { val: this.readFloat16fromBuffer(dpValueBuffer), ack: true }); // 2OctetFloat
				}				
				else if(/^DPT12(|.[0-9]{3})$/.test(res.datatype)){
					if(this.debug) this.log.info("read datapoint id "+dpID+", type 4OctetFloat, buffer: "+dpValueBuffer.toString('hex')+" | "+dpValueBuffer.readUInt32BE());
					this.setStateAsync(dpID.toString(), { val: dpValueBuffer.readUInt32BE(), ack: true }); // 4OctetUnsigned
				}	
				else if(/^DPT14(|.[0-9]{3})$/.test(res.datatype)){
					if(this.debug) this.log.info("read datapoint id "+dpID+", type 4OctetFloat, buffer: "+dpValueBuffer.toString('hex')+" | "+dpValueBuffer.readFloatBE());
					this.setStateAsync(dpID.toString(), { val: dpValueBuffer.readFloatBE(), ack: true }); // 4OctetFloat
				}
				else if(/^DPT16(|.[0-9]{3})$/.test(res.datatype)){
					if(this.debug) this.log.info("read datapoint id "+dpID+", type string, buffer: "+dpValueBuffer.toString('hex')+" | "+dpValueBuffer.toString('utf8'));		
					this.setStateAsync(dpID.toString(), { val: dpValueBuffer.toString('utf8'), ack: true }); // String
				}
				else {
					this.log.info("undefinied datatype " + res.datatype + " for datapoint id "+dpID.toString()+", buffer: "+dpValueBuffer.toString('hex'));	
				}
				
			}
		}
	}
	
	writeDatapointValue(dpID, value)
	{
		if(this.config.datapoints)
		{
			var res = this.config.datapoints.find(datapoint => datapoint.ID === dpID);
			if(res){
				
				if(/^DPT1(|.[0-9]{3})$/.test(res.datatype)){
					if(this.debug) this.log.info("write datapoint id "+dpID.toString()+", type Boolean, value: "+value.toString());
										
					var txbuffer = Buffer.alloc(6 + 1);
					txbuffer.write("f006", 'hex');								// SetDatapointValue.Req
					txbuffer.writeUInt8(dpID, 2);								// StartDatapoint
					txbuffer.writeUInt8(1, 3, 'hex');							// NumberOfDatapoints
					txbuffer.writeUInt8(dpID, 4);								// First DP ID
					txbuffer.writeUInt8(0b00110000 ^ parseInt("1"), 5, 'hex');	// First DP cmd/length
					txbuffer.writeUInt8(Number(value), 6);					// First DP value
					this.baosClient.write(txbuffer);
					//if(this.debug) this.log.info("tx: "+txbuffer.toString('hex'));											
				}				
				else if(/^DPT9(|.[0-9]{3})$/.test(res.datatype)){
					if(this.debug) this.log.info("write datapoint id "+dpID.toString()+", type 2OctetFloat, value: "+value.toString());
					
					if (!isFinite(value))
						return this.log.error('Conversion error DPT9: cannot write non-numeric or undefined value');					
					
					var txbuffer = Buffer.alloc(6 + 2);
					txbuffer.write("f006", 'hex');								// SetDatapointValue.Req
					txbuffer.writeUInt8(dpID, 2);								// StartDatapoint
					txbuffer.writeUInt8(1, 3, 'hex');							// NumberOfDatapoints
					txbuffer.writeUInt8(dpID, 4);								// First DP ID
					txbuffer.writeUInt8(0b00110000 ^ parseInt("2"), 5, 'hex');	// First DP cmd/length
					this.writeFloat16toBuffer(value).copy(txbuffer, 6);			// First DP value
					this.baosClient.write(txbuffer);
					//if(this.debug) this.log.info("tx: "+txbuffer.toString('hex'));																
				}
				else if(/^DPT12(|.[0-9]{3})$/.test(res.datatype)){
					if(this.debug) this.log.info("write datapoint id "+dpID.toString()+", type 4OctetUnsigned, value: "+value.toString());
										
					var txbuffer = Buffer.alloc(6 + 4);
					txbuffer.write("f006", 'hex');								// SetDatapointValue.Req
					txbuffer.writeUInt8(dpID, 2);								// StartDatapoint
					txbuffer.writeUInt8(1, 3, 'hex');							// NumberOfDatapoints
					txbuffer.writeUInt8(dpID, 4);								// First DP ID
					txbuffer.writeUInt8(0b00110000 ^ parseInt("4"), 5, 'hex');	// First DP cmd/length
					txbuffer.writeUInt32BE(value, 6);							// First DP value
					this.baosClient.write(txbuffer);
					//if(this.debug) this.log.info("tx: "+txbuffer.toString('hex'));											
				}	
				else if(/^DPT14(|.[0-9]{3})$/.test(res.datatype)){
					if(this.debug) this.log.info("write datapoint id "+dpID.toString()+", type 4OctetFloat, value: "+value.toString());
					
					var txbuffer = Buffer.alloc(6 + 4);
					txbuffer.write("f006", 'hex');								// SetDatapointValue.Req
					txbuffer.writeUInt8(dpID, 2);								// StartDatapoint
					txbuffer.writeUInt8(1, 3, 'hex');							// NumberOfDatapoints
					txbuffer.writeUInt8(dpID, 4);								// First DP ID
					txbuffer.writeUInt8(0b00110000 ^ parseInt("4"), 5, 'hex');	// First DP cmd/length
					txbuffer.writeFloatBE(value, 6);							// First DP value
					this.baosClient.write(txbuffer);
					//if(this.debug) this.log.info("tx: "+txbuffer.toString('hex'));											
				}
				else if(/^DPT16(|.[0-9]{3})$/.test(res.datatype)){
					if(this.debug) this.log.info("write datapoint id "+dpID.toString()+", type string, value: "+value);		
					
					var txbuffer = Buffer.alloc(6 + 14);
					txbuffer.write("f006", 'hex');								// SetDatapointValue.Req
					txbuffer.writeUInt8(dpID, 2);								// StartDatapoint
					txbuffer.writeUInt8(1, 3, 'hex');							// NumberOfDatapoints
					txbuffer.writeUInt8(dpID, 4);								// First DP ID
					txbuffer.writeUInt8(0b00110000 ^ parseInt("14"), 5, 'hex');	// First DP cmd/length
					txbuffer.write(value.padEnd(14), 6);						// First DP value
					this.baosClient.write(txbuffer);
					//if(this.debug) this.log.info("tx: "+txbuffer.toString('hex'));					
				}
				else {
					this.log.info("can not write datapoint value. undefinied datatype " + res.datatype + " for datapoint id "+dpID.toString());	
				}
				
			}				
		}
	}
}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new Knxbaos(options);
} else {
    // otherwise start the instance directly
    new Knxbaos();
}
