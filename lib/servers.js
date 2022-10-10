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
		return maxAvailMemory
	}

	getTotalUnusedMemory() {
		return this.getMaxAvailableMemory() - this.getTotalUsedMemory()
	}

	getTotalUsedMemory() {
		let usedMemory = 0
		this.hackedServerObjects.forEach((server) => {
			usedMemory = usedMemory + Number(server.ramUsed)
		});
		return usedMemory
	}

	// Should get a map of servers to run our script across
	// Should only find the exact amount of threads across servers it needs and not over-consume
	// Careful. The spaghetti is fragile and this really needs some cleanup work.
	getServerSpaceForScript(scriptMemory, threads) {

		if (this.getTotalUnusedMemory() < (scriptMemory * threads)) {
			return null
		}

		let serversToRunOn = []
		let totalMemory = scriptMemory * threads
		let neededThreads = threads

		this.hackedServerObjects.forEach((server) => {
			if (neededThreads > 0) {
				const availMemory = server.maxRam - server.ramUsed

				let serverThreads = Math.floor(availMemory / scriptMemory)
				let usedMemory = serverThreads * scriptMemory

				if (usedMemory > totalMemory) {
					let excessThreads = (usedMemory - totalMemory) / threads
					serverThreads = serverThreads - excessThreads
					usedMemory = serverThreads * scriptMemory
				}

				if (serverThreads >= 1) {
					serversToRunOn.push({
						"server": server.hostname,
						"threads": serverThreads
					});
					neededThreads = neededThreads - serverThreads
				}

				totalMemory = totalMemory - usedMemory
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
					"growBy": .75 - moneyPercent,
					"multiplier": Math.ceil(.75 / moneyPercent),
					"threadsNeeded": ns.growthAnalyze(server.hostname, (.75 / moneyPercent))
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
					"threadsToHack": 1 / ns.hackAnalyze(server.hostname)
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
					"threadsToWeaken": Math.ceil(diffSecurity / 0.05)
				}
				return [...serversToWeaken, newServer]
			}
			return serversToWeaken
		}, []);
	}
}

export {Servers}