const puppeteer = require('puppeteer');
const axios = require('axios');

async function ubuntuRepositorySearch(query) {
    console.log('Searching for ubuntu repository...');
    query = query.toLowerCase();
    let pkgURL;
    const url = `https://packages.ubuntu.com/search?searchon=contents&keywords=${query}&mode=exactfilename&suite=focal&arch=amd64`
    const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36';

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Set the user agent
    await page.setUserAgent(userAgent);
    await page.goto(url);
    await page.waitForSelector('#pcontentsres');

    try {
        const packageInfo = await page.evaluate(() => {
            const packageTable = document.querySelector('#pcontentsres table');
            if (!packageTable) {
                throw new Error('Package not found.');
            }

            return Array.from(packageTable.querySelectorAll('td a')).map(elm => {
                return {
                    title: elm.innerText,
                    url: elm.href,
                }
            })
        });

        const packageFound = packageInfo.find(elm => elm.title === query);
        if (!packageFound) {
            throw new Error('Package not found.');
        }

        const packageTableURL = packageFound.url;
        await page.goto(packageTableURL);
        await page.waitForSelector('#pdownload');

        const amd64URL = await page.evaluate(() => {
            const architectures = Array.from(document.querySelectorAll('#pdownload th a'));
            if (architectures.length === 0) {
                throw new Error('No architecture not found');
            }

            const amd64Found = architectures.find(elm => elm.innerText === 'amd64');
            if (!amd64Found) {
                throw new Error('amd64 architecture not found');
            }

            return amd64Found.href;
        });

        // console.log('amd64URL', amd64URL);

        await page.goto(amd64URL);
        await page.waitForSelector('#content');

        const mirrorURL = await page.evaluate(() => {
            const allLinks = Array.from(document.querySelectorAll('#content a'));
            if (allLinks.length === 0) {
                throw new Error('No links not found');
            }

            const mirrorFound = allLinks.find(elm => elm.href.includes('.deb'));
            if (!mirrorFound) {
                throw new Error('Mirror not found');
            }

            return mirrorFound.href;
        });

        pkgURL = mirrorURL;

    } catch (error) {
        console.log('Error: ', error.message);
    }

    await browser.close();
    return pkgURL;
}

async function githubRepositorySearch(query) {
    console.log('Searching for github repository...');
    let githubAssets = [];
    try {
        query = query.toLowerCase();

        const url = `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc`
        const response = await axios.get(url);
        const foundRepo = response.data['items'].find(elm => elm.name === query);

        // console.log('response', foundRepo);

        if (!foundRepo) {
            throw new Error('Repo not found');
        }

        const [releasesURL] = foundRepo.releases_url.split('{/id}');
        // console.log('releasesURL', releasesURL);

        const assetsRes = await axios.get(releasesURL);
        const packageAssets = assetsRes.data[0].assets.map(asset => {
            return {
                name: asset.name,
                browser_download_url: asset.browser_download_url,
            }
        });

        githubAssets = packageAssets;

    } catch (error) {
        console.log('Error: ', error.message);
    }
    return githubAssets;
}
module.exports = { ubuntuRepositorySearch, githubRepositorySearch };