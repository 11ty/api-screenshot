import screenshot from "../screenshot.js";
import screenshotOptions from "../screenshot-options.js";

const ONE_MINUTE = 60;
const ONE_HOUR = ONE_MINUTE*60;
const ONE_DAY = ONE_HOUR*24;
const ONE_WEEK = ONE_DAY*7;
const ONE_YEAR = ONE_DAY*365; // maximum s-maxage

const VALID_UNDERSCORE_OPTIONS = ["timeout", "wait"];
const VALID_PARAMS = ["url", "size", "ratio", "zoom", "options"];

function isFullUrl(url) {
  try {
    new URL(url);
    return true;
  } catch(e) {
    // invalid url OR local path
    return false;
  }
}

function getBlankImageResponse(width, height, errorMessage) {
  return new Response(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" x="0" y="0" viewBox="0 0 1569.4 2186" xml:space="preserve" aria-hidden="true" focusable="false"><style>.st0{fill:#bbb;stroke:#bbb;stroke-width:28;stroke-miterlimit:10}</style><g><path class="st0" d="M562.2 1410.1c-9 0-13.5-12-13.5-36.1V778.9c0-11.5-2.3-16.9-7-16.2-28.4 7.2-42.7 10.8-43.1 10.8-7.9.7-11.8-7.2-11.8-23.7v-51.7c0-14.3 4.3-22.4 12.9-24.2l142.2-36.6c1.1-.3 2.7-.5 4.8-.5 7.9 0 11.8 8.4 11.8 25.3v712c0 24.1-4.7 36.1-14 36.1l-82.3-.1zM930.5 1411.2c-14.4 0-26.8-1-37.4-3-10.6-2-21.6-6.5-33.1-13.5s-20.9-16.6-28.3-28.8-13.4-29.3-18-51.2-7-47.9-7-78.1V960.4c0-7.2-2-10.8-5.9-10.8h-33.4c-9 0-13.5-8.6-13.5-25.8v-29.1c0-17.6 4.5-26.4 13.5-26.4h33.4c3.9 0 5.9-4.8 5.9-14.5l9.7-209.5c1.1-19 5.7-28.5 14-28.5h53.9c9 0 13.5 9.5 13.5 28.5v209.5c0 9.7 2.1 14.5 6.5 14.5H973c9 0 13.5 8.8 13.5 26.4v29.1c0 17.2-4.5 25.8-13.5 25.8h-68.9c-2.5 0-4.2.6-5.1 1.9-.9 1.2-1.3 4.2-1.3 8.9v277.9c0 20.8 1.3 38.2 4 52s6.6 24 11.8 30.4 10.4 10.8 15.6 12.9c5.2 2.2 11.6 3.2 19.1 3.2h38.2c9.7 0 14.5 6.7 14.5 19.9v32.3c0 14.7-5.2 22.1-15.6 22.1l-54.8.1zM1137.2 1475.8c8.2 0 15.4-6.7 21.5-20.2s9.2-32.6 9.2-57.4c0-5.8-3.6-25.7-10.8-59.8l-105.6-438.9c-.7-5-1.1-9-1.1-11.9 0-12.9 2.7-19.4 8.1-19.4h65.2c5 0 9.1 1.7 12.4 5.1s5.8 10.3 7.5 20.7l70 370.5c1.4 4.3 2.3 6.5 2.7 6.5 1.4 0 2.2-2 2.2-5.9l54.9-369.5c1.4-10.8 3.7-18 6.7-21.8s6.9-5.7 11.6-5.7h45.2c6.1 0 9.2 7 9.2 21 0 3.2-.4 7.4-1.1 12.4l-95.9 499.3c-7.5 41.3-15.8 72.9-24.8 94.8s-19 36.8-30.2 44.7c-11.1 7.9-25.8 12-44.2 12.4h-5.4c-29.1 0-48.8-7.7-59.2-23.2-2.9-3.2-4.3-11.5-4.3-24.8 0-26.6 4.3-39.9 12.9-39.9.7 0 7.2 1.8 19.4 5.4 12.4 3.8 20.3 5.6 23.9 5.6z"/><g><path class="st0" d="M291.2 1411.1c-9 0-13.5-12-13.5-36.1V779.9c0-11.5-2.3-16.9-7-16.2-28.4 7.2-42.7 10.8-43.1 10.8-7.9.7-11.8-7.2-11.8-23.7v-51.7c0-14.3 4.3-22.4 12.9-24.2L371 638.2c1.1-.3 2.7-.5 4.8-.5 7.9 0 11.8 8.4 11.8 25.3v712c0 24.1-4.7 36.1-14 36.1h-82.4z"/></g></g></svg>`, {
    // We need to return 200 here or Firefox won’t display the image
    // HOWEVER a 200 means that if it times out on the first attempt it will stay the default image until the next build.
    status: 200,
    headers: {
      "content-type": "image/svg+xml",
      "x-11ty-error-message": errorMessage,
      // HOWEVER HOWEVER, we can set a ttl of 3600 which means that the image will be re-requested in an hour.
      "cache-control": `public, s-maxage=${ONE_DAY}, stale-while-revalidate=${ONE_HOUR}`
    }
  });
}

function getRedirectUrl(url, size, aspectratio, zoom, pathOptions = {}) {
  let optionsStr = Object.entries(pathOptions).map(([key, value]) => `_${key}:${value}`).join("");
  return "/" + [url, size, aspectratio, zoom, optionsStr].filter(Boolean).join("/") + "/";
}

export async function GET(request, context) {
  // e.g. /https%3A%2F%2Fwww.11ty.dev%2F/small/1:1/smaller/
  let requestUrl = new URL(request.url);
  let pathSplit = requestUrl.pathname.split("/").filter(entry => !!entry);
  let [url, size, aspectratio, zoom, optionsString] = pathSplit;
  let viewport = [];
  let forceDedupeRedirect = false;
  let hasInvalidQueryParams = false;

  // Manage your own frequency by using a _ prefix and then a hash buster string after your URL
  // e.g. /https%3A%2F%2Fwww.11ty.dev%2F/_20210802/ and set this to today’s date when you deploy
  if(size && size.startsWith("_")) {
    optionsString = size;
    size = undefined;
  }
  if(aspectratio && aspectratio.startsWith("_")) {
    optionsString = aspectratio;
    aspectratio = undefined;
  }
  if(aspectratio === "x.jpeg") {
    aspectratio = undefined;
  }
  if(zoom && zoom.startsWith("_")) {
    optionsString = zoom;
    zoom = undefined;
  }

  // Options
  let pathOptions = {};
  let optionsMatch = (optionsString || "").split("_").filter(entry => !!entry);
  for(let o of optionsMatch) {
    let [key, value] = o.split(":");
    if(!VALID_UNDERSCORE_OPTIONS.includes(key)) {
      // don’t add to pathOptions
      console.log( "Invalid underscore option key", key, value );
      forceDedupeRedirect = true;
    } else {
      pathOptions[key.toLowerCase()] = parseInt(value, 10);
    }
  }

  for(let [key, value] of requestUrl.searchParams.entries()) {
    if(!VALID_PARAMS.includes(key)) {
      console.log( "Invalid query param", key, value );
      forceDedupeRedirect = true;
      hasInvalidQueryParams = true;
    }
  }

  let wait = ["load"];
  if(pathOptions.wait === 0) {
    wait = ["domcontentloaded"];
  } else if(!pathOptions.wait || pathOptions.wait === 1) {
    wait = ["load"];
  } else if(pathOptions.wait === 2) {
    wait = ["load", "networkidle0"];
  } else if(pathOptions.wait === 3) {
    wait = ["load", "networkidle2"];
  } else {
    console.log( "Invalid wait value", pathOptions.wait );
    delete pathOptions.wait;
    forceDedupeRedirect = true;
  }

  let timeout;
  if(pathOptions.timeout) {
    timeout = pathOptions.timeout * 1000;
  }

  let dpr;
  if(zoom === "bigger") {
    dpr = 1.4;
  } else if(zoom === "smaller") {
    dpr = 0.71428571;
  } else if(!zoom || zoom === "standard") {
    dpr = 1;
  } else {
    console.log( "Invalid zoom", zoom );
    zoom = undefined;
    forceDedupeRedirect = true;
  }

  if(!size || size === "small") {
    if(!aspectratio || aspectratio === "1:1") {
      viewport = [375, 375];
    } else if(aspectratio === "9:16") {
      viewport = [375, 667];
    } else {
      console.log( "Invalid aspect ratio for small size", aspectratio );
      aspectratio = undefined;
      forceDedupeRedirect = true;
    }
  } else if(size === "medium") {
    if(!aspectratio || aspectratio === "1:1") {
      viewport = [650, 650];
    } else if(aspectratio === "9:16") {
      viewport = [650, 1156];
    } else {
      console.log( "Invalid aspect ratio for medium size", aspectratio );
      aspectratio = undefined;
      forceDedupeRedirect = true;
    }
  } else if(size === "large") {
    // 0.5625 aspect ratio not supported on large
    if(!aspectratio || aspectratio === "1:1") {
      viewport = [1024, 1024];
    } else {
      console.log( "Invalid aspect ratio for large size", aspectratio );
      aspectratio = undefined;
      forceDedupeRedirect = true;
    }
  } else if(size === "opengraph") {
    // de-dupe to ignore aspectratio
    if(aspectratio) {
      // do nothing
      console.log( "Ignoring aspect ratio for opengraph size", aspectratio );
      aspectratio = undefined;
    }

    // always maintain a 1200×630 output image
    if(zoom === "bigger") { // dpr = 1.4
      viewport = [857, 450];
    } else if(zoom === "smaller") { // dpr = 0.714
      viewport = [1680, 882];
    } else if(!zoom) {
      viewport = [1200, 630];
    } else {
      console.log( "Invalid zoom for opengraph size", zoom );
      aspectratio = undefined;
      zoom = undefined;
      forceDedupeRedirect = true;
    }
  } else {
    console.log( "Invalid size", size );
    size = undefined;
    forceDedupeRedirect = true;
  }

  if(forceDedupeRedirect) {
    let redirectUrl = getRedirectUrl(url, size, aspectratio, zoom, pathOptions);
    if(requestUrl.pathname !== redirectUrl || hasInvalidQueryParams) {
      console.log( "Hard de-dupe redirect from", requestUrl.pathname, "to", redirectUrl );
      return new Response(null, {
        status: 302,
        headers: {
          "location": redirectUrl,
        }
      })
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

    let deniedHostnames = screenshotOptions?.deniedHostnames || [];
    for(let deniedHost of deniedHostnames) {
      if((new URL(url)).hostname === deniedHost) {
        console.log( "Denied request to", url );
        return getBlankImageResponse(viewport[0], viewport[1], "Too expensive");
      }
    }

    let startTime = Date.now();
    let format = "jpeg"; // hardcoded for now, but png and webp are supported!
    let withJs = true;
    let output = await screenshot(url, {
      format,
      viewport,
      dpr,
      wait,
      timeout,
      withJs,
    });

    // output to Function logs
    console.log("Success:", url, `${Date.now() - startTime}ms`, JSON.stringify({ viewport, size, dpr, aspectratio, withJs }));

    return new Response(output, {
      status: 200,
      headers: {
        "content-type": `image/${format}`,
        "cache-control": `public, s-maxage=${ONE_YEAR}, stale-while-revalidate=${ONE_WEEK}`
      }
    });
  } catch (error) {
    console.log("Error from", requestUrl.pathname, error);

    let width = viewport?.[0] || 1200;
    let height = viewport?.[1] || 630;

    return getBlankImageResponse(width, height, error.message);
  }
}
