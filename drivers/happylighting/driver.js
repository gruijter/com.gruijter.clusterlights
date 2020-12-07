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

'use strict';

const BLELightDriver = require('../../lib/ble_light_driver.js');

const driverSpecifics = {
	// LEDserviceUuid: 'ffd5',
	localNameFilter: 'Triones',
};

class HappyDriver extends BLELightDriver {
	onInit() {
		this.log('HappyDriver onInit');
		this.ds = driverSpecifics;
	}
}

module.exports = HappyDriver;
