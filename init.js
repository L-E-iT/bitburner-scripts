/** @param {NS} ns */
import { Servers } from "./lib/servers.js"
import {Orchestrator} from "./lib/orchestrator.js"

export async function main(ns) {
	const server = new Orchestrator(ns, [
		"iron-gym",
		"omega-net",
		"silver-helix",
		"phantasy",
		"max-hardware"
	]);
	await server.deploy(ns)
}