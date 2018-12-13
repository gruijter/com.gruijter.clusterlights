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

class BLELightDevice extends Homey.Device {

	// timer function to disconnect after connection inactivity
	timerStop() {
		if (this.connectionTimer) {
			clearTimeout(this.connectionTimer);
			this.connectionTimer = null;
		}
	}

	connectionTimerStart(t) {
		this.timerStop();
		if (t > 0) {
			this.connectionTimer = setTimeout(() => {
				this.connectionTimer = null;
				this.disconnect();
			}, t * 1000);
		}
	}

	// connect to the peripheral, and return the service
	async connectService() {
		try {
			if (this.peripheral && this.peripheral.isConnected) {	// already connected
				this.connectionTimerStart(30);	// start/reset 30 seconds connection
				// console.log('already connected');
				// const LEDservice = this.peripheral.services.filter(service => service.uuid === this.ds.LEDserviceUuid)[0];
				const LEDservice = await this.peripheral.getService(this.ds.LEDserviceUuid);
				return Promise.resolve(LEDservice);
			}
			if (this.connectionTimer) {	// already started to connect, but not yet connected
				this.connectionTimerStart(30);	// start/reset 30 seconds connection
				// console.log('already connecting');
				return Promise.resolve(null);
			}
			this.connectionTimerStart(30);	// start/reset 30 seconds connection
			this.log('connecting to peripheral');
			// this.LEDservice = undefined;
			const advertisement = await Homey.ManagerBLE.find(this.getData().id);
			const peripheral = await advertisement.connect();
			this.peripheral = peripheral;
			// const services = await peripheral.discoverAllServicesAndCharacteristics();
			// const LEDservice = services.filter(service => service.uuid === this.ds.LEDserviceUuid)[0];
			await peripheral.discoverAllServicesAndCharacteristics();
			const LEDservice = await peripheral.getService(this.ds.LEDserviceUuid);
			// this.setAvailable();
			return Promise.resolve(LEDservice);
		} catch (error) {
			this.log('error connecting');
			// this.setUnavailable('could not connect to light');
			return Promise.reject(error);
		}
	}

	async disconnect() {
		this.writing = true;
		this.timerStop();
		if (this.peripheral && this.peripheral.isConnected) {
			this.log('disconnecting from peripheral');
			await this.peripheral.disconnect()
				.catch(() => null);
		}
		this.writing = false;
		return Promise.resolve(true);
	}

	async sendCommand(command) {
		try {
			this.commandQueue.push(command);
			if (this.writing) {	// return if still writing
				return Promise.resolve(true);
			}
			const LEDservice = await this.connectService();
			if (!LEDservice) {	// return if still waiting to connect
				return Promise.resolve(true);
			}
			while (this.commandQueue.length > 0) {
				const comm = this.commandQueue.shift();
				this.writing = true;
				// eslint-disable-next-line no-await-in-loop
				const written = await LEDservice.write(this.ds.LEDControlCharacteristicUuid, comm)
					.catch((error) => {
						this.log(error.message);
						return null;
					});
				this.writing = false;
				if (!written) {
					// eslint-disable-next-line no-await-in-loop
					await this.disconnect();
					this.commandQueue = [];	// flush the queue, sorry :(
					break;
				}
			}
			return Promise.resolve(true);
		} catch (error) {
			this.log(error.message);
			this.disconnect();
			return Promise.reject(error);
		}
	}

	// this method is called when the Device is inited
	async onInitDevice() {
		try {
			this.log('device init: ', this.getName(), 'id:', this.getData().id);
			this.settings = this.getSettings();
			this.peripheral = undefined;	// is a device (connected or unconnected)
			this.connectionTimer = null;
			this.writing = false;
			this.commandQueue = [];	// empty command queue
			this.registerFlowcardsAndListeners();	// duh
			await this.connectService();	// find and connect the peripheral
		} catch (error) {
			this.log(error.message);
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
		this.log(`${this.getName()} deleted as device`);
	}

	onSettings(oldSettingsObj, newSettingsObj, changedKeysArr, callback) {
		this.log('device settings were changed by the user');
		callback(null, true);
	}

	registerFlowcardsAndListeners() {
		// register trigger flow cards
		this.modeChangedTrigger = new Homey.FlowCardTrigger('mode_changed')
			.register();
		// register action flow cards
		this.changeModeAction = new Homey.FlowCardAction('change_mode')
			.register()
			.on('run', async (args, state, callback) => {
				try {
					this.log(`mode change requested via flow: ${args.mode_dropdown}`);
					await this.sendCommand(this.ds.mode[args.mode_dropdown]);
					return callback(null, true);
				} catch (error) {
					return callback(error);
				}
			});
		this.changeRandomModeAction = new Homey.FlowCardAction('change_random_mode')
			.register()
			.on('run', async (args, state, callback) => {
				try {
					const modesArray = Object.entries(this.settings).filter(key => key[1]);
					if (modesArray.length < 1) {
						return callback(null, true);
					}
					const randomModeKey = modesArray[Math.floor(Math.random() * modesArray.length)][0];
					const randomMode = this.ds.mode[randomModeKey];
					this.log(`random mode change requested via flow: ${randomModeKey}`);
					await this.sendCommand(randomMode);
					return callback(null, true);
				} catch (error) {
					return callback(error);
				}
			});
		// registrer the capability listeners
		this.registerCapabilityListener('onoff', async (value) => {
			try {
				this.log(`on/off requested: ${value}`);
				if (value) {
					// write command 'on' to the peripheral
					await this.sendCommand(this.ds.on);
				} else {
					// write command 'off' to the peripheral
					await this.sendCommand(this.ds.off);
				}
				return Promise.resolve(true);
			} catch (error) {
				return Promise.reject(error);
			}
		});
		this.registerCapabilityListener('dim', async (value) => {
			try {
				this.log(`dim requested: ${value}`);
				await this.sendCommand(this.ds.dimLevel(value));
				return Promise.resolve(true);
			} catch (error) {
				return Promise.reject(error);
			}
		});
		this.registerCapabilityListener('mode', async (value) => {
			try {
				this.log(`mode change requested: ${value}`);
				await this.sendCommand(this.ds.mode[value]);
				const tokens = {
					mode: value,
				};
				this.modeChangedTrigger
					.trigger(this, tokens)
					.catch((error) => {
						this.error('trigger error', error);
					});
				return Promise.resolve(true);
			} catch (error) {
				return Promise.reject(error);
			}
		});
	}

}

module.exports = BLELightDevice;
