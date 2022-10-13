/** @param {NS} ns */

import {Servers} from "lib/servers.js"

// 7 weaken
// 2 grow
// 1 hack

class Orchestrator {
	constructor(ns, serversToHack=[]) {
		this._serversToHack = serversToHack
		this._servers = new Servers(ns)

		this._servers.killAllScripts(ns);

		this._memSplit = Math.floor(this._servers.getMaxAvailableMemory() / this._serversToHack.length)

		this._scriptMemoryMap = {
			"weaken": 1.75,
			"grow": 1.75,
			"hack": 1.9
		}
	}

	get serversToHack() {
		return this._serversToHack
	}

	get memSplit() {
		return this._memSplit
	}

	async deploy(ns) {
		await ns.sleep(2000)

		for (const server of this.serversToHack) {
			let actions = [
				{
					"action":"weaken",
					"threads": Math.floor((this.memSplit * .15) / this._scriptMemoryMap["weaken"])
				},{
					"action":"grow",
					"threads": Math.floor((this.memSplit * .8) / this._scriptMemoryMap["grow"])
				},{
					"action":"hack",
					"threads": Math.floor((this.memSplit * .04) / this._scriptMemoryMap["hack"])
				}
			]

			for (const action of actions) {
				let servers = new Servers(ns)
				let serversForAction = servers.getServerSpaceForScript(this._scriptMemoryMap[action["action"]], action["threads"])
				servers.deployScripts(ns, serversForAction, action["action"], server)
				await ns.sleep(1000)
			};
		};
	}
}

export { Orchestrator }