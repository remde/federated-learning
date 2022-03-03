const dockerService = require('./docker-service');
fs = require('fs');

const NODES = ['ffremde01', 'ffremde02', 'ffremde03', 'ffremde-master'];

observe = async () => {
    const containerInfos = await dockerService.getAllContainerInfo(NODES);

    while(await anyContainerIsRunning()) {
        for (const containerInfo of containerInfos) {
            const stats = await dockerService.getContainerStats(containerInfo.host, containerInfo.ID);
            containerInfo.stats.push(stats);
        }
        console.info(containerInfos);
        await sleep(2000);
    }

    fs.writeFile('filename', containerInfos);
}

const anyContainerIsRunning = async () => {
    const containerInfos = await dockerService.getAllContainerInfo(NODES);
    return containerInfos.some(containerInfo => containerInfo.state === 'running');
}

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = observe();
