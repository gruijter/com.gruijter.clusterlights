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

const LEDserviceUuid = 'fff0';
const LEDControlCharacteristicUuid = 'fff1';
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

	// timer function to disconnect after connection inactivity
	timerStop() {
		if (this.connectionTimer) {
			clearTimeout(this.connectionTimer);
			this.connectionTimer = null;
		}
	}

	timerStart(t) {
		this.timerStop();
		if (t > 0) {
			this.connectionTimer = setTimeout(() => {
				this.connectionTimer = null;
				this.disconnect();
			}, t * 1000);
		}
	}

	// connect to the peripheral, and return the peripheral
	async connect() {
		try {
			if (this.connectionTimer) {
				this.timerStart(30);	// start/reset 30 seconds connection
				return Promise.resolve(this.peripheral);
			}
			this.timerStart(30);	// start/reset 30 seconds connection
			this.log('connecting to peripheral');
			this.advertisement = await Homey.ManagerBLE.find(this.getData().id);
			this.peripheral = await this.advertisement.connect();
			await this.peripheral.discoverAllServicesAndCharacteristics();
			this.LEDservice = await this.peripheral.getService(LEDserviceUuid);
			// this.setAvailable();
			return Promise.resolve(this.peripheral);
		} catch (error) {
			this.log('error connecting');
			// this.setUnavailable('could not connect to light');
			this.disconnect();
			return Promise.reject(error);
		}
	}

	async disconnect() {
		if (this.peripheral && this.peripheral.isConnected) {
			this.log('disconnecting from peripheral');
			await this.peripheral.disconnect();
		}
		return Promise.resolve(true);
	}

	async sendCommand(command) {
		try {
			this.commandQueue.push(command);
			await this.connect();
			while (this.commandQueue.length > 0) {
				const comm = this.commandQueue.shift();
				this.LEDservice.write(LEDControlCharacteristicUuid, comm); // do I need to do await here?
			}
			return Promise.resolve(true);
		} catch (error) {
			this.log(error);
			return Promise.reject(error);
		}
	}

	// this method is called when the Device is inited
	async onInit() {
		try {
			this.log('device init: ', this.getName(), 'id:', this.getData().id);
			this.settings = this.getSettings();
			// migrate from v0.2.0 app
			if (this.settings === {}) {
				this.settings = {
					wave: true,
					phase: true,
					phasedFadeAway: true,
					phasedTwinkle: true,
					fadeAway: true,
					fastTwinkle: true,
					stayOn: true,
				};
				this.setSettings(this.settings)
					.then(this.log('settings migrated from v0.2.0 app'))
					.catch(this.error);
			}
			this.connectionTimer = null;
			this.advertisement = undefined;	// is a link to the device
			this.peripheral = undefined;	// is a device (connected or unconnected)
			this.LEDservice = undefined;	// is a service on the peripheral
			this.commandQueue = [];	// empty command queue
			this.registerFlowcardsAndListeners();	// duh
			await this.connect();	// find and connect the peripheral
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
				this.log(`mode change requested via flow: ${args.mode_dropdown}`);
				await this.sendCommand(mode[args.mode_dropdown]);
				callback(null, true);
			});
		this.changeRandomModeAction = new Homey.FlowCardAction('change_random_mode')
			.register()
			.on('run', async (args, state, callback) => {
				const modesArray = Object.entries(this.settings).filter(key => key[1]);
				if (modesArray.length < 1) {
					return callback(null, true);
				}
				const randomModeKey = modesArray[Math.floor(Math.random() * modesArray.length)][0];
				const randomMode = mode[randomModeKey];
				this.log(`random mode change requested via flow: ${randomModeKey}`);
				await this.sendCommand(randomMode);
				return callback(null, true);
			});
		// registrer the capability listeners
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

module.exports = ClusterLightDevice;
