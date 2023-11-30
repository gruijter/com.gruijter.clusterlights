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

const { Driver } = require('homey');

class BLELightDriver extends Driver {

	async discoverLights() {
		this.log('device discovery started');
		try {
			// discover all peripherals that advertise the LEDserviceUuid or fit localNameFilter
			let serviceFilter;
			if (this.ds.LEDserviceUuid)	serviceFilter = [this.ds.LEDserviceUuid];
			let list = await this.homey.ble.discover(serviceFilter);
			if (this.ds.localNameFilter) {
				list = list.filter((dev) => {
					if (!dev.localName) return false;
					return dev.localName.includes(this.ds.localNameFilter);
				});
			}
			const pairList = list.map((light) => {
				const device = {
					name: `${light.uuid}`,
					data: { id: light.uuid },
				};
				return device;
			});
			return Promise.resolve(pairList);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	async onPairListDevices() {
		this.log('pair listing of devices started');
		const devices = await this.discoverLights();
		return devices;
	}

}

module.exports = BLELightDriver;
