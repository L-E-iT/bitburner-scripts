/** @param {NS} ns */
export async function main(ns) {
	let servers = await deepscan(ns, "home")
	let hackedServers = []
	for (let i = 0; i < servers.length; ++i) {
		let hackLevel = ns.getServerRequiredHackingLevel(servers[i])
		let portNum = ns.getServerNumPortsRequired(servers[i])
		let hacked = await getRoot(servers[i], hackLevel, portNum, ns)
		if (hacked) {
			hackedServers.push(servers[i])
		}
	};
	return hackedServers
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

	if ( portNum < 4) {
		ns.brutessh(server)
		ns.ftpcrack(server)
		ns.httpworm(server)
		ns.relaysmtp(server)
		ns.sqlinject(server)
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