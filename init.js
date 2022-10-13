/** @param {NS} ns */
import {Servers} from "./lib/servers.js"
import {Orchestrator} from "./lib/orchestrator.js"

export async function main(ns) {
	let currentServers = []

	while (true) {
		let servers = new Servers(ns)
		let serversToHack = servers.hackedServerObjects;
		// don't want to hack home, or pservs, or poor servers
		serversToHack = serversToHack.filter((server) =>
		server.hostname !== "home"
		&& !server.hostname.includes("pserv")
		&& server.moneyMax !== 0
		)
		// remove all servers that aren't at 1/3 of our hacking level or lower
		serversToHack = serversToHack.reduce((serversToHack, server) => {
			if (server.requiredHackingSkill <= (ns.getHackingLevel() / 3)) {
				return [...serversToHack, server]
			} else {
				return serversToHack
			}
		}, []);
		// Order our servers from highest hack level to lowest.
		serversToHack = serversToHack.sort((a,b) => b.requiredHackingSkill-a.requiredHackingSkill).slice(0,8);
		serversToHack = serversToHack.reduce((names, server) => {
			return [...names, server.hostname]
		}, []);

		// If our servers are different, run a new deployment
		ns.tprint(serversToHack)
		ns.tprint(currentServers)
		if (!areEqual(serversToHack, currentServers)) {
			ns.tprint("running a new deployment with " + serversToHack)
			await run(ns, serversToHack);
			currentServers = serversToHack
		} else {
			ns.tprint("No need to re-deploy")
		}

		// Every 20 minutes check to make sure we are running on the right servers still.
		await ns.sleep(1.2e6)
		// await ns.sleep(1000)
	}
}

// run :D
export async function run(ns, serversToHack) {
	const orchestrator = new Orchestrator(ns, serversToHack);
	await orchestrator.deploy(ns)
}


function areEqual(array1, array2) {
  if (array1.length === array2.length) {
    return array1.every(element => {
      if (array2.includes(element)) {
        return true;
      }
      return false;
    });
  }
  return false;
}