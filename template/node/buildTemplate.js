const fs = require('fs');
const util = require('util');
const Handlebars = require('handlebars');
const readFile = util.promisify(fs.readFile);

async function buildTemplates() {
    process.env['NODE_ENV'] = require('../../package.json').version;
    Handlebars.registerHelper('date', require('../handlebar/helpers/date.helper.js'));
    Handlebars.registerHelper('loud', require('../handlebar/helpers/loud.helper.js'));
    Handlebars.registerHelper('urlref', require('../handlebar/helpers/urlref.helper.js'));
    Handlebars.registerHelper('version', require('../handlebar/helpers/version.helper.js'));
    Handlebars.registerHelper('urlrefescaped', require('../handlebar/helpers/urlrefescaped.helper.js'));

    Handlebars.registerPartial('components/documentHead', require('../handlebar/components/documentHead.hbs'));
    Handlebars.registerPartial('components/schemaOrg', require('../handlebar/components/schemaOrg.hbs'));
    Handlebars.registerPartial('components/header', require('../handlebar/components/header.hbs'));
    Handlebars.registerPartial('components/project', require('../handlebar/components/project.hbs'));
    Handlebars.registerPartial('components/member', require('../handlebar/components/member.hbs'));
    Handlebars.registerPartial('components/footer', require('../handlebar/components/footer.hbs'));
    Handlebars.registerPartial('components/scripts', require('../handlebar/components/scripts.hbs'));

    const siteDataContents = await readFile('./template/data/site.json', 'utf8');
    const liveDataContents = await readFile('./template/data/live.json', 'utf8');
    const projectsContents = await readFile('./template/data/projects.json', 'utf8');

    const siteData = JSON.parse(siteDataContents);
    const liveData = JSON.parse(liveDataContents);
    const projects = JSON.parse(projectsContents);

    const humansArray = [];
    for (const humanKey in siteData.humans) {
        if (Object.hasOwnProperty.call(siteData.humans, humanKey)) {
            humansArray.push(siteData.humans[humanKey]);
        }
    }

    const projectData = {
        ...siteData,
        ...liveData,
        ...projects,
        humansArr: humansArray
    };

    const files = [
        { src: 'index.html.hbs', dest: 'index.html' },
        { src: 'terms_and_conditions.html.hbs', dest: 'terms_and_conditions.html' },
        { src: 'privacy_policy.html.hbs', dest: 'privacy_policy.html' },
        { src: '404.html.hbs', dest: '404.html' },

        { src: 'htaccess.hbs', dest: '.htaccess' },
        { src: 'humans.txt.hbs', dest: 'humans.txt' },
        { src: 'opensearch.xml.hbs', dest: 'opensearch.xml' },
        { src: 'manifest.json.hbs', dest: 'manifest.json' },
        { src: 'site.webmanifest.hbs', dest: 'site.webmanifest' },
        { src: 'sitemap.xml.hbs', dest: 'sitemap.xml' },
        { src: 'serviceWorker.js.hbs', dest: 'serviceWorker.js' },
    ];

    for (const fileObj of files) {
        const template = await readFile(`./template/handlebar/${fileObj.src}`, 'utf8');
        const templateFunc = Handlebars.compile(template);
        const templateData = {
            ...projectData,
            allItems: []
        };
        const compiledTemplate = templateFunc(templateData);
        fs.writeFile(`./public/${fileObj.dest}`, compiledTemplate, ['utf8'], () => { });
    }

    for (const redirect of projectData.redirects) {
        if (!fs.existsSync(`./public/${redirect.pattern}`)) {
            fs.mkdirSync(`./public/${redirect.pattern}`);
        }

        const template = await readFile('./template/handlebar/redirect.hbs', 'utf8');
        const templateFunc = Handlebars.compile(template);
        const templateData = {
            title: redirect.pattern,
            url: redirect.url
        };

        const compiledTemplate = templateFunc(templateData);
        fs.writeFile(`./public/${redirect.pattern}/index.html`, compiledTemplate, ['utf8'], () => { });
    }
}

buildTemplates()