const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);

const pjson = require('../../package.json');

async function generateFullJson() {
    process.env['NODE_ENV'] = pjson.version;

    const siteDataContents = await readFile('./template/data/site.json', 'utf8');
    const liveDataContents = await readFile('./template/data/live.json', 'utf8');
    const projectsContents = await readFile('./template/data/projects.json', 'utf8');

    const siteData = JSON.parse(siteDataContents);
    const liveData = JSON.parse(liveDataContents);
    const projects = JSON.parse(projectsContents);

    const siteDataFull = {
        ...siteData,
        ...liveData,
        ...projects,
    };

    fs.writeFile(`./template/data/allData.json`, JSON.stringify(siteDataFull, null, 2), ['utf8'], () => { });
}


generateFullJson();
