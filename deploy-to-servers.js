/** @param {NS} ns */
import { main as deepscan } from "lib/deepscan.js"

export async function main(ns) {
	let servers = await deepscan(ns)

	servers.forEach((server) => {
		// Assumption is that your script is in the home directory
		ns.killall(server)
		let reqMem = ns.getScriptRam("hack.script");
		let availMem = ns.getServerMaxRam(server);
		let threads = Math.floor(availMem / reqMem);
		if (server === "home") {
			ns.run("hack.script", threads - 4)
		} else {
			ns.scp("hack.script", server);
			ns.exec("hack.script", server, threads);
		}
	});
}