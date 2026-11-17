import { test } from "node:test";
import assert from "node:assert/strict";
import { isYouTubeVideoUrl, getYouTubeEmbedUrl } from "../youtube.js";

const EMBED = "https://www.youtube-nocookie.com/embed/Z_MG97DzNPs";

test("YouTube video URLs map to the embed player", () => {
  for(let url of [
    "https://www.youtube.com/watch?v=Z_MG97DzNPs",
    "https://youtube.com/watch?v=Z_MG97DzNPs&t=42s",
    "https://m.youtube.com/watch?v=Z_MG97DzNPs",
    "https://youtu.be/Z_MG97DzNPs?si=abc",
    "https://www.youtube.com/shorts/Z_MG97DzNPs",
    "https://www.youtube.com/live/Z_MG97DzNPs",
  ]) {
    assert.ok(isYouTubeVideoUrl(url), url);
    assert.equal(getYouTubeEmbedUrl(url), EMBED, url);
  }
});

test("Other URLs are not YouTube video URLs", () => {
  for(let url of [
    "https://www.11ty.dev/",
    "https://www.youtube.com/",
    "https://www.youtube.com/@11ty",
    "https://www.youtube.com/watch?v=not-a-valid-id",
    "https://notyoutube.com/watch?v=Z_MG97DzNPs",
  ]) {
    assert.equal(isYouTubeVideoUrl(url), false, url);
  }
});
