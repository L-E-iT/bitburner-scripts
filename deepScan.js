/** @param {NS} ns */
export async function main(ns) {
	let servers = await deepscan(ns, "home")
	for (let i = 0; i < servers.length; ++i) {
		let hackLevel = ns.getServerRequiredHackingLevel(servers[i])
		let portNum = ns.getServerNumPortsRequired(servers[i])
		await getRoot(servers[i], hackLevel, portNum, ns)
	};
}

export async function deepscan(ns, host, servers = []) {
	servers.push(host)
    ns.scan(host).forEach(async (s) => !servers.includes(s) && !s.includes('pserv')
	 ? await deepscan(ns, s, servers) : null);
	return servers;
}

export async function getRoot(server, hackLevel, portNum, ns) {
	let returnValue = true
	let enoughPorts = false
	let endPrint = server + " | Hack Level: " + hackLevel +
		" | Ports: " + portNum + " | Root: " +
		ns.hasRootAccess(server)

	if ( portNum <= 1) {
		ns.brutessh(server)
		enoughPorts = true
	} else {
		returnValue = false
	}
	
	if ( hackLevel <= ns.getHackingLevel() && enoughPorts) {
		ns.nuke(server);
		endPrint = endPrint + " | Max Money: " + (ns.getServerMaxMoney(server) /  1000000) + " Million"
	} else {
		returnValue = false
	}

	ns.tprint(endPrint);

	return returnValue


}