# Screenshot API

A runtime service to use live website screenshots on your site.

## Usage

Image URLs have the formats:

```
https://v1.screenshot.11ty.dev/1.0/:url/
https://v1.screenshot.11ty.dev/1.0/:url/:size/
https://v1.screenshot.11ty.dev/1.0/:url/:size/:aspectratio/
https://v1.screenshot.11ty.dev/1.0/:url/:size/:aspectratio/:zoom/
```

* `url` must be URI encoded.
* Valid `size` values:
  * `small`: 375×___ (default)
  * `medium`: 650×___
  * `large`: 1024×___
    * `aspectratio` of `9:16` is not supported (throws an error)
  * `opengraph`: always 1200×630, works with `zoom`
    * `aspectratio` is ignored (no errors thrown)
* Valid `aspectratio` values:
  * `1:1` (default)
  * `9:16`
* Valid `zoom` values:
  * `bigger` (1.4 `devicePixelRatio`)
  * `smaller` (0.71 `devicePixelRatio`)

## Deploy

<a href="https://app.netlify.com/start/deploy?repository=https://github.com/11ty/api-screenshot
"><img src="https://www.netlify.com/img/deploy/button.svg" border="0" alt="Deploy to Netlify"></a>

## Manual Cache Busting

If the screenshots aren’t updating at a high enough frequency you can pass in your own cache busting key using an underscore prefix `_` after your URL.

This can be any arbitrary string tied to your unique build, here’s an example that uses today’s date:

```
https://v1.screenshot.11ty.dev/1.0/:url/_20210802/
https://v1.screenshot.11ty.dev/1.0/:url/:size/_20210802/
https://v1.screenshot.11ty.dev/1.0/:url/:size/:aspectratio/_20210802/
https://v1.screenshot.11ty.dev/1.0/:url/:size/:aspectratio/:zoom/_20210802/
```
