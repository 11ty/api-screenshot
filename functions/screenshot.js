const { builder } = require("@netlify/functions");
const chromium = require("chrome-aws-lambda");
const sharp = require("sharp");

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
  //   /screenshot/:url/:size/
  //   /screenshot/:url/:size/:aspectratio/
  //   /screenshot/:url/:size/:aspectratio/:format/

  // e.g. /screenshot/1.0/https%3A%2F%2Fwww.11ty.dev%2F/square/
  let pathSplit = event.path.split("/").filter(entry => !!entry);
  let [, apiVersion, url, size, aspectratio, format] = pathSplit;
  let viewport = [];

  if(!size || size === "small") {
    if(!aspectratio || parseInt(aspectratio, 10) === 1) {
      viewport = [420, 420];
    } else if(parseFloat(aspectratio) === 0.5625) {
      viewport = [236, 420];
    }
  } else if(size === "medium") {
    if(!aspectratio || parseInt(aspectratio, 10) === 1) {
      viewport = [600, 600];
    } else if(parseFloat(aspectratio) === 0.5625) {
      viewport = [338, 600];
    }
  } else if(size === "large") {
    if(!aspectratio || parseInt(aspectratio, 10) === 1) {
      viewport = [1024, 1024];
    } else if(parseFloat(aspectratio) === 0.5625) {
      viewport = [576, 1024];
    }
  }

  url = decodeURIComponent(url);

  try {
    if(!isFullUrl(url)) {
      throw new Error(`Invalid \`url\`: ${url}`);
    }

    if(!viewport || viewport.length !== 2) {
      throw new Error("Incorrect API usage. Expects one of: /screenshot/:url/ or /screenshot/:url/:size/ or /screenshot/:url/:size/:aspectratio/")
    }

    let dims = {};
    dims.width = viewport[0];
    dims.height = viewport[1];

    let buffer = await screenshot(url, dims);
    let sharpBuffer = sharp(buffer).toFormat(format).toBuffer();

    return {
      statusCode: 200,
      headers: {
        "content-type": `image/${format}`
      },
      body: sharpBuffer.toString('base64'),
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
