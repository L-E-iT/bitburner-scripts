/** @param {NS} ns */
export async function main(ns) {
	let servers = await deepscan(ns, "home")
	let hackedServers = []
	for (let i = 0; i < servers.length; ++i) {
		if (ns.hasRootAccess(servers[i])) {
			hackedServers.push(servers[i])
		}
	};
	return hackedServers
}

export async function deepscan(ns, host, servers = []) {
	servers.push(host)
    ns.scan(host).forEach(async (s) => !servers.includes(s)
	 ? await deepscan(ns, s, servers) : null);
	return servers;
}