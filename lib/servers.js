/** @param {NS} ns */
export async function main(ns) {

}

class Servers {
	constructor(ns) {
		this._servers = this._deepscan(ns, "home")
		this._hackedServers = this._getHackedServers(ns, this.servers)
		this._serverObjects = this._getServerObjs(ns, this.servers)
		this._hackedServerObjects = this._getServerObjs(ns, this.hackedServers)
	}

	get servers() {
		return this._servers
	}

	get hackedServers() {
		return this._hackedServers
	}

	get serverObjects() {
		return this._serverObjects
	}

	get hackedServerObjects() {
		return this._hackedServerObjects
	}

	_deepscan(ns, host, trackedServers = []) {
		trackedServers.push(host)
		ns.scan(host).forEach(async (s) => !trackedServers.includes(s)
		? await this._deepscan(ns, s, trackedServers=trackedServers) : null);
		return trackedServers;
	}

	_getHackedServers(ns, servers) {
		return servers.filter((server) => ns.hasRootAccess(server))
	}

	_getServerObjs(ns, servers) {
		return servers.map((server) => ns.getServer(server))
	}

	getMaxAvailableMemory() {
		let maxAvailMemory = 0
		this.hackedServerObjects.forEach((server) => {
			maxAvailMemory = maxAvailMemory + Number(server.maxRam)
		});
		// Return value should factor in a cushion for dead RAM on each server since we need around 1.75gb
		// to run a server
		return maxAvailMemory - (this.hackedServers.length * 2)
	}

	getTotalUnusedMemory() {
		return this.getMaxAvailableMemory() - this.getUsedMemory()
	}

	getUsedMemory() {
		let usedMemory = 0
		this.hackedServerObjects.forEach((server) => {
			usedMemory = usedMemory + Number(server.ramUsed)
		});
		return usedMemory
	}

	// Should get a map of servers to run our script across
	// Should only find the exact amount of threads across servers it needs and not over-consume
	// Careful. The spaghetti is fragile.
	getServerSpaceForScript(scriptMemory, threads) {
		// This needs to be modified to use memory over thread, I think.
		if (this.getTotalUnusedMemory() < (scriptMemory * threads)) {
			return null
		}

		let serversToRunOn = []
		let memoryNeeded = Math.ceil(scriptMemory * threads)
		let threadsNeeded = threads

		this.hackedServerObjects.forEach((server) => {
			if (threadsNeeded > 0) {
				const availMemory = server.maxRam - server.ramUsed

				// round down and get the amount of threads available on the server
				// based on our memory usage
				let serverThreadsAvailable = Math.floor(availMemory / scriptMemory)

				if (serverThreadsAvailable >= threadsNeeded) {
					serversToRunOn.push({
						"hostname": server.hostname,
						"threads": threadsNeeded
					});
					threadsNeeded = 0
				} else if (serverThreadsAvailable !== 0) {
					serversToRunOn.push({
						"hostname": server.hostname,
						"threads": serverThreadsAvailable
					});
					threadsNeeded = threadsNeeded - serverThreadsAvailable
				}


				// let memoryToBeUsed = serverThreadsAvailable * scriptMemory

				// // If 
				// if (memoryToBeUsed > memoryNeeded) {
				// 	let excessThreads = (memoryToBeUsed - memoryNeeded) / threads
				// 	serverThreadsAvailable = serverThreadsAvailable - excessThreads
				// 	memoryToBeUsed = serverThreadsAvailable * scriptMemory
				// }

				// if (serverThreadsAvailable >= 1) {
				// 	serversToRunOn.push({
				// 		"hostname": server.hostname,
				// 		"threads": Math.floor(serverThreadsAvailable)
				// 	});
				// 	threadsNeeded = threadsNeeded - serverThreadsAvailable
				// }

				// memoryNeeded = memoryNeeded - memoryToBeUsed
			}
		});
		return serversToRunOn
	}

	getAllHackedServersCurrentMoney() {
		return this.hackedServerObjects.map((server) => {
			return {
				"hostname": server.hostname,
				"currentMoney": server.moneyAvailable
			}
		})
	}

	getServersToGrow(ns) {
		return this.hackedServerObjects.reduce((serversToGrow, server) => {
			let moneyPercent = server.moneyAvailable / server.moneyMax
			if (moneyPercent < .75 && server.moneyMax !== 0) {
				let newServer = {
					"hostname": server.hostname,
					"threads": ns.growthAnalyze(server.hostname, (.75 / moneyPercent))
				}
				return [...serversToGrow, newServer]
			}
			return serversToGrow
		}, [])
	}

	getServersToHack(ns) {
		return this.hackedServerObjects.reduce((serversToHack, server) => {
			let targetStrength = ns.getServerMinSecurityLevel(server.hostname)
			let targetMoney = .75

			if (server.hackDifficulty <= targetStrength && (server.moneyAvailable / server.moneyMax) >= targetMoney) {
				let newServer = {
					"hostname": server.hostname,
					"threads": 1 / ns.hackAnalyze(server.hostname)
				} 
				return [...serversToHack, newServer]
			}
			return serversToHack
		}, [])
	}

	getServersToWeaken(ns) {
		return this.hackedServerObjects.reduce((serversToWeaken, server) => {
			let minSecurity = ns.getServerMinSecurityLevel(server.hostname)
			let currentSecurity = server.hackDifficulty
			let diffSecurity = currentSecurity - minSecurity
			if (diffSecurity !== 0) {
				let newServer = {
					"hostname": server.hostname,
					"threads": Math.ceil(diffSecurity / 0.05)
				}
				return [...serversToWeaken, newServer]
			}
			return serversToWeaken
		}, []);
	}

	deployScripts(ns, serverList, action, target) {
		serverList.forEach((server) => {
			let filename = action + ".js"
			ns.scp(filename, server.hostname)
			ns.exec(filename, server.hostname, server.threads, target)
		});
	}

	getScriptMemory(ns, script) {
		return ns.getScriptMemory(script)
	}

	killAllScripts(ns) {
		for (const server of this.hackedServers){
			ns.killall(server);
		};
	}
}

export {Servers}