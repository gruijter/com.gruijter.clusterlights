/*
Copyright 2018 - 2021, Robin de Gruijter (gruijter@hotmail.com)

This file is part of com.gruijter.clusterlights.

com.gruijter.clusterlights is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

com.gruijter.clusterlights is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with com.gruijter.clusterlights.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

const util = require('util');

const setTimeoutPromise = util.promisify(setTimeout);

// SimpleQ represents a queue
class SimpleQ {

	constructor(opts) {
		if (!opts.methodClass) throw Error('You need to pass a methodClass (e.g. this)');
		this.methodClass = opts.methodClass;	// class containing all used command methods
		this.stopOnError = !!opts.stopOnError;	// will stop the queue on any error
		this.maxLength = opts.maxLength || 10;
		this.nextWait = opts.nextWait || 0;	// in ms
		this.lastWill = opts.lastWill;	// { command: 'start', args: { temperature: 20 }, wait: 30000 }
		if (this.lastWill) this.lastWill.isLastWill = true;
		this.queue = [];	// contains items
		this.head = 0;
		this.tail = 0;
		this.queueRunning = false;
	}

	async enQueue(item) {
		if (this.tail >= this.maxLlength) {
			throw Error('queue overflow');
		}
		this.queue[this.tail] = item;
		this.tail += 1;
		if (!this.queueRunning) {
			this.queueRunning = true;
			this.runQueue();
		}
	}

	deQueue() {
		const size = this.tail - this.head;
		if (size <= 0) return undefined;
		const item = this.queue[this.head];
		delete this.queue[this.head];
		this.head += 1;
		// Reset the counter
		if (this.head === this.tail) {
			this.head = 0;
			this.tail = 0;
		}
		return item;
	}

	flushQueue() {
		this.queue = [];
		this.head = 0;
		this.tail = 0;
		this.queueRunning = false;
		return 'Queue is flushed';
	}

	async queueLastWill() {
		if (!this.lastWill || this.lastItem.isLastWill) return;
		if (this.lastWillTimeout) { // kill running last will
			clearTimeout(this.lastWillTimeout);
			this.lastWillTimeout = null;
		}
		this.lastWillTimeout = setTimeout(() => {
			this.enQueue(this.lastWill);
		}, this.lastWill.wait || 0);
	}

	async runQueue() {
		try {
			this.queueRunning = true;
			const item = this.deQueue();
			if (item) {
				this.lastItem = item;
				await this.methodClass[item.command](item.args)
					.catch((error) => {
						if (this.stopOnError) throw Error(error);
						console.dir(error);
					});
				if (this.nextWait) await setTimeoutPromise(this.nextWait);
				this.runQueue();
			} else {
				// console.log('Finshed queue');
				this.queueRunning = false;
				this.queueLastWill(); // add last will
			}
		} catch (error) {
			this.queueRunning = false;
			throw Error(error);
		}
	}

}

module.exports = SimpleQ;

// command = 'stop';
// args = {
// 	temperature: 22,
// };
// this.enQueue({ command, args });
