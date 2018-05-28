const generateEpub = require('./epub')
const generateMobi = require('./mobi')
const buildEbook = require('./buildEbook')
const getHtml = require('./crawler')
const filterHtml = require('./parser')
const getAbsoluteUrl = require('./getAbsoluteUrl')
const fs = require('fs')

function start(){
    const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    if(!config.bookList && config.bookUrl){
        return buildNextEbook({urls: [config.bookUrl], config})
    }

    const {url, bookLink} = config.bookList;
    getHtml({url})
        .then(html => filterHtml({html, selectors: {bookLink}, url}))
        .then(results => buildNextEbook({
            urls: results.bookLink.map(link => getAbsoluteUrl({urlWithDomain: url, relativeUrl: link})),
            config
        }))
}

function buildNextEbook({urls, config}){
    const url = urls.shift()
    return buildEbook({url, config, prevUrls: [url]})
        .then(ebook => generateEpub(ebook))
        .then(epub => generateMobi({input: epub, output: epub.replace(/\.epub$/, '.mobi')}))
        .catch(e => console.error(e))
        .then(() => {
            if(urls.length) buildNextEbook({urls, config})
        });
}

module.exports = start
