/*
Copyright 2018, Robin de Gruijter (gruijter@hotmail.com)

This file is part of com.gruijter.clusterlights.

com.gruijter.clsterlights is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

com.gruijter.clusterlights is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with com.gruijter.clusterlights. If not, see <http://www.gnu.org/licenses/>.
*/

/* eslint-disable prefer-destructuring */

'use strict';

const Homey = require('homey');

const LEDservice = 'fff0';
const LEDCharacteristic = 'fff1';
const on = Buffer.from('01010101', 'hex');
const off = Buffer.from('01010100', 'hex');
const dimBase = '030101';
const mode = {
	stayOff:	Buffer.from('0501020300', 'hex'),	// not used, makes no sense :)
	wave:	Buffer.from('0501020301', 'hex'),
	phase:	Buffer.from('0501020302', 'hex'),
	phasedFadeAway:	Buffer.from('0501020304', 'hex'),
	phasedTwinkle:	Buffer.from('0501020308', 'hex'),
	fadeAway:	Buffer.from('0501020310', 'hex'),
	fastTwinkle: Buffer.from('0501020320', 'hex'),
	stayOn:	Buffer.from('0501020340', 'hex'),
};

function dimLevel(value) {
	// const dimMin = Buffer.from('03010101', 'hex');	// decimal 1
	// const dimMax = Buffer.from('03010163', 'hex');	// decimal 99
	if ((value < 0) || (value > 1)) {
		return new Error('value must be between 0 and 1');
	}
	const dimDecimal = parseInt((10 + value * 89), 10); // level between 10 and 99
	const dimHex = (dimDecimal).toString(16).padStart(2, '0');
	const levelBuffer = Buffer.from(dimBase + dimHex, 'hex');
	return levelBuffer;
}


class ClusterLightDevice extends Homey.Device {


	async findAdvertisement() {
		try {
			const advertisement = await Homey.ManagerBLE.find(this.getData().id);
			this.setAvailable();
			return Promise.resolve(advertisement);
		} catch (error) {
			// need to keep retrying somehow
			this.setUnavailable('light could no tbe found (out of in range?)');
			return Promise.reject(error);
		}
	}

	// connect to the peripheral, and return the service
	async connect() {
		try {
			if (this.peripheral && this.peripheral.isConnected) {
				console.log('already connected to peripheral');
			} else {
				console.log('not connected to peripheral; connecting now...');
				this.peripheral = await this.advertisement.connect();
			}
			// discoverAllServicesAndCharacteristics
			const services = await this.peripheral.discoverAllServicesAndCharacteristics();
			// get the service in alternative way
			const service = services.filter(serv => serv.uuid === LEDservice);
			this.LEDservice = service[0];

			this.setAvailable();
			return Promise.resolve(service[0]);
		} catch (error) {
			this.setUnavailable('could not connect to light');
			this.disconnect();
			return Promise.reject(error);
		}
	}

	async disconnect() {
		if (this.peripheral && this.peripheral.isConnected) {
			console.log('disconnecting from peripheral now...');
			await this.peripheral.disconnect();
		}
		return Promise.resolve(true);
	}

	async sendCommand(command) {
		try {
			this.commandQueue.push(command);
			if (this.busy) {
				console.log('putting command in the queue');
				return Promise.resolve(true);
			}
			this.busy = true;
			await this.connect();
			while (this.commandQueue.length > 0) {
				const comm = this.commandQueue.shift();
				this.LEDservice.write(LEDCharacteristic, comm); // do I need to do await here?
			}
			await this.disconnect();
			this.busy = false;	// or before disconnect?
			return Promise.resolve(true);
		} catch (error) {
			this.log(error);
			return Promise.reject(error);
		}
	}

	async poll() {
		try {
			// console.log('polling now');
			if (!this.getAvailable()) {
				await this.findAdvertisement();
			}
		} catch (error) {
			this.log(error);
		}
	}

	// this method is called when the Device is inited
	async onInit() {
		try {
			this.log('device init: ', this.getName(), 'id:', this.getData().id);
			this.advertisement = await this.findAdvertisement();	// links to the device
			// this.log(this.advertisement);
			this.peripheral = undefined;	// is a connected device
			this.LEDservice = undefined;	// is a connected service on the peripheral
			this.commandQueue = [];	// empty command queue
			this.busy = false; // no commands are in the queue
			this.registerCapabilityListener('onoff', async (value) => {
				try {
					this.log(`on/off requested: ${value}`);
					if (value) {
						// write command 'on' to the peripheral
						await this.sendCommand(on);
					} else {
						// write command 'off' to the peripheral
						await this.sendCommand(off);
					}
					return Promise.resolve(true);
				} catch (error) {
					return Promise.reject(error);
				}
			});
			this.registerCapabilityListener('dim', async (value) => {
				try {
					this.log(`dim requested: ${value}`);
					await this.sendCommand(dimLevel(value));
					return Promise.resolve(true);
				} catch (error) {
					return Promise.reject(error);
				}
			});
			this.registerCapabilityListener('mode', async (value) => {
				try {
					this.log(`mode change requested: ${value}`);
					await this.sendCommand(mode[value]);
					return Promise.resolve(true);
				} catch (error) {
					return Promise.reject(error);
				}
			});
			// // init some values
			// this._driver = this.getDriver();
			// // create router session
			// const settings = this.getSettings();


			// // register trigger flow cards
			// this.speedChangedTrigger = new Homey.FlowCardTriggerDevice('uldl_speed_changed')
			// 	.register();

			// // register condition flow flowcards
			// const deviceOnlineCondition = new Homey.FlowCardCondition('device_online');
			// deviceOnlineCondition.register()
			// 	.registerRunListener((args) => {
			// 		if (Object.prototype.hasOwnProperty.call(args, 'NetgearDevice')) {
			// 			let deviceOnline = false;
			// 			if (Object.prototype.hasOwnProperty.call(args.NetgearDevice.knownDevices, args.mac.name)) {
			// 				deviceOnline = args.NetgearDevice.knownDevices[args.mac.name].online;	// true or false
			// 			}
			// 			return Promise.resolve(deviceOnline);
			// 		}
			// 		return Promise.reject(Error('The netgear device is unknown or not ready'));
			// 	})
			// 	.getArgument('mac')
			// 	.registerAutocompleteListener((query) => {
			// 		let results = this._driver.makeAutocompleteList.call(this);
			// 		results = results.filter((result) => {		// filter for query on MAC and Name
			// 			const macFound = result.name.toLowerCase().indexOf(query.toLowerCase()) > -1;
			// 			const nameFound = result.description.toLowerCase().indexOf(query.toLowerCase()) > -1;
			// 			return macFound || nameFound;
			// 		});
			// 		return Promise.resolve(results);
			// 	});

			// // register action flow cards
			// const blockDevice = new Homey.FlowCardAction('block_device');
			// blockDevice.register()
			// 	.on('run', async (args, state, callback) => {
			// 		await this._driver.blockOrAllow.call(this, args.mac.name, 'Block');
			// 		// this.log(args.mac.name);
			// 		callback(null, true);
			// 	})
			// 	.getArgument('mac')
			// 	.registerAutocompleteListener((query) => {
			// 		let results = this._driver.makeAutocompleteList.call(this);
			// 		results = results.filter((result) => {		// filter for query on MAC and Name
			// 			const macFound = result.name.toLowerCase().indexOf(query.toLowerCase()) > -1;
			// 			const nameFound = result.description.toLowerCase().indexOf(query.toLowerCase()) > -1;
			// 			return macFound || nameFound;
			// 		});
			// 		return Promise.resolve(results);
			// 	});

			// const reboot = new Homey.FlowCardAction('reboot');
			// reboot.register()
			// 	.on('run', (args, state, callback) => {
			// 		this._driver.reboot.call(this);
			// 		callback(null, true);
			// 	});

			// start polling device for status info
			this.intervalIdDevicePoll = setInterval(() => {
				this.poll();
			}, 1000 * 15);	// 15 seconds poll
		} catch (error) {
			this.log(error);
		}

	}

	// this method is called when the Device is added
	onAdded() {
		this.log('lights added as device');
	}

	// this method is called when the Device is deleted
	onDeleted() {
		// stop polling
		clearInterval(this.intervalIdDevicePoll);
		this.log('light deleted as device');
	}

}

module.exports = ClusterLightDevice;
