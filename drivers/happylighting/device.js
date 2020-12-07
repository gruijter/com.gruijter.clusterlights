/*
Copyright 2018 - 2020, Robin de Gruijter (gruijter@hotmail.com)

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

const BLELightDevice = require('../../lib/ble_light_device.js');

const deviceSpecifics = {
	LEDserviceUuid: 'ffd5',
	LEDControlCharacteristicUuid: 'ffd9',
	on: Buffer.from('cc2333', 'hex'),
	off: Buffer.from('cc2433', 'hex'),
	mode: {
		stayOff:	Buffer.from('cc2433', 'hex'),	// combi // not used
		wave:	Buffer.from('bb2d0f44', 'hex'),	// pulsating red/green
		phase:	Buffer.from('bb380f44', 'hex'), // rainbow jumping
		phasedFadeAway:	Buffer.from('bb250f44', 'hex'), // pulsating rainbow
		phasedTwinkle:	Buffer.from('bb300f44', 'hex'),	// rainbow strobe
		fadeAway:	Buffer.from('bb2c0f44', 'hex'),	// fade away
		fastTwinkle: Buffer.from('bb370544', 'hex'),	// white strobe
		stayOn:	Buffer.from('56ffffff00f0aa', 'hex'),	// RGB full
	},
	dimLevel: (value) => {
		const dimMode = {
			25: Buffer.from('56101000foaa', 'hex'),
			50: Buffer.from('5630303000f0aa', 'hex'),
			75: Buffer.from('5677777700f0aa', 'hex'),
			100: Buffer.from('6ffffff00f0aa', 'hex'),
			125: Buffer.from('56ffffff00f0aa', 'hex'),
		};
		if ((value < 0) || (value > 1)) {
			return new Error('value must be between 0 and 1');
		}
		const dim = 25 * (Math.floor(4 * value) + 1);
		const levelBuffer = dimMode[dim];
		return levelBuffer;
	},
};

class HappyDevice extends BLELightDevice {

	onInit() {
		// this.log('LumineoDevice onInit');
		this.ds = deviceSpecifics;
		this.onInitDevice();
	}

}

module.exports = HappyDevice;
