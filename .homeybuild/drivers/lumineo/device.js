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

const GenericDevice = require('../../lib/generic_device');

const deviceSpecifics = {
	LEDserviceUuid: '1000',
	LEDControlCharacteristicUuid: '1001',
	on: Buffer.from('54507e87292b', 'hex'),
	off: Buffer.from('545020d97774', 'hex'),
	mode: {
		stayOff:	Buffer.from('5450eb12bebe', 'hex'),	// combi // not used
		wave:	Buffer.from('545043ba1615', 'hex'),	// waves
		phase:	Buffer.from('5450827bd7d5', 'hex'),	// sequence
		phasedFadeAway:	Buffer.from('545007fe5257', 'hex'), // slowglow
		phasedTwinkle:	Buffer.from('54500bf25e5a', 'hex'), // chaseflash
		fadeAway:	Buffer.from('5450f60fa3a4', 'hex'),	// slowfade
		fastTwinkle: Buffer.from('54509f66cacc', 'hex'),	// twinkleflash
		stayOn:	Buffer.from('54511de448414a', 'hex'),	// steadydimmer
	},
	dimLevel: (value) => {
		const dimMode = {
			25: Buffer.from('5451f009a5aca4', 'hex'),
			50: Buffer.from('545158a10d040d', 'hex'),
			75: Buffer.from('5451a45df1f8f2', 'hex'),
			100: Buffer.from('545169903c353e', 'hex'),
			125: Buffer.from('545169903c353e', 'hex'),
		};
		if ((value < 0) || (value > 1)) {
			return new Error('value must be between 0 and 1');
		}
		const dim = 25 * (Math.floor(4 * value) + 1);
		const levelBuffer = dimMode[dim];
		return levelBuffer;
	},
};

class LumineoDevice extends GenericDevice {

	onInit() {
		// this.log('LumineoDevice onInit');
		this.ds = deviceSpecifics;
		this.onInitDevice();
	}

}

module.exports = LumineoDevice;

// 25% dim: 54:51:f0:09:a5:ac:a4
// 50% dim: 54:51:58:a1:0d:04:0d
// 75% dim: 54:51:a4:5d:f1:f8:f2
// 100% dim: 54:51:69:90:3c:35:3e

// combi: 54:50:eb:12:be:be
// waves: 54:50:43:ba:16:15
// sequence: 54:50:82:7b:d7:d5
// slowglow: 54:50:07:fe:52:57
// chaseflash: 54:50:0b:f2:5e:5a
// slowfade: 54:50:f6:0f:a3:a4
// twinkleflash: 54:50:9f:66:ca:cc
// steadydimmer: 54:51:1d:e4:48:41:4a
