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

const Homey = require('homey');
// const util = require('util');
const Logger = require('./captureLogs.js');

// const setTimeoutPromise = util.promisify(setTimeout);

class App extends Homey.App {

	onInit() {
		this.logger = new Logger('clusterLights', 200);
		this.log('Cluster Lights App is running!');

		// register some listeners
		process.on('unhandledRejection', (error) => {
			this.error('unhandledRejection! ', error);
		});
		process.on('uncaughtException', (error) => {
			this.error('uncaughtException! ', error);
		});
		Homey
			.on('unload', () => {
				this.log('app unload called');
				// save logs to persistant storage
				this.logger.saveLogs();
			})
			.on('memwarn', () => {
				this.log('memwarn!');
			});
		// do garbage collection every 10 minutes
		this.intervalIdGc = setInterval(() => {
			global.gc();
		}, 1000 * 60 * 10);

		// testBle();
	}

	//  stuff for frontend API
	deleteLogs() {
		return this.logger.deleteLogs();
	}

	getLogs() {
		return this.logger.logArray;
	}

}

module.exports = App;


// async function testBle() {
// 	try {
// 		const ble = Homey.ManagerBLE;

// 		// discover all peripherals that advertise a service fff0
// 		const list = await ble.discover(['fff0']);
// 		// console.log(list);
// 		// connect to the first peripheral
// 		// await setTimeoutPromise(1000, 'waiting is done');
// 		const peripheral = await list[0].connect();
// 		console.log(peripheral);
// 		// // write command 'off' to the peripheral
// 		// await peripheral.write('fff0', 'fff1', Buffer.from('01010100', 'hex'));

// 		// discoverAllServicesAndCharacteristics
// 		const sac = await peripheral.discoverAllServicesAndCharacteristics();
// 		// console.log(sac);
// 		// await setTimeoutPromise(1000, 'waiting is done');

// 		// discoverAllServices
// 		// const services = await peripheral.discoverServices('fff0');
// 		// console.log(services);

// 		const service = await peripheral.getService('fff0');
// 		console.log(service);

// 		// const char = service.discoverCharacteristics('fff1');
// 		// console.log(char);

// 		// // await setTimeoutPromise(1000, 'waiting is done');
// 		// const characteristic = service.getCharacteristic('fff1');
// 		// console.log(characteristic);

// 		// write command 'off' to the characteristic
// 		await service.write('fff1', Buffer.from('01010101', 'hex'));

// 		// // get the service in alternative way
// 		// const service = sac.filter(serv => serv.uuid === 'fff0');
// 		// console.log(service);

// 		// // get the service > doesn't work!!!
// 		// const service = await peripheral.getService('fff0');
// 		// console.log(service);

// 		// // discover the characteristics
// 		// const chars = await service[0].discoverCharacteristics();
// 		// console.log(chars);

// 		// write command 'off' to the peripheral
// 		// await peripheral.write('fff0', characteristicUuid, data);

// 		// // write command 'off' to the peripheral
// 		// await service[0].write('fff1', Buffer.from('01010100', 'hex'));

// 		// // write command 'on' to the peripheral
// 		// await service[0].write('fff1', Buffer.from('01010101', 'hex'));

// 		// // write command 'dim to 100%' to the peripheral
// 		// await service[0].write('fff1', Buffer.from('03010163', 'hex'));

// 		// disconnect the peripheral:
// 		await peripheral.disconnect();
// 		console.log('disconnected and finished');

// 	} catch (error) {
// 		console.log(error);
// 	}
// }
