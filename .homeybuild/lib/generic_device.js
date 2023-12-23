/*
Copyright 2018 - 2023, Robin de Gruijter (gruijter@hotmail.com)

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

const { Device } = require('homey');

const Q = require('./simpleq');

// const util = require('util');

// const setTimeoutPromise = util.promisify(setTimeout);
// await setTimeoutPromise(dly).then(() => this.disconnect());

/**
 * Converts hsb data to rgb object.
 * @param {number} hue Hue [0 - 1]
 * @param {number} sat Saturation [0 - 1]
 * @param {number} dim Brightness [0 - 1]
 * @returns {object} RGB object. [0 - 255]
 */
const hsbToRgb = (hue, sat, dim) => {
	let red;
	let green;
	let blue;
	const i = Math.floor(hue * 6);
	const f = hue * 6 - i;
	const p = dim * (1 - sat);
	const q = dim * (1 - f * sat);
	const t = dim * (1 - (1 - f) * sat);
	switch (i % 6) {
		case 0: red = dim; green = t; blue = p;	break;
		case 1: red = q; green = dim; blue = p;	break;
		case 2: red = p; green = dim; blue = t; break;
		case 3: red = p; green = q; blue = dim; break;
		case 4: red = t; green = p; blue = dim; break;
		case 5: red = dim; green = p; blue = q; break;
		default: red = dim; green = dim; blue = dim;
	}
	const r = Math.round(red * 255);
	const g = Math.round(green * 255);
	const b = Math.round(blue * 255);
	const rgbHexString = `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
	return {
		r, g, b, rgbHexString,
	};
};

class BLELightDevice extends Device {

	// connect to the peripheral, and return the service
	async connectService() {
		try {
			// first time BLE device is in range since app start
			if (!this.advertisement) this.advertisement = await this.homey.ble.find(this.getData().id);
			// connect and get service if not connected
			const connected = this.advertisement && this.peripheral && (this.peripheral.state === 'connected');
			if (!connected) {
				this.log('connecting to peripheral');
				this.peripheral = await this.advertisement.connect();
				await this.peripheral.discoverAllServicesAndCharacteristics();
				this.ledService = await this.peripheral.getService(this.ds.LEDserviceUuid);
			} // else this.log('already connected');
			if (!this.ledService) {
				await this.peripheral.discoverAllServicesAndCharacteristics();
				this.ledService = await this.peripheral.getService(this.ds.LEDserviceUuid);
			}
		} catch (error) {
			this.peripheral = null;
			this.error(error.message);
			// this.setUnavailable('could not connect to light');
		}
	}

	async disconnect() {
		if (this.peripheral && (this.peripheral.state === 'connected')) {
			this.log('disconnecting from peripheral');
			await this.peripheral.disconnect().catch(this.error);
		}
		return Promise.resolve(true);
	}

	async sendCommand(command) {
		try {
			await this.connectService();
			if (this.peripheral && this.ledService) await this.ledService.write(this.ds.LEDControlCharacteristicUuid, command);
		} catch (error) {
			this.error(error);
			this.disconnect().catch(this.error);
		}
	}

	// this method is called when the Device is inited
	async onInitDevice() {
		try {
			this.log('device init: ', this.getName(), 'id:', this.getData().id);
			this.registerListeners();
			const qOpts = {
				methodClass: this,
				stopOnError: true,
				maxLength: 10,
				nextWait: 0,
				lastWill: { command: 'disconnect', wait: 30000 },
			};
			this.queue = new Q(qOpts);
			this.advertisement = undefined;
			this.peripheral = undefined;	// is a device (connected or unconnected)
			this.ledService = undefined;
			this.queue.enQueue({ command: 'connectService' });
		} catch (error) {
			this.error(error);
		}
	}

	async onAdded() {
		this.log(`${this.getName()} has been added`);
	}

	/**
	 * onSettings is called when the user updates the device's settings.
	 * @param {object} event the onSettings event data
	 * @param {object} event.oldSettings The old settings object
	 * @param {object} event.newSettings The new settings object
	 * @param {string[]} event.changedKeys An array of keys changed since the previous version
	 * @returns {Promise<string|void>} return a custom message that will be displayed
	 */
	async onSettings() {
		this.log(`${this.getName()} settings where changed`);
	}

	/**
	 * @param {string} name The new name
	 */
	async onRenamed(name) {
		this.log(`${name} was renamed`);
	}

	async onDeleted() {
		this.log(`${this.getName()} has been deleted`);
	}

	async changeMode(args, source) {
		this.log(`${args.device.getName()} mode change requested via ${source}: ${args.mode_dropdown}`);
		const command = 'sendCommand';
		const cargs = args.device.ds.mode[args.mode_dropdown];
		this.queue.enQueue({ command, args: cargs });
		// await this.sendCommand(args.device.ds.mode[args.mode_dropdown]);
		return Promise.resolve(true);
	}

	changeRandomMode(args, source) {
		const modesArray = Object.entries(this.getSettings()).filter((key) => key[1]);
		if (modesArray.length < 1) throw Error('no modes available, check device settings');
		const randomModeKey = modesArray[Math.floor(Math.random() * modesArray.length)][0];
		const randomMode = args.device.ds.mode[randomModeKey];
		this.log(`${args.device.getName()} random mode change requested via ${source}: ${randomModeKey}`);
		const command = 'sendCommand';
		const cargs = randomMode;
		this.queue.enQueue({ command, args: cargs });
		// args.device.sendCommand(randomMode);
		return Promise.resolve(true);
	}

	onOff(onOff, source) {
		this.log(`${this.getName()} on/off requested via ${source}: ${onOff}`);
		if (onOff) {
			// write command 'on' to the peripheral
			const command = 'sendCommand';
			const cargs = this.ds.on;
			this.queue.enQueue({ command, args: cargs });
			// this.sendCommand(this.ds.on);
		} else {
			// write command 'off' to the peripheral
			const command = 'sendCommand';
			const cargs = this.ds.off;
			this.queue.enQueue({ command, args: cargs });
			// this.sendCommand(this.ds.off);
		}
		return Promise.resolve(true);
	}

	dim(value, source) {
		this.log(`${this.getName()} dim requested via ${source}: ${value}`);
		const command = 'sendCommand';
		const cargs = this.ds.dimLevel(value);
		this.queue.enQueue({ command, args: cargs });
		// this.sendCommand(this.ds.dimLevel(value));
		return Promise.resolve(true);
	}

	dimHueSat(values, source) {
		this.log(`${this.getName()} dim/hue/set requested via ${source}`);
		const hue = values.light_hue || this.getCapabilityValue('light_hue');
		const sat = values.light_saturation || this.getCapabilityValue('light_saturation');
		const dim = values.dim || this.getCapabilityValue('dim');
		const rgbValue = hsbToRgb(hue, sat, dim);
		const command = 'sendCommand';
		const cargs = this.ds.setRgb(rgbValue);
		this.queue.enQueue({ command, args: cargs });
		// this.sendCommand(this.ds.setRgb(rgbValue));
		return Promise.resolve(true);
	}

	mode(value, source) {
		this.log(`${this.getName()} mode requested via ${source}: ${value}`);
		const command = 'sendCommand';
		const cargs = this.ds.mode[value];
		this.queue.enQueue({ command, args: cargs });
		// this.sendCommand(this.ds.mode[value]);
		return Promise.resolve(true);
	}

	// register capability listeners
	async registerListeners() {
		this.log('registering capability listeners');
		// capabilityListeners will be overwritten, so no need to unregister them
		this.registerCapabilityListener('onoff', (onOff) => this.onOff(onOff, 'app'));

		if (this.ds.setRgb) {
			this.registerMultipleCapabilityListener(['dim', 'light_hue', 'light_saturation'], (values) => {
				this.dimHueSat(values, 'app');
			}, 500);
		} else this.registerCapabilityListener('dim', (value) => this.dim(value, 'app'));

		this.registerCapabilityListener('mode', (value) => this.mode(value, 'app'));
	}

}

module.exports = BLELightDevice;
