const YOUTUBE_HOSTNAMES = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"];
const VIDEO_ID = /^[\w-]{11}$/;

function getVideoId(url) {
  if(!URL.canParse(url)) {
    return;
  }

  let { hostname, pathname, searchParams } = new URL(url);
  let id;
  if(hostname === "youtu.be") {
    id = pathname.split("/")[1];
  } else if(YOUTUBE_HOSTNAMES.includes(hostname)) {
    let [, first, second] = pathname.split("/");
    if(first === "watch") {
      id = searchParams.get("v");
    } else if(["shorts", "live", "embed"].includes(first)) {
      id = second;
    }
  }

  if(id && VIDEO_ID.test(id)) {
    return id;
  }
}

export function isYouTubeVideoUrl(url) {
  return Boolean(getVideoId(url));
}

// The embed player is far lighter than the watch page, which often times out (#25).
export function getYouTubeEmbedUrl(url) {
  return `https://www.youtube-nocookie.com/embed/${getVideoId(url)}`;
}
