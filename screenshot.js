// import chromium from "@sparticuz/chromium";
// import puppeteer from "puppeteer-core";
import puppeteer from "puppeteer";

// chromium.setHeadlessMode = true;

// chromium.setGraphicsMode = false;

async function screenshot(url, options = {}) {
	let { format = "jpeg", viewport = [375, 375], dpr = 1, withJs = true, wait, timeout = 6000 } = options;

  // Must be between 500 and 8000
  timeout = Math.min(Math.max(timeout, 500), 8000);

  const browser = await puppeteer.launch({
    // executablePath: await chromium.executablePath(),
    // args: chromium.args,
    // headless: chromium.headless,
    defaultViewport: {
      width: viewport[0],
      height: viewport[1],
      deviceScaleFactor: parseFloat(dpr),
    },
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();

  if(!withJs) {
    page.setJavaScriptEnabled(false);
  }

  let response = await Promise.race([
    page.goto(url, {
      waitUntil: wait || ["load"],
      timeout,
    }),
    new Promise(resolve => {
      setTimeout(() => {
        resolve(false); // false is expected below
      }, Math.max(timeout, 0)); // we need time to execute the window.stop before the top level timeout hits
    }),
  ]);

  if(response === false) { // timed out, resolved false
    await page.evaluate(() => window.stop());
  }

  // let statusCode = response.status();
  // TODO handle 4xx/5xx status codes better

  let screenshotOptions = {
    type: format,
    encoding: "binary",
    fullPage: false,
    captureBeyondViewport: false,
    clip: {
      x: 0,
      y: 0,
      width: viewport[0],
      height: viewport[1],
    }
  };

  if(format === "jpeg") {
    screenshotOptions.quality = 80;
  }

  let output = await page.screenshot(screenshotOptions);

  await browser.close();

  return output;
}

export default screenshot;