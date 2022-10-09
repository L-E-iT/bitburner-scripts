/** @param {NS} ns */
export async function main(ns) {
	let servers = ns.scan("home")
	servers = servers.filter((server) => server.includes("pserv"))
	servers.forEach((server) => {
		let reqMem = ns.getScriptRam("early-hack-template.script");
		let availMem = ns.getServerMaxRam(server);
		let threads = Math.floor(availMem / reqMem);
		ns.scp("early-hack-template.script", server);
		ns.exec("early-hack-template.script", server, threads);
	});
}