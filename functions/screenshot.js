const { builder } = require("@netlify/functions");
const chromium = require("chrome-aws-lambda");

function isFullUrl(url) {
  try {
    new URL(url);
    return true;
  } catch(e) {
    // invalid url OR local path
    return false;
  }
}

async function screenshot(url, viewportSize, withJs = true) {
  const browser = await chromium.puppeteer.launch({
    executablePath: await chromium.executablePath,
    args: chromium.args,
    defaultViewport: viewportSize,
    headless: chromium.headless,
  });

  const page = await browser.newPage();

  if(!withJs) {
    page.setJavaScriptEnabled(false);
  }

  await page.goto(url, {
    waitUntil: ["load", "networkidle0"]
  });

  let buffer = await page.screenshot({
    type: "jpeg",
    quality: 80,
  });

  await browser.close();

  return buffer;
}

// Based on https://github.com/DavidWells/netlify-functions-workshop/blob/master/lessons-code-complete/use-cases/13-returning-dynamic-images/functions/return-image.js
async function handler(event, context) {
  // Links have the formats:
  //   /screenshot/:url/
  //   /screenshot/:url/:aspectratio/
  //   /screenshot/:url/:aspectratio/:size/

  // e.g. /screenshot/https%3A%2F%2Fwww.11ty.dev%2F/square/
  let pathSplit = event.path.split("/").filter(entry => !!entry);
  let [, url, aspectratio, size] = pathSplit;
  let w;
  let h;

  if(!aspectratio || aspectratio === "square" || parseInt(aspectratio, 10) === 1) {
    if(!size || size === "small") {
      w = 420;
      h = 420;
    } else if(size === "medium") {
      w = 600;
      h = 600;
    } else if(size === "large") {
      w = 1024;
      h = 1024;
    }
  } else if(parseFloat(aspectratio) === 0.5625) {
    if(!size || size === "small") {
      w = 236;
      h = 420;
    } else if(size === "medium") {
      w = 338;
      h = 600;
    } else if(size === "large") {
      w = 576;
      h = 1024;
    }
  }

  url = decodeURIComponent(url);

  try {
    if(!isFullUrl(url)) {
      throw new Error(`Invalid \`url\`: ${url}`);
    }

    let dims = {};
    dims.width = w;
    dims.height = h;

    let buffer = await screenshot(url, dims);

    return {
      statusCode: 200,
      headers: {
        "content-type": "image/jpeg"
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true
    };
  } catch (error) {
    // TODO output sample error image instead of JSON
    console.log("Error", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
}

exports.handler = builder(handler);
