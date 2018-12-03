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

'use strict';

const Homey = require('homey');

const LEDservice = 'fff0';
const onOffCharacteristic = 'fff1';
const on = Buffer.from('01010101', 'hex');
const off = Buffer.from('01010100', 'hex');

class ClusterLightDevice extends Homey.Device {


	async findAdvertisement() {
		try {
			const advertisement = await Homey.ManagerBLE.find(this.getData().id);
			this.setAvailable();
			return Promise.resolve(advertisement);
		} catch (error) {
			// need to keep retrying somehow
			this.setUnavailable('light not in range');
			return Promise.reject(error);
		}
	}

	// connect to the peripheral, and return the service
	async connect() {
		try {
			// console.log(this.peripheral);
			this.peripheral = await this.advertisement.connect();
			// discoverAllServicesAndCharacteristics
			const services = await this.peripheral.discoverAllServicesAndCharacteristics();
			// get the service in alternative way
			const service = services.filter(serv => serv.uuid === 'fff0');
			return Promise.resolve(service[0]);
		} catch (error) {
			this.log(error);
			this.disconnect();
			return Promise.reject(error);
		}
	}

	async disconnect() {
		return Promise.resolve(await this.peripheral.disconnect());
	}

	// this method is called when the Device is inited
	async onInit() {
		try {
			this.log('device init: ', this.getName(), 'id:', this.getData().id);
			this.advertisement = await this.findAdvertisement();	// links to the device
			this.log(this.advertisement);
			this.peripheral = undefined;	// is a connected device
			this.registerCapabilityListener('onoff', async (value) => {
				this.log(`on/off requested: ${value}`);
				const service = await this.connect();
				// await service.write('fff1', Buffer.from('01010100', 'hex'));
				if (value) {
					// write command 'on' to the peripheral
					await service.write('fff1', on);
				} else {
					// write command 'off' to the peripheral
					await service.write('fff1', off);
				}
				await this.disconnect();
				return Promise.resolve(true);
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

			// // start polling router for info
			// this.intervalIdDevicePoll = setInterval(() => {
			// 	try {
			// 		// get new routerdata and update the state
			// 		this.updateRouterDeviceState();
			// 	} catch (error) { this.log('intervalIdDevicePoll error', error); }
			// }, 1000 * settings.polling_interval);
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

	// this method is called when the user has changed the device's settings in Homey.
	onSettings(oldSettingsObj, newSettingsObj, changedKeysArr, callback) {
		// first stop polling the device, then start init after short delay
		clearInterval(this.intervalIdDevicePoll);
		this.log('light device settings changed');
		this.setAvailable()
			.catch(this.error);
		// setTimeout(() => {
		// 	this.onInit();
		// }, 10000);
		// do callback to confirm settings change
		return callback(null, true);
	}

}

module.exports = ClusterLightDevice;
