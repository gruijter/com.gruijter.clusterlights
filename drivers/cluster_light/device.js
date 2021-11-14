/*
Copyright 2018 - 2021, Robin de Gruijter (gruijter@hotmail.com)

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

const GenericDevice = require('../../lib/generic_device.js');

const deviceSpecifics = {
	LEDserviceUuid: 'fff0',
	LEDControlCharacteristicUuid: 'fff1',
	on: Buffer.from('01010101', 'hex'),
	off: Buffer.from('01010100', 'hex'),
	mode: {
		stayOff:	Buffer.from('0501020300', 'hex'),	// not used, makes no sense :)
		wave:	Buffer.from('0501020301', 'hex'),
		phase:	Buffer.from('0501020302', 'hex'),
		phasedFadeAway:	Buffer.from('0501020304', 'hex'),
		phasedTwinkle:	Buffer.from('0501020308', 'hex'),
		fadeAway:	Buffer.from('0501020310', 'hex'),
		fastTwinkle: Buffer.from('0501020320', 'hex'),
		stayOn:	Buffer.from('0501020340', 'hex'),
	},
	dimLevel: (value) => {
		const dimBase = '030101';
		if ((value < 0) || (value > 1)) {
			return new Error('value must be between 0 and 1');
		}
		const dimDecimal = parseInt((10 + value * 89), 10); // level between 10 and 99
		const dimHex = (dimDecimal).toString(16).padStart(2, '0');
		const levelBuffer = Buffer.from(dimBase + dimHex, 'hex');
		return levelBuffer;
	},
};

class ClusterLightDevice extends GenericDevice {

	onInit() {
		// this.log('ClusterLightDevice onInit');
		this.ds = deviceSpecifics;
		this.onInitDevice();
	}

}

module.exports = ClusterLightDevice;

// const dimMin = Buffer.from('03010101', 'hex');	// decimal 1
// const dimMax = Buffer.from('03010163', 'hex');	// decimal 99
