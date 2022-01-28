const puppeteer = require('puppeteer-core');

module.exports =  puppeteer.launch({
    executablePath: process.env.BROWSER_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless:  process.env.BROWSER_VISIBLE=="true"?true:false
});

