const puppeteer = require('puppeteer-core');


module.exports =  puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/Chrome.exe',
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true
});

