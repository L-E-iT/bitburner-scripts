var ram = 256;
var i = 0;

var pServers = getPurchasedServers();

for (var j = 0; j < pServers.length; ++j) {
	scriptKill("hack.script", pServers[j])
	deleteServer(pServers[j])
}

// Let the servers drain. Takes about 10 seconds
sleep(10)

while (i < getPurchasedServerLimit()) {
    if (getServerMoneyAvailable("home") > getPurchasedServerCost(ram)) {
        purchaseServer("pserv-256gb-" + i, ram);
        ++i
    }
}