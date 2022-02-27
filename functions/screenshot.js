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

async function screenshot(url, { format, viewport, dpr = 1, withJs = true, wait, waitOptions = {}, timeout = 8500 }) {
  // Must be between 3000 and 8500
  timeout = Math.min(Math.max(timeout, 3000), 8500);

  const browser = await chromium.puppeteer.launch({
    executablePath: await chromium.executablePath,
    args: chromium.args,
    defaultViewport: {
      width: viewport[0],
      height: viewport[1],
      deviceScaleFactor: parseFloat(dpr),
    },
    headless: chromium.headless,
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
      }, timeout - 1500); // we need time to execute the window.stop before the top level timeout hits
    }),
  ]);

  if(response === false) { // timed out, resolved false
    await page.evaluate(() => window.stop());
  } else {
    // See https://github.com/puppeteer/puppeteer/issues/2692
    if(waitOptions.emoji) {
      await page.addStyleTag({
        content: `/* [0] */
@font-face {
  font-family: 'Noto Color Emoji';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/notocoloremoji/v1/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabts6diysYTngZPnMC1MfLc.0.woff2) format('woff2');
  unicode-range: U+1f1e6-1f1ff;
}
/* [1] */
@font-face {
  font-family: 'Noto Color Emoji';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/notocoloremoji/v1/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabts6diysYTngZPnMC1MfLc.1.woff2) format('woff2');
  unicode-range: U+200d, U+2620, U+26a7, U+fe0f, U+1f308, U+1f38c, U+1f3c1, U+1f3f3-1f3f4, U+1f6a9, U+e0062-e0063, U+e0065, U+e0067, U+e006c, U+e006e, U+e0073-e0074, U+e0077, U+e007f;
}
/* [2] */
@font-face {
  font-family: 'Noto Color Emoji';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/notocoloremoji/v1/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabts6diysYTngZPnMC1MfLc.2.woff2) format('woff2');
  unicode-range: U+23, U+2a, U+30-39, U+a9, U+ae, U+200d, U+203c, U+2049, U+20e3, U+2122, U+2139, U+2194-2199, U+21a9-21aa, U+23cf, U+23e9-23ef, U+23f8-23fa, U+24c2, U+25aa-25ab, U+25b6, U+25c0, U+25fb-25fe, U+2611, U+2622-2623, U+2626, U+262a, U+262e-262f, U+2638, U+2640, U+2642, U+2648-2653, U+2660, U+2663, U+2665-2666, U+2668, U+267b, U+267e-267f, U+2695, U+269b-269c, U+26a0, U+26a7, U+26aa-26ab, U+26ce, U+26d4, U+2705, U+2714, U+2716, U+271d, U+2721, U+2733-2734, U+2747, U+274c, U+274e, U+2753-2755, U+2757, U+2764, U+2795-2797, U+27a1, U+27b0, U+27bf, U+2934-2935, U+2b05-2b07, U+2b1b-2b1c, U+2b55, U+3030, U+303d, U+3297, U+3299, U+fe0f, U+1f170-1f171, U+1f17e-1f17f, U+1f18e, U+1f191-1f19a, U+1f201-1f202, U+1f21a, U+1f22f, U+1f232-1f23a, U+1f250-1f251, U+1f310, U+1f3a6, U+1f3b5-1f3b6, U+1f3bc, U+1f3e7, U+1f441, U+1f499-1f49c, U+1f49f-1f4a0, U+1f4ac-1f4ad, U+1f4b1-1f4b2, U+1f4b9, U+1f4db, U+1f4f2-1f4f6, U+1f500-1f50a, U+1f515, U+1f518-1f524, U+1f52f-1f53d, U+1f549, U+1f54e, U+1f5a4, U+1f5e8, U+1f5ef, U+1f6ab, U+1f6ad-1f6b1, U+1f6b3, U+1f6b7-1f6bc, U+1f6be, U+1f6c2-1f6c5, U+1f6d0-1f6d1, U+1f6d7, U+1f7e0-1f7eb, U+1f7f0, U+1f90d-1f90e, U+1f9e1;
}
/* [3] */
@font-face {
  font-family: 'Noto Color Emoji';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/notocoloremoji/v1/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabts6diysYTngZPnMC1MfLc.3.woff2) format('woff2');
  unicode-range: U+231a-231b, U+2328, U+23f0-23f3, U+2602, U+260e, U+2692, U+2694, U+2696-2697, U+2699, U+26b0-26b1, U+26cf, U+26d1, U+26d3, U+2702, U+2709, U+270f, U+2712, U+fe0f, U+1f302, U+1f321, U+1f392-1f393, U+1f3a9, U+1f3bd, U+1f3ee, U+1f3f7, U+1f3fa, U+1f451-1f462, U+1f484, U+1f489-1f48a, U+1f48c-1f48e, U+1f4a1, U+1f4a3, U+1f4b0, U+1f4b3-1f4b8, U+1f4bb-1f4da, U+1f4dc-1f4f1, U+1f4ff, U+1f50b-1f514, U+1f516-1f517, U+1f526-1f529, U+1f52c-1f52e, U+1f550-1f567, U+1f56f-1f570, U+1f576, U+1f587, U+1f58a-1f58d, U+1f5a5, U+1f5a8, U+1f5b1-1f5b2, U+1f5c2-1f5c4, U+1f5d1-1f5d3, U+1f5dc-1f5de, U+1f5e1, U+1f5f3, U+1f6aa, U+1f6ac, U+1f6bd, U+1f6bf, U+1f6c1, U+1f6cb, U+1f6cd-1f6cf, U+1f6d2, U+1f6e0-1f6e1, U+1f6f0, U+1f97b-1f97f, U+1f9af, U+1f9ba, U+1f9e2-1f9e6, U+1f9ea-1f9ec, U+1f9ee-1f9f4, U+1f9f7-1f9ff, U+1fa71-1fa74, U+1fa79-1fa7b, U+1fa86, U+1fa91-1fa93, U+1fa96, U+1fa99-1faa0, U+1faa2-1faa7, U+1faaa-1faac;
}
/* [4] */
@font-face {
  font-family: 'Noto Color Emoji';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/notocoloremoji/v1/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabts6diysYTngZPnMC1MfLc.4.woff2) format('woff2');
  unicode-range: U+265f, U+26bd-26be, U+26f3, U+26f8, U+fe0f, U+1f004, U+1f0cf, U+1f380-1f384, U+1f386-1f38b, U+1f38d-1f391, U+1f396-1f397, U+1f399-1f39b, U+1f39e-1f39f, U+1f3a3-1f3a5, U+1f3a7-1f3a9, U+1f3ab-1f3b4, U+1f3b7-1f3bb, U+1f3bd-1f3c0, U+1f3c5-1f3c6, U+1f3c8-1f3c9, U+1f3cf-1f3d3, U+1f3f8-1f3f9, U+1f47e, U+1f4e2, U+1f4f7-1f4fd, U+1f52b, U+1f579, U+1f58c-1f58d, U+1f5bc, U+1f6f7, U+1f6f9, U+1f6fc, U+1f93f, U+1f941, U+1f945, U+1f947-1f94f, U+1f9e7-1f9e9, U+1f9f5-1f9f6, U+1fa70-1fa71, U+1fa80-1fa81, U+1fa83-1fa85, U+1fa94-1fa95, U+1fa97-1fa98, U+1faa1, U+1faa9;
}
/* [5] */
@font-face {
  font-family: 'Noto Color Emoji';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/notocoloremoji/v1/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabts6diysYTngZPnMC1MfLc.5.woff2) format('woff2');
  unicode-range: U+2693, U+26e9-26ea, U+26f2, U+26f4-26f5, U+26fa, U+26fd, U+2708, U+fe0f, U+1f301, U+1f303, U+1f306-1f307, U+1f309, U+1f310, U+1f3a0-1f3a2, U+1f3aa, U+1f3cd-1f3ce, U+1f3d5, U+1f3d7-1f3db, U+1f3dd, U+1f3df-1f3e6, U+1f3e8-1f3ed, U+1f3ef-1f3f0, U+1f488, U+1f492, U+1f4ba, U+1f54b-1f54d, U+1f5fa-1f5ff, U+1f680-1f6a2, U+1f6a4-1f6a8, U+1f6b2, U+1f6d1, U+1f6d5-1f6d6, U+1f6dd-1f6df, U+1f6e2-1f6e5, U+1f6e9, U+1f6eb-1f6ec, U+1f6f3-1f6f6, U+1f6f8, U+1f6fa-1f6fb, U+1f9bc-1f9bd, U+1f9ed, U+1f9f3, U+1fa7c;
}
/* [6] */
@font-face {
  font-family: 'Noto Color Emoji';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/notocoloremoji/v1/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabts6diysYTngZPnMC1MfLc.6.woff2) format('woff2');
  unicode-range: U+2615, U+fe0f, U+1f32d-1f330, U+1f336, U+1f33d, U+1f345-1f37f, U+1f382, U+1f52a, U+1f942-1f944, U+1f950-1f96f, U+1f99e, U+1f9aa, U+1f9c0-1f9cb, U+1fad0-1fad9;
}
/* [7] */
@font-face {
  font-family: 'Noto Color Emoji';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/notocoloremoji/v1/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabts6diysYTngZPnMC1MfLc.7.woff2) format('woff2');
  unicode-range: U+200d, U+2600-2601, U+2603-2604, U+2614, U+2618, U+26a1, U+26c4-26c5, U+26c8, U+26f0-26f1, U+2728, U+2744, U+2b1b, U+2b50, U+fe0f, U+1f300-1f301, U+1f304-1f305, U+1f308, U+1f30a-1f30f, U+1f311-1f319, U+1f31f-1f321, U+1f324-1f32c, U+1f331-1f335, U+1f337-1f33c, U+1f33e-1f344, U+1f3d4, U+1f3d6, U+1f3dc, U+1f3de, U+1f3f5, U+1f400-1f43f, U+1f490, U+1f4a7, U+1f4ab, U+1f4ae, U+1f525, U+1f54a, U+1f577-1f578, U+1f648-1f64a, U+1f940, U+1f980-1f9ae, U+1f9ba, U+1fa90, U+1faa8, U+1fab0-1faba, U+1fae7;
}
/* [8] */
@font-face {
  font-family: 'Noto Color Emoji';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/notocoloremoji/v1/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabts6diysYTngZPnMC1MfLc.8.woff2) format('woff2');
  unicode-range: U+200d, U+2640, U+2642, U+2695-2696, U+26f7, U+26f9, U+2708, U+2764, U+fe0f, U+1f33e, U+1f373, U+1f37c, U+1f384-1f385, U+1f393, U+1f3a4, U+1f3a8, U+1f3c2-1f3c4, U+1f3c7, U+1f3ca-1f3cc, U+1f3eb, U+1f3ed, U+1f3fb-1f3ff, U+1f466-1f478, U+1f47c, U+1f481-1f483, U+1f486-1f487, U+1f48b, U+1f48f, U+1f491, U+1f4bb-1f4bc, U+1f527, U+1f52c, U+1f574-1f575, U+1f57a, U+1f645-1f647, U+1f64b, U+1f64d-1f64e, U+1f680, U+1f692, U+1f6a3, U+1f6b4-1f6b6, U+1f6c0, U+1f6cc, U+1f91d, U+1f926, U+1f930-1f931, U+1f934-1f93a, U+1f93c-1f93e, U+1f977, U+1f9af-1f9b3, U+1f9b8-1f9b9, U+1f9bc-1f9bd, U+1f9cc-1f9cf, U+1f9d1-1f9df, U+1fa82, U+1fac3-1fac5;
}
/* [9] */
@font-face {
  font-family: 'Noto Color Emoji';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/notocoloremoji/v1/Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabts6diysYTngZPnMC1MfLc.9.woff2) format('woff2');
  unicode-range: U+200d, U+261d, U+2620, U+2639-263a, U+2665, U+270a-270d, U+2728, U+2763-2764, U+2b50, U+fe0f, U+1f31a-1f31f, U+1f32b, U+1f383, U+1f389-1f38a, U+1f3fb-1f3ff, U+1f440-1f450, U+1f463-1f465, U+1f479-1f47b, U+1f47d, U+1f47f-1f480, U+1f485, U+1f48b-1f48c, U+1f493-1f49f, U+1f4a2, U+1f4a4-1f4a6, U+1f4a8-1f4ab, U+1f4af, U+1f525, U+1f573, U+1f590, U+1f595-1f596, U+1f5a4, U+1f5e3, U+1f600-1f644, U+1f648-1f64a, U+1f64c, U+1f64f, U+1f90c-1f925, U+1f927-1f92f, U+1f932-1f933, U+1f970-1f976, U+1f978-1f97a, U+1f9a0, U+1f9b4-1f9b7, U+1f9bb, U+1f9be-1f9bf, U+1f9d0, U+1f9e0-1f9e1, U+1fa78-1fa79, U+1fac0-1fac2, U+1fae0-1fae7, U+1faf0-1faf6;
}`
      });

      await page.evaluateHandle(`document.fonts.load("1em Noto Color Emoji")`);
    }
  }

  // let statusCode = response.status();
  // TODO handle 4xx/5xx status codes better

  let options = {
    type: format,
    encoding: "base64",
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
    options.quality = 80;
  }

  let output = await page.screenshot(options);

  await browser.close();

  return output;
}

// Based on https://github.com/DavidWells/netlify-functions-workshop/blob/master/lessons-code-complete/use-cases/13-returning-dynamic-images/functions/return-image.js
async function handler(event, context) {
  // e.g. /https%3A%2F%2Fwww.11ty.dev%2F/small/1:1/smaller/
  let pathSplit = event.path.split("/").filter(entry => !!entry);
  let [url, size, aspectratio, zoom, cachebuster] = pathSplit;
  let format = "jpeg"; // hardcoded for now, but png and webp are supported!
  let viewport = [];

  // Manage your own frequency by using a _ prefix and then a hash buster string after your URL
  // e.g. /https%3A%2F%2Fwww.11ty.dev%2F/_20210802/ and set this to today’s date when you deploy
  if(size && size.startsWith("_")) {
    cachebuster = size;
    size = undefined;
  }
  if(aspectratio && aspectratio.startsWith("_")) {
    cachebuster = aspectratio;
    aspectratio = undefined;
  }
  if(zoom && zoom.startsWith("_")) {
    cachebuster = zoom;
    zoom = undefined;
  }

  // Options
  let pathOptions = {};
  let optionsMatch = (cachebuster || "").split("_").filter(entry => !!entry);
  for(let o of optionsMatch) {
    let [key, value] = o.split(":");
    pathOptions[key.toLowerCase()] = parseInt(value, 10);
  }

  let wait = ["load"];
  let waitOptions = {};
  if(pathOptions.wait === 0) {
    wait = ["domcontentloaded"];
  } else if(pathOptions.wait === 1) {
    wait = ["load"];
  } else if(pathOptions.wait === 2) {
    wait = ["load", "networkidle0"];
  } else if(pathOptions.wait === 3) {
    wait = ["load", "networkidle2"];
  } else if(pathOptions.wait === 4) {
    // wait for web fonts
    wait = ["load", "networkidle0"];
    waitOptions.emoji = true;
  }

  let timeout;
  if(pathOptions.timeout) {
    timeout = pathOptions.timeout * 1000;
  }

  // Set Defaults
  format = format || "jpeg";
  aspectratio = aspectratio || "1:1";
  size = size || "small";
  zoom = zoom || "standard";

  let dpr;
  if(zoom === "bigger") {
    dpr = 1.4;
  } else if(zoom === "smaller") {
    dpr = 0.71428571;
  } else if(zoom === "standard") {
    dpr = 1;
  }

  if(size === "small") {
    if(aspectratio === "1:1") {
      viewport = [375, 375];
    } else if(aspectratio === "9:16") {
      viewport = [375, 667];
    }
  } else if(size === "medium") {
    if(aspectratio === "1:1") {
      viewport = [650, 650];
    } else if(aspectratio === "9:16") {
      viewport = [650, 1156];
    }
  } else if(size === "large") {
    // 0.5625 aspect ratio not supported on large
    if(aspectratio === "1:1") {
      viewport = [1024, 1024];
    }
  } else if(size === "opengraph") {
    // ignores aspectratio
    // always maintain a 1200×630 output image
    if(zoom === "bigger") { // dpr = 1.4
      viewport = [857, 450];
    } else if(zoom === "smaller") { // dpr = 0.714
      viewport = [1680, 882];
    } else {
      viewport = [1200, 630];
    }
  }

  url = decodeURIComponent(url);

  try {
    if(!isFullUrl(url)) {
      throw new Error(`Invalid \`url\`: ${url}`);
    }

    if(!viewport || viewport.length !== 2) {
      throw new Error("Incorrect API usage. Expects one of: /:url/ or /:url/:size/ or /:url/:size/:aspectratio/")
    }

    let output = await screenshot(url, {
      format,
      viewport,
      dpr,
      wait,
      waitOptions,
      timeout,
    });

    // output to Function logs
    console.log(url, format, { viewport }, { size }, { dpr }, { aspectratio }, { wait }, { waitOptions });

    return {
      statusCode: 200,
      headers: {
        "content-type": `image/${format}`
      },
      body: output,
      isBase64Encoded: true
    };
  } catch (error) {
    console.log("Error", error);

    return {
      // We need to return 200 here or Firefox won’t display the image
      // HOWEVER a 200 means that if it times out on the first attempt it will stay the default image until the next build.
      statusCode: 200,
      // HOWEVER HOWEVER, we can set a ttl of 3600 which means that the image will be re-requested in an hour.
      ttl: 3600,
      headers: {
        "content-type": "image/svg+xml",
        "x-error-message": error.message
      },
      body: `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${viewport[0]}" height="${viewport[1]}" x="0" y="0" viewBox="0 0 1569.4 2186" xml:space="preserve" aria-hidden="true" focusable="false"><style>.st0{fill:#bbb;stroke:#bbb;stroke-width:28;stroke-miterlimit:10}</style><g><path class="st0" d="M562.2 1410.1c-9 0-13.5-12-13.5-36.1V778.9c0-11.5-2.3-16.9-7-16.2-28.4 7.2-42.7 10.8-43.1 10.8-7.9.7-11.8-7.2-11.8-23.7v-51.7c0-14.3 4.3-22.4 12.9-24.2l142.2-36.6c1.1-.3 2.7-.5 4.8-.5 7.9 0 11.8 8.4 11.8 25.3v712c0 24.1-4.7 36.1-14 36.1l-82.3-.1zM930.5 1411.2c-14.4 0-26.8-1-37.4-3-10.6-2-21.6-6.5-33.1-13.5s-20.9-16.6-28.3-28.8-13.4-29.3-18-51.2-7-47.9-7-78.1V960.4c0-7.2-2-10.8-5.9-10.8h-33.4c-9 0-13.5-8.6-13.5-25.8v-29.1c0-17.6 4.5-26.4 13.5-26.4h33.4c3.9 0 5.9-4.8 5.9-14.5l9.7-209.5c1.1-19 5.7-28.5 14-28.5h53.9c9 0 13.5 9.5 13.5 28.5v209.5c0 9.7 2.1 14.5 6.5 14.5H973c9 0 13.5 8.8 13.5 26.4v29.1c0 17.2-4.5 25.8-13.5 25.8h-68.9c-2.5 0-4.2.6-5.1 1.9-.9 1.2-1.3 4.2-1.3 8.9v277.9c0 20.8 1.3 38.2 4 52s6.6 24 11.8 30.4 10.4 10.8 15.6 12.9c5.2 2.2 11.6 3.2 19.1 3.2h38.2c9.7 0 14.5 6.7 14.5 19.9v32.3c0 14.7-5.2 22.1-15.6 22.1l-54.8.1zM1137.2 1475.8c8.2 0 15.4-6.7 21.5-20.2s9.2-32.6 9.2-57.4c0-5.8-3.6-25.7-10.8-59.8l-105.6-438.9c-.7-5-1.1-9-1.1-11.9 0-12.9 2.7-19.4 8.1-19.4h65.2c5 0 9.1 1.7 12.4 5.1s5.8 10.3 7.5 20.7l70 370.5c1.4 4.3 2.3 6.5 2.7 6.5 1.4 0 2.2-2 2.2-5.9l54.9-369.5c1.4-10.8 3.7-18 6.7-21.8s6.9-5.7 11.6-5.7h45.2c6.1 0 9.2 7 9.2 21 0 3.2-.4 7.4-1.1 12.4l-95.9 499.3c-7.5 41.3-15.8 72.9-24.8 94.8s-19 36.8-30.2 44.7c-11.1 7.9-25.8 12-44.2 12.4h-5.4c-29.1 0-48.8-7.7-59.2-23.2-2.9-3.2-4.3-11.5-4.3-24.8 0-26.6 4.3-39.9 12.9-39.9.7 0 7.2 1.8 19.4 5.4 12.4 3.8 20.3 5.6 23.9 5.6z"/><g><path class="st0" d="M291.2 1411.1c-9 0-13.5-12-13.5-36.1V779.9c0-11.5-2.3-16.9-7-16.2-28.4 7.2-42.7 10.8-43.1 10.8-7.9.7-11.8-7.2-11.8-23.7v-51.7c0-14.3 4.3-22.4 12.9-24.2L371 638.2c1.1-.3 2.7-.5 4.8-.5 7.9 0 11.8 8.4 11.8 25.3v712c0 24.1-4.7 36.1-14 36.1h-82.4z"/></g></g></svg>`,
      isBase64Encoded: false,
    };
  }
}

exports.handler = builder(handler);
