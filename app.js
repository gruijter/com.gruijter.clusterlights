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

const ble = Homey.ManagerBLE;

async function discoverBle() {
	try {
		// discover all peripherals that advertise a service fff0
		const list = await ble.discover(['fff0']);
		console.log(list);
		// connect to the first peripheral
		const peripheral = await list[0].connect();
		console.log(peripheral);
		// // write command 'off' to the peripheral
		// await peripheral.write('fff0', 'fff1', Buffer.from('01010100', 'hex'));

		// discoverAllServicesAndCharacteristics
		const sac = await peripheral.discoverAllServicesAndCharacteristics();
		// console.log(sac);

		// get the service in alternative way
		const service = sac.filter(serv => serv.uuid === 'fff0');
		console.log(service);

		// // get the service > doesn't work!!!
		// const service = await peripheral.getService('fff0');
		// console.log(service);

		// discover the characteristics
		const chars = await service[0].discoverCharacteristics();
		console.log(chars);

		// // write command 'off' to the peripheral
		// await service[0].write('fff1', Buffer.from('01010100', 'hex'));

		// write command 'on' to the peripheral
		await service[0].write('fff1', Buffer.from('01010101', 'hex'));

		// disconnect the peripheral:
		await peripheral.disconnect();
		console.log('disconnected and finished');

	} catch (error) {
		console.log(error);
	}
}

class MyApp extends Homey.App {

	onInit() {
		this.log('MyApp is running...');
		// discoverBle();
	}

}

module.exports = MyApp;

