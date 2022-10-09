/** @param {NS} ns */
export async function main(ns) {
	let servers = ns.scan("home")
	servers.forEach((server) => {
		// Assumption is that your script is in the home directory
		let reqMem = ns.getScriptRam("hack.script");
		let availMem = ns.getServerMaxRam(server);
		let threads = Math.floor(availMem / reqMem);
		ns.scp("hack.script", server);
		ns.exec("hack.script", server, threads);
	});
}