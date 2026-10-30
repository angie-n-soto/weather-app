# Why HTML, CSS and JavaScript?

Every website is built from three languages. Each one does a different job, and the browser on every phone and laptop already understands all three. That's why we don't need to install anything or pay for a server.

| Language | Its job | In a body | In this app |
|---|---|---|---|
| **HTML** (`index.html`) | What's on the page | The skeleton | The title, the search box, and the blueprint for one weather card |
| **CSS** (`style.css`) | How it looks | The clothes | Cream background, rounded cards, sky colors, the chibi hopping and shivering |
| **JavaScript** (`app.js`) | What it does | The brain | Finds your location, asks the weather API, builds cards, remembers your cities |

## See it for yourself (5-minute experiment)

Download the `weather-app` folder and double-click `index.html` to open it in your browser. Then try these, one at a time, and refresh the page after each:

1. **Remove the clothes:** in `index.html`, delete the line `<link rel="stylesheet" href="style.css">`. The page still has its words and search box, but it's plain black text with no colors, cards or animation. That's HTML alone. Undo it.
2. **Remove the brain:** delete the line `<script src="app.js"></script>`. The page looks styled, but there are no cards and typing a city does nothing. Nothing ever talks to the weather API, because only JavaScript can do that. Undo it.
3. **Change the brain:** in `app.js`, find `outfitTip` and change `"👕 T-shirt weather"` to your own words. Refresh to see your change.

## Where the API calls happen

All of the "connecting to an API" skill lives in `app.js`, in the section called *Talking to the APIs*. There are three APIs:

1. **geojs.io** looks at the visitor's IP address and answers with their city and coordinates. No pop-up asking for permission is needed. It's approximate, usually the nearest big city.
2. **Open-Meteo Geocoding** turns a typed city name ("Tokyo") into coordinates.
3. **Open-Meteo Forecast** turns coordinates into the weather: now, every hour today, and today's high and low.

Each one is the same three steps: build a URL, `fetch()` it, then read the JSON answer. That's the same thing you did by pasting a URL into your browser on day one.

## Can it handle 20-30 people at once?

Yes, easily, and here's why:

- **The website is just files.** GitHub Pages hands the same 3 files plus the art to everyone through a global network built for millions of visitors. 30 people is nothing to it.
- **Each visitor's own browser asks for the weather.** Our site never sits in the middle, so there's no server of ours that could get overwhelmed.
- **The free API limits are generous.** Open-Meteo allows 10,000 requests a day for non-commercial use. A visitor with 3 cities uses about 4 requests, so even 30 visitors refreshing a few times a day is a few hundred.
- **If the IP lookup fails** (some ad blockers block it), the app quietly shows New York instead of breaking.

## Words worth knowing
- **API**: a website made for programs instead of people. You send a URL, it sends back data.
- **JSON**: the text format APIs answer in, made of `"name": value` pairs.
- **fetch()**: the JavaScript command that sends a request to an API.
- **localStorage**: a small notebook in the visitor's browser. The app writes their added cities there so they're still there next visit.
