const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText);
  });

  try {
    await page.goto('http://localhost:4123', { waitUntil: 'networkidle2', timeout: 10000 });
    await new Promise(r => setTimeout(r, 3000));
    const hasLogo = await page.evaluate(() => !!document.querySelector('svg[aria-label="Tapas"]'));
    console.log('Logo present in DOM:', hasLogo);
    
    // Output HTML body
    const body = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
    console.log('BODY HEAD:', body);
  } catch (err) {
    console.error('NAVIGATION ERROR:', err);
  } finally {
    await browser.close();
  }
})();
