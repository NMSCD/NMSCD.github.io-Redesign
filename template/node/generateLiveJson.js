const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

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

    const membersImgFolder = './public/assets/img/members/';
    if (!fs.existsSync(membersImgFolder)) {
        fs.mkdirSync(membersImgFolder);
    }

    const nmscdMembersJson = [];
    const nmscdMembersImgTasks = [];
    for (const nmscdMember of nmscdMembersWithoutNamesJson) {
        const nmscdMemberResponse = await fetch(nmscdMember.detailsUrl);
        const nmscdMemberJson = await nmscdMemberResponse.json();
        const memberImg = `/assets/img/members/${nmscdMember.id}.png`;
        nmscdMembersJson.push({
            id: nmscdMember.id,
            url: nmscdMember.url,
            imgUrl: memberImg,
            username: nmscdMember.username,
            name: nmscdMemberJson.name ?? nmscdMember.username,
        });
        nmscdMembersImgTasks.push(downloadImage(nmscdMember.imgUrl, `./public${memberImg}`, 175, 175));
    }

    let fullJson = {
        members: nmscdMembersJson,
    };

    await Promise.all(nmscdMembersImgTasks);

    fs.writeFile('./template/data/live.json', JSON.stringify(fullJson, null, 2), ['utf8'], () => { });
}

async function downloadImage(url, imagePath, imgWidth = null, imgHeight = null) {
    const image = await loadImage(url);
    const localImgWidth = imgWidth ?? image.width;
    const localImgHeight = imgHeight ?? image.height;

    const canvas = createCanvas(localImgWidth, localImgHeight);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
        image,
        0, 0,
        localImgWidth,
        localImgHeight
    );

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(imagePath, buffer);
};

require('dotenv').config();

generateLiveJson();