# Weather App: Project Plan

A shareable weather web app that pulls live data from a real weather API and features original digital art by a friend (a cross-field collaboration between a developer and an artist).

## Tech choices (and why)

| Choice | Why |
|---|---|
| Plain HTML, CSS and JavaScript | No build tools to learn first; you can see every line. |
| [Open-Meteo](https://open-meteo.com/) weather API | Free, real, live data, and needs no API key (nothing secret to leak). |
| GitHub + GitHub Pages | Free hosting, gives friends a link, and the commit history shows your progress. |
| Friend's art as PNGs | The chibi character reacts to the weather with CSS animations. |

## Milestones

### Phase 1: Setup
- [ ] Create a GitHub account (if needed) and a repo called `weather-app`
- [ ] Turn on GitHub Pages so the repo gets a public link
- [ ] Add a "Hello weather" `index.html` and see it live

### Phase 2: Connect to the API (the core skill)
- [ ] Learn what an API request is by opening an Open-Meteo URL in your browser
- [x] Use JavaScript `fetch()` to get the current temperature for one city (starter app)
- [x] Add a city search box (Open-Meteo geocoding API)
- [x] Handle errors (city not found, no internet)

### Phase 3: Design + friend's art
- [ ] Send your friend ART-BRIEF.md, then collect art (sunny, rainy, cloudy, snowy, night versions if possible)
- [ ] Show a different chibi pose/outfit per weather type
- [x] Add cute animations (bobbing idle, falling rain/snow, floating clouds)
- [x] Add an "Art by @yurienthu" credit (add a link once we know her page)

### Phase 4: Polish
- [x] Make it look good on phones
- [x] Add a 5-day forecast (replaced by Morning/Noon/Afternoon/Night tiles)
- [x] Show weather for the visitor's location (from their IP), with a °C/°F toggle
- [x] Let visitors add more cities as separate cards (remembered in their browser)

### Phase 4b: Code it myself
- [ ] Set up VS Code, Live Server and Git
- [ ] Build the 10-day forecast by hand (follow TEN-DAY-FORECAST-GUIDE.md)

### Phase 5: Ship and showcase
- [ ] Share the link with friends and collect feedback
- [ ] Write a README: what it does, tech used, how you collaborated, screenshots
- [ ] Track remaining ideas as GitHub Issues (that's your project-management evidence)

## Art requests for your friend
- Transparent PNGs (like `Chibis 2.2.png`, which already has a transparent background)
- One version per weather: sunny, rainy, cloudy, snowy, stormy, night
- Optional: small props (umbrella, sunglasses, scarf) as separate PNGs so they can be animated

## Art received
- `Chibis 2.2.png` (702x753, transparent): pink-haired horned chibi in an off-shoulder sweater. Good default/"cloudy" pose.
