const dockerService = require('./docker-service');
fs = require('fs');

const NODES = ['ffremde01', 'ffremde02', 'ffremde03', 'ffremde-master'];
const EXPERIMENT_NAME = process.env.EXPERIMENT_NAME.toString();

observe = async () => {
    let containerInfos = await dockerService.getAllContainersInfosWithStats(NODES);

    while(anyContainerIsRunning(containerInfos)) {
        const containerInfosIds = containerInfos.map(containerInfo => containerInfo.ID);
        const updatedContainerInfos = await dockerService.getAllContainersInfosWithStats(NODES);
        const updatedContainerInfosIds = updatedContainerInfos.map(updatedContainerInfo => updatedContainerInfo.ID);

        updatedContainerInfos.forEach(updatedContainerInfo => {
            // If container already retrieved, only update the State,
            // Status, and push the retrieved Stats to the array.
            // Else it's a new container, then add it to the containerInfos list.
            if (containerInfosIds.includes(updatedContainerInfo.ID)) {
                containerInfos.forEach(containerInfo => {
                    if (containerInfo.ID === updatedContainerInfo.ID) {
                        containerInfo.state = updatedContainerInfo.state;
                        containerInfo.status = updatedContainerInfo.status;
                        containerInfo.stats.push(updatedContainerInfo.stats[0]);
                    }
                });
            } else {
                containerInfos.push(updatedContainerInfo);
            }
        });

        // If there is a container in containerInfo which hasn't been retrieved,
        // it means the container stopped. Therefore, we can persist its stats
        // and remove it from the list
        for (const [index, containerInfo] of containerInfos.entries()) {
            if (!updatedContainerInfosIds.includes(containerInfo.ID)) {
                const currentTime = new Date().toISOString();
                const targetDir = `/reports/${EXPERIMENT_NAME}/${containerInfo.image}`;
                fs.mkdirSync(targetDir, { recursive: true });
                fs.writeFileSync(`${targetDir}/${currentTime}-${containerInfo.host}`, JSON.stringify(containerInfo.stats));
                containerInfos.splice(index, 1);
            }
        }
    }
}

const anyContainerIsRunning = (containerInfos) => {
    return containerInfos.some(containerInfo => containerInfo.state === 'running');
}

module.exports = observe();
