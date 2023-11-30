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

'use strict';

const GenericDriver = require('../../lib/generic_driver');

const driverSpecifics = {
	LEDserviceUuid: 'fff0', // '0000fff000001000800000805f9b34fb',
};

class ClusterLightDriver extends GenericDriver {
	onInit() {
		this.log('ClusterLightDriver onInit');
		this.ds = driverSpecifics;
	}
}

module.exports = ClusterLightDriver;
