// Renders real screenshots through a local headless Chromium, so this is slower
// than a unit test: `npm test`
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

// `screenshot.js` reads this at call time to use the `puppeteer` devDependency
// instead of `@sparticuz/chromium`.
process.env.LOCAL_DEV = "true";

const { GET } = await import("../api/screenshot.js");

// A fixed-size page with no external requests, so renders are deterministic.
const TEST_PAGE = `<!doctype html><meta charset="utf-8"><title>Test</title>
<style>html,body{margin:0}body{width:1200px;height:630px;background:#00b37e;
color:#fff;font:700 72px/1.2 sans-serif;padding:64px;box-sizing:border-box}</style>
<div>Screenshot API</div>`;

let server;
let origin;

before(async () => {
  server = http.createServer((req, res) => {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(TEST_PAGE);
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}/`;
});

after(() => server.close());

// The `:url` path segment, as callers are expected to encode it.
function pathTo(suffix) {
  return `/${encodeURIComponent(origin)}/${suffix}`;
}

function request(suffix) {
  return GET(new Request(`http://localhost${pathTo(suffix)}`));
}

async function render(suffix) {
  let response = await request(suffix);
  assert.equal(response.status, 200, `Expected a screenshot for ${suffix}`);
  assert.equal(response.headers.get("content-type"), "image/jpeg");
  return Buffer.from(await response.arrayBuffer());
}

// Walks the JPEG marker segments. `length` includes its own two bytes; SOI, EOI
// and the RST markers are the only ones that carry no length.
function eachMarker(buffer, callback) {
  let i = 2;
  while(i < buffer.length - 1) {
    if(buffer[i] !== 0xFF) {
      i++;
      continue;
    }
    let marker = buffer[i + 1];
    if(marker === 0xD8 || marker === 0xD9 || (marker >= 0xD0 && marker <= 0xD7)) {
      i += 2;
      continue;
    }
    let length = buffer.readUInt16BE(i + 2);
    let result = callback(marker, buffer.subarray(i + 4, i + 2 + length));
    if(result !== undefined) {
      return result;
    }
    i += 2 + length;
  }
}

function getSize(buffer) {
  // Any Start of Frame marker (0xC0–0xCF), excluding DHT, JPG and DAC.
  let size = eachMarker(buffer, (marker, segment) => {
    if(marker >= 0xC0 && marker <= 0xCF && ![0xC4, 0xC8, 0xCC].includes(marker)) {
      return [segment.readUInt16BE(3), segment.readUInt16BE(1)];
    }
  });
  assert.ok(size, "Could not find a JPEG Start of Frame marker");
  return size;
}

function getLuminanceQuantizationTable(buffer) {
  let table = eachMarker(buffer, (marker, segment) => {
    if(marker !== 0xDB) {
      return;
    }
    let i = 0;
    while(i < segment.length) {
      let is16Bit = segment[i] >> 4;
      let id = segment[i] & 0x0F;
      let size = is16Bit ? 128 : 64;
      if(id === 0) {
        return Array.from(segment.subarray(i + 1, i + 1 + size));
      }
      i += 1 + size;
    }
  });
  assert.ok(table, "Could not find a JPEG luminance quantization table");
  return table;
}

describe("_dpr multiplies the output resolution without changing the framing", () => {
  // [path suffix, expected output size]
  let cases = [
    ["opengraph/", [1200, 630]],
    ["opengraph/_dpr:1-5/", [1800, 945]],
    ["opengraph/_dpr:2/", [2400, 1260]],
    // `x.jpg` is allowed to follow the options segment
    ["opengraph/_dpr:2/x.jpg", [2400, 1260]],
    ["small/", [375, 375]],
    ["small/_dpr:2/", [750, 750]],
    // `zoom` still holds opengraph output at 1200×630, `_dpr` still doubles it
    ["opengraph/1:1/bigger/_dpr:2/", [2400, 1260]],
  ];

  for(let [suffix, expected] of cases) {
    test(`/:url/${suffix} is ${expected[0]}×${expected[1]}`, async () => {
      assert.deepEqual(getSize(await render(suffix)), expected);
    });
  }
});

describe("invalid _dpr values de-dupe to a canonical URL", () => {
  let cases = [
    // `1` is already the default, and only `1-5` and `2` are supported
    ["opengraph/_dpr:1/", "opengraph/"],
    ["opengraph/_dpr:3/", "opengraph/"],
    ["opengraph/_dpr:2.5/", "opengraph/"],
    ["opengraph/_dpr:0/", "opengraph/"],
    ["opengraph/_dpr:abc/", "opengraph/"],
    // the `.` spellings are not the supported ones
    ["opengraph/_dpr:1.5/", "opengraph/"],
    ["opengraph/_dpr:2.0/", "opengraph/"],
    // an option with no value at all
    ["opengraph/_dpr/", "opengraph/"],
    // an inherited property name is not a valid ratio
    ["opengraph/_dpr:constructor/", "opengraph/"],
    // valid options alongside an invalid one are preserved
    ["opengraph/_wait:2_dpr:9/", "opengraph/_wait:2/"],
  ];

  for(let [suffix, expected] of cases) {
    test(`/:url/${suffix} redirects to /:url/${expected}`, async () => {
      let response = await request(suffix);
      assert.equal(response.status, 302);
      assert.equal(response.headers.get("location"), pathTo(expected));
    });
  }
});

describe("jpeg quality", () => {
  test("is encoded at quality 90", async () => {
    // The standard luminance table scaled to quality 90. Quality 80 starts [6, 4, 5, 6].
    assert.deepEqual(getLuminanceQuantizationTable(await render("opengraph/")).slice(0, 4), [3, 2, 2, 3]);
  });
});
