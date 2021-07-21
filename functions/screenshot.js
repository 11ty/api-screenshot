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

async function screenshot(url, format, viewportSize, withJs = true) {
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
    waitUntil: ["load", "networkidle0"],
    timeout: 10000
  });

  let options = {
    type: format,
    encoding: "base64"
  };

  if(format === "jpeg") {
    quality = 80;
  }

  let output = await page.screenshot(options);

  await browser.close();

  return output;
}

// Based on https://github.com/DavidWells/netlify-functions-workshop/blob/master/lessons-code-complete/use-cases/13-returning-dynamic-images/functions/return-image.js
async function handler(event, context) {
  // Links have the formats:
  //   /1.0/:url/
  //   /1.0/:url/:size/
  //   /1.0/:url/:size/:aspectratio/
  // Valid aspectratio values: 1, 0.5625

  // e.g. /1.0/https%3A%2F%2Fwww.11ty.dev%2F/square/
  let pathSplit = event.path.split("/").filter(entry => !!entry);
  let [apiVersion, url, size, aspectratio] = pathSplit;
  let format = "jpeg"; // hardcoded for now
  let viewport = [];

  if(!format) {
    format = "jpeg";
  }

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

    let output = await screenshot(url, format, dims);

    // output to Function logs
    console.log(url, format, dims, size, aspectratio);

    return {
      statusCode: 200,
      headers: {
        "content-type": `image/${format}`
      },
      body: output,
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
