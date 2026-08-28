<p align="center"><img src="https://www.11ty.dev/img/logo-github.svg" width="200" height="200" alt="11ty Logo"></p>

# Screenshot API

A runtime service to use live website screenshots on your site.

Read the [Blog post: Building an Automated Screenshot Service on Netlify in ~140 Lines of Code](https://www.zachleat.com/web/screenshots/).

## Usage

Image URLs have the formats:

```
/:url/
/:url/:size/
/:url/:size/x.jpg
/:url/:size/:aspectratio/
/:url/:size/:aspectratio/:zoom/
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

### Advanced Options

#### Custom Wait Conditions

You can customize the conditions with which the headless browser will wait to take the screenshot. At a low level, this controls the [`waitUntil` property in Puppeteer’s `goto` call](https://pptr.dev/#?product=Puppeteer&version=v13.3.1&show=api-pagegotourl-options). The options are:

* DOMContentLoaded `wait:0`
* Load event `wait:1` (default)
* Load event and there have been no network connections for 500ms: `wait:2`
* Load event and there are fewer than two network connections for 500ms: `wait:3`

```
/:url/_wait:0/
/:url/_wait:1/
/:url/_wait:2/
/:url/_wait:3/
```

#### Custom Timeout

Number of seconds to wait before the request times out. We will attempt to simulate the stop button and return the screenshot that exists up to that point. Worst case, a default Eleventy logo is returned.

* Minimum: `3`
* Maximum: `9`

```
/:url/_timeout:3/
/:url/_timeout:9/
```

#### Higher Resolution

`_dpr:2` multiplies the output resolution without changing the framing. The viewport stays the same size in CSS pixels, so you get the same screenshot with twice as many pixels—useful for `opengraph` images, which social networks display on 2× screens.

* Valid `dpr` values:
  * `1-5` (1.5×, spelled with a `-` to stay safe in a query string)
  * `2`

Any other value—including `1`, which is already the default, and `1.5`—redirects to the canonical URL without it.

```
/:url/opengraph/_dpr:2/
/:url/opengraph/_dpr:2/x.jpg
```

| Request | Output |
| --- | --- |
| `/:url/opengraph/` | 1200×630 |
| `/:url/opengraph/_dpr:1-5/` | 1800×945 |
| `/:url/opengraph/_dpr:2/` | 2400×1260 |

This is unrelated to `zoom`, which changes how much of the page fits in the shot while keeping the output size fixed. The two combine: `/:url/opengraph/1:1/bigger/_dpr:2/` is the `bigger` framing at 2400×1260.

#### Combine these options

You can use any of these advanced options together, like `/:url/_wait:0_timeout:2/`. Order only matters to the uniqueness of the URL caching on the CDN: `/:url/_wait:0/` and `/:url/_wait:0/` will be functionally equivalent but make two different screenshot requests.
