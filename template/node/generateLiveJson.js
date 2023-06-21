const fs = require('fs');

async function generateLiveJson() {

    let headers = new Headers({});
    if (process?.env?.ENV_GITHUB_TOKEN != null) {
        headers = new Headers({
            "Authorization": `Bearer ${process.env.ENV_GITHUB_TOKEN}`,
        });
    }

    console.log('Fetching Members');
    const nmscdMembersResponse = await fetch('https://api.github.com/orgs/NMSCD/members', { method: 'GET', headers: headers });
    const nmscdMembersInitialJson = await nmscdMembersResponse.json();
    const nmscdMembersWithoutNamesJson = nmscdMembersInitialJson.map(m => ({
        id: m.id,
        username: m.login,
        imgUrl: m.avatar_url,
        detailsUrl: m.url,
        url: m.html_url,
    }));

    const nmscdMembersJson = []
    for (const nmscdMember of nmscdMembersWithoutNamesJson) {
        const nmscdMemberResponse = await fetch(nmscdMember.detailsUrl);
        const nmscdMemberJson = await nmscdMemberResponse.json();
        nmscdMembersJson.push({
            id: nmscdMember.id,
            url: nmscdMember.url,
            imgUrl: nmscdMember.imgUrl,
            username: nmscdMember.username,
            name: nmscdMemberJson.name ?? nmscdMember.username,
        });
        nmscdMember.name = nmscdMemberJson.name;
    }

    let fullJson = {
        members: nmscdMembersJson,
    };

    fs.writeFile('./template/data/live.json', JSON.stringify(fullJson, null, 2), ['utf8'], () => { });
}

require('dotenv').config();

generateLiveJson();