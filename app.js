// ============================================================
// Chibi Weather: app.js (the "brain" of the page)
// 1. Find where the visitor is from their IP address
// 2. Ask Open-Meteo for the weather at that spot
// 3. Build a cute card for it, plus a card for every city they add
// 4. Let them drag cards around and tap one for more details
// ============================================================

const FALLBACK_PLACE = { name: "New York", country: "United States", latitude: 40.71, longitude: -74.01 };
const SAVED_CITIES_KEY = "chibi-weather-cities"; // where the card order is remembered
const UNIT_KEY = "chibi-weather-unit";

const cardsBox = document.getElementById("cards");
const template = document.getElementById("card-template");
const form = document.getElementById("add-form");
const cityInput = document.getElementById("city-input");
const message = document.getElementById("message");
const unitButtons = document.querySelectorAll(".units button");
const details = document.getElementById("details");

// Each card remembers its place and weather so we can redraw it (e.g. °F to °C)
const cards = []; // [{ place, weather, element, isHere }]
let unit = load(UNIT_KEY, null); // "F" or "C"; null means "decide from the visitor's country"

// Which picture to show for each mood. Right now they all use the one
// drawing we have. When your friend sends new art, drop the file in the
// art/ folder and change the file name here.
const CHIBI_ART = {
  sunny:  "art/chibi-default.png",
  cloudy: "art/chibi-default.png",
  rainy:  "art/chibi-default.png",
  snowy:  "art/chibi-default.png",
  stormy: "art/chibi-default.png",
  foggy:  "art/chibi-default.png",
  night:  "art/chibi-default.png",
};

// Drawn weather icons. While a name is set to null, the app shows the emoji
// instead. When your friend sends an icon, save it in art/icons/ and put its
// file name here, e.g.  sun: "art/icons/sun.png",
const ICON_ART = {
  sun:    null,
  moon:   null,
  cloud:  null,
  partly: null, // sun peeking out from behind a cloud
  rain:   null,
  snow:   null,
  storm:  null, // lightning
  fog:    null,
};

// The four times of day shown on each card (24-hour clock, the city's local time)
const TIMES_OF_DAY = [
  { label: "Morning",   hour: 9 },
  { label: "Noon",      hour: 12 },
  { label: "Afternoon", hour: 15 },
  { label: "Night",     hour: 21 },
];

// Makes a weather icon: the drawn picture if we have one, else the emoji
function makeIcon(info) {
  const box = document.createElement("div");
  box.className = "icon";
  const picture = ICON_ART[info.art];
  if (picture) {
    const img = document.createElement("img");
    img.src = picture;
    img.alt = info.text;
    img.onerror = () => { box.textContent = info.icon; }; // file missing? fall back to the emoji
    box.appendChild(img);
  } else {
    box.textContent = info.icon;
  }
  return box;
}

// ---------- Weather codes -> words, emoji and mood ----------
// The API sends numbers (WMO codes). Full list: https://open-meteo.com/en/docs
function describeWeather(code, isDay = 1) {
  let info;
  if (code === 0)      info = { text: "Sunny",         icon: "☀️", art: "sun",    mood: "sunny" };
  else if (code <= 2)  info = { text: "Partly cloudy", icon: "⛅", art: "partly", mood: "sunny" };
  else if (code === 3) info = { text: "Cloudy",        icon: "☁️", art: "cloud",  mood: "cloudy" };
  else if (code <= 48) info = { text: "Foggy",         icon: "🌫️", art: "fog",    mood: "foggy" };
  else if (code <= 67) info = { text: "Rainy",         icon: "🌧️", art: "rain",   mood: "rainy" };
  else if (code <= 77) info = { text: "Snowy",         icon: "❄️", art: "snow",   mood: "snowy" };
  else if (code <= 82) info = { text: "Showers",       icon: "🌦️", art: "rain",   mood: "rainy" };
  else if (code <= 86) info = { text: "Snow showers",  icon: "🌨️", art: "snow",   mood: "snowy" };
  else                 info = { text: "Stormy",        icon: "⛈️", art: "storm",  mood: "stormy" };

  // At night, calm skies become the starry night mood
  if (!isDay && (info.mood === "sunny" || info.mood === "cloudy")) {
    info = { text: code === 0 ? "Clear night" : info.text, icon: code <= 2 ? "🌙" : "☁️", art: code <= 2 ? "moon" : "cloud", mood: "night" };
  }
  return info;
}

// A little outfit tip, like a friend checking the weather for you
function outfitTip(tempC, mood) {
  if (mood === "rainy" || mood === "stormy") return "☂️ Bring an umbrella!";
  if (mood === "snowy") return "🧣 Scarf and mittens time";
  if (tempC >= 29) return "🩳 Shorts and sunscreen";
  if (tempC >= 21) return "👕 T-shirt weather";
  if (tempC >= 13) return "🧶 Grab a cozy sweater";
  if (tempC >= 5)  return "🧥 Jacket weather";
  return "🥶 Bundle up, it's chilly";
}

// ---------- Talking to the APIs ----------

// Where is this visitor? Uses their IP address (no permission pop-up needed).
async function findVisitor() {
  try {
    const data = await getJSON("https://get.geojs.io/v1/ip/geo.json");
    return {
      name: data.city || data.region || data.country,
      country: data.country,
      countryCode: data.country_code,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
    };
  } catch {
    return FALLBACK_PLACE; // if IP lookup is blocked (e.g. an ad blocker), show New York
  }
}

// City name -> latitude/longitude
async function findCity(name) {
  const data = await getJSON("https://geocoding-api.open-meteo.com/v1/search?count=1&name=" + encodeURIComponent(name));
  if (!data.results || data.results.length === 0) throw new Error(`Couldn't find "${name}". Check the spelling?`);
  const r = data.results[0];
  return { name: r.name, country: r.country, latitude: r.latitude, longitude: r.longitude };
}

// Latitude/longitude -> weather for today and tomorrow (always °C and km/h; we convert when showing it)
function getWeather(place) {
  return getJSON("https://api.open-meteo.com/v1/forecast"
    + `?latitude=${place.latitude}&longitude=${place.longitude}`
    + "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day"
    + "&hourly=temperature_2m,weather_code,is_day,precipitation_probability"
    + "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max"
    + "&timezone=auto&forecast_days=2");
}

async function getJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("The weather service didn't answer. Try again in a bit.");
  return response.json();
}

// ---------- Building and filling a card ----------

function addCard(place, { isHere = false } = {}) {
  const element = template.content.firstElementChild.cloneNode(true); // copy the blueprint
  element.classList.add("loading");
  element.style.setProperty("--i", cards.length); // so cards appear one after another
  element.querySelector(".place").textContent = (isHere ? "📍 " : "") + place.name;
  const card = { place, weather: null, element, isHere };

  element.querySelector(".remove").addEventListener("click", (event) => {
    event.stopPropagation(); // don't also open the details
    cards.splice(cards.indexOf(card), 1);
    element.remove();
    saveCities();
  });

  // Tap (or press Enter on) a card to see more details
  element.addEventListener("click", () => openDetails(card));
  element.addEventListener("keydown", (event) => { if (event.key === "Enter") openDetails(card); });

  cards.push(card);
  cardsBox.appendChild(element);
  return card;
}

async function loadCard(card) {
  try {
    card.weather = await getWeather(card.place);
    drawCard(card);
  } catch (error) {
    card.element.querySelector(".status").textContent = "Couldn't load 😢";
  }
}

function drawCard(card) {
  const { element, weather } = card;
  const now = weather.current;
  const today = weather.daily;
  const info = describeWeather(now.weather_code, now.is_day);
  const $ = (selector) => element.querySelector(selector);

  element.className = "card mood-" + info.mood + (card.isHere ? " here" : "");
  element.dataset.timezone = weather.timezone;
  element.setAttribute("aria-label", `${card.place.name}: ${temp(now.temperature_2m)}, ${info.text}. Press Enter for details.`);
  $(".chibi").src = CHIBI_ART[info.mood];
  $(".temp").textContent = temp(now.temperature_2m);
  $(".status").textContent = info.text;
  $(".tip").textContent = outfitTip(now.temperature_2m, info.mood);

  $(".stats").replaceChildren(
    makeBox("High / Low", `${temp(today.temperature_2m_max[0])} / ${temp(today.temperature_2m_min[0])}`),
    makeBox("Feels like", temp(now.apparent_temperature)),
    makeBox("Rain", `${today.precipitation_probability_max[0] ?? 0}%`),
    makeBox("Humidity", `${now.relative_humidity_2m}%`),
  );

  // Morning / Noon / Afternoon / Night tiles (hourly list starts at midnight, local time)
  const h = weather.hourly;
  $(".times").replaceChildren(...TIMES_OF_DAY.map(({ label, hour }) => {
    const tile = document.createElement("div");
    tile.className = "tile";
    const name = document.createElement("span");
    name.className = "label";
    name.textContent = label;
    const clock = document.createElement("span");
    clock.className = "hour";
    clock.textContent = hourLabel(hour);
    const value = document.createElement("b");
    value.textContent = temp(h.temperature_2m[hour]);
    tile.append(name, clock, makeIcon(describeWeather(h.weather_code[hour], h.is_day[hour])), value);
    return tile;
  }));

  drawSky($(".sky-fx"), info.mood);
  updateClock(element);
}

// A small box with a bold value and a label under it
function makeBox(label, value) {
  const box = document.createElement("div");
  const bold = document.createElement("b");
  bold.textContent = value;
  box.append(bold, label);
  return box;
}

// 9 -> "9 AM", 12 -> "12 PM", 21 -> "9 PM"
function hourLabel(hour) {
  const suffix = hour < 12 ? "AM" : "PM";
  return `${hour % 12 || 12} ${suffix}`;
}

// Show a °C number in whichever unit the visitor picked
function temp(celsius) {
  const value = unit === "F" ? celsius * 9 / 5 + 32 : celsius;
  return Math.round(value) + "°";
}

// Show a km/h wind speed in mph for °F people
function wind(kmh) {
  return unit === "F" ? `${Math.round(kmh / 1.609)} mph` : `${Math.round(kmh)} km/h`;
}

// Each card shows the local time in its own city, ticking along
function updateClock(element) {
  const timeZone = element.dataset.timezone;
  if (!timeZone) return;
  const now = new Date();
  element.querySelector(".time").textContent = now.toLocaleTimeString("en-US", { timeZone, hour: "numeric", minute: "2-digit" });
  element.querySelector(".date").textContent = now.toLocaleDateString("en-US", { timeZone, weekday: "short", month: "short", day: "numeric" });
}
setInterval(() => cards.forEach((c) => updateClock(c.element)), 30 * 1000);

// ---------- Details sheet ----------
function openDetails(card) {
  if (!card.weather || justDragged) return;
  const { current: now, hourly: h, daily: d } = card.weather;
  const info = describeWeather(now.weather_code, now.is_day);
  const $ = (selector) => details.querySelector(selector);

  $(".d-place").textContent = card.place.name;
  $(".d-temp").textContent = temp(now.temperature_2m);
  $(".d-status").textContent = info.text;
  $(".d-range").textContent = `H: ${temp(d.temperature_2m_max[0])}  L: ${temp(d.temperature_2m_min[0])}`;

  // The next 24 hours, starting from the hour it is now in that city
  const start = Math.max(0, h.time.findIndex((t) => t.slice(0, 13) === now.time.slice(0, 13)));
  $(".hourly").replaceChildren(...h.time.slice(start, start + 24).map((t, n) => {
    const i = start + n;
    const item = document.createElement("div");
    item.className = "hour-item";
    const when = document.createElement("small");
    when.textContent = n === 0 ? "Now" : hourLabel(Number(t.slice(11, 13)));
    const rain = document.createElement("div");
    rain.className = "rain";
    rain.textContent = h.precipitation_probability[i] >= 20 ? h.precipitation_probability[i] + "%" : "";
    const value = document.createElement("b");
    value.textContent = temp(h.temperature_2m[i]);
    item.append(when, makeIcon(describeWeather(h.weather_code[i], h.is_day[i])), rain, value);
    return item;
  }));

  const feels = now.apparent_temperature - now.temperature_2m;
  const uv = d.uv_index_max[0];
  $(".detail-grid").replaceChildren(
    makeDetail("Feels like", temp(now.apparent_temperature),
      Math.abs(feels) < 2 ? "About the same as the real temperature" : feels < 0 ? "Wind makes it feel colder" : "Humidity makes it feel warmer"),
    makeDetail("Humidity", `${now.relative_humidity_2m}%`, now.relative_humidity_2m > 70 ? "Pretty muggy" : "Comfortable"),
    makeDetail("Wind", wind(now.wind_speed_10m), now.wind_speed_10m > 30 ? "Hold onto your hat!" : "A gentle breeze"),
    makeDetail("UV index", Math.round(uv), uv >= 6 ? "High: wear sunscreen" : uv >= 3 ? "Moderate" : "Low"),
    makeDetail("Sunrise", clockFromISO(d.sunrise[0]), "Local time"),
    makeDetail("Sunset", clockFromISO(d.sunset[0]), "Local time"),
  );

  details.showModal();
  details.querySelector(".sheet").scrollTop = 0;
}

function makeDetail(label, value, note) {
  const box = document.createElement("div");
  box.className = "detail";
  const title = document.createElement("small");
  title.textContent = label;
  const big = document.createElement("b");
  big.textContent = value;
  const small = document.createElement("span");
  small.textContent = note;
  box.append(title, big, small);
  return box;
}

// "2026-10-30T07:24" -> "7:24 AM"
function clockFromISO(text) {
  const [hour, minute] = text.slice(11, 16).split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

details.querySelector(".sheet-close").addEventListener("click", () => details.close());
// Tapping the dark area outside the sheet closes it too
details.addEventListener("click", (event) => { if (event.target === details) details.close(); });

// ---------- Drag cards to reorder them ----------
// Mouse: press and move. Phone: press and hold for a moment, then move.
let justDragged = false; // stops a drag from also counting as a tap

function enableDragToReorder() {
  let drag = null;

  cardsBox.addEventListener("pointerdown", (event) => {
    const card = event.target.closest(".card");
    if (!card || event.target.closest("button") || event.button !== 0) return;
    drag = {
      card, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      x: event.clientX, y: event.clientY, active: false, tx: 0, ty: 0,
      holdTimer: event.pointerType === "mouse" ? null : setTimeout(() => begin(), 280),
    };
  });

  window.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag.x = event.clientX;
    drag.y = event.clientY;
    const moved = Math.hypot(drag.x - drag.startX, drag.y - drag.startY);
    if (!drag.active) {
      if (drag.holdTimer) { if (moved > 10) cancel(); return; } // finger moved early: they're scrolling
      if (moved > 6) begin(); else return;
    }
    follow();
    swapIfOverAnotherCard();
  });

  // While dragging on a phone, stop the page from scrolling instead
  window.addEventListener("touchmove", (event) => { if (drag?.active) event.preventDefault(); }, { passive: false });
  window.addEventListener("pointerup", finish);
  window.addEventListener("pointercancel", finish);

  function begin() {
    if (!drag) return;
    drag.active = true;
    const rect = drag.card.getBoundingClientRect();
    drag.offsetX = drag.startX - rect.left; // where on the card you grabbed it
    drag.offsetY = drag.startY - rect.top;
    drag.card.classList.add("dragging");
    if (navigator.vibrate) navigator.vibrate(10); // tiny buzz on phones
    follow();
  }

  // Move the card so it stays under the pointer
  function follow() {
    const { card } = drag;
    const rect = card.getBoundingClientRect();
    const homeLeft = rect.left - drag.tx; // where the card would be without the shift
    const homeTop = rect.top - drag.ty;
    drag.tx = drag.x - drag.offsetX - homeLeft;
    drag.ty = drag.y - drag.offsetY - homeTop;
    card.style.transform = `translate(${drag.tx}px, ${drag.ty}px) scale(1.03) rotate(1deg)`;
  }

  function swapIfOverAnotherCard() {
    const target = [...cardsBox.children].find((el) => {
      if (el === drag.card) return false;
      const r = el.getBoundingClientRect();
      return drag.x > r.left && drag.x < r.right && drag.y > r.top && drag.y < r.bottom;
    });
    if (!target) return;
    const all = [...cardsBox.children];
    animateLayoutChange(() => {
      if (all.indexOf(target) < all.indexOf(drag.card)) cardsBox.insertBefore(drag.card, target);
      else cardsBox.insertBefore(drag.card, target.nextSibling);
    });
    follow();
  }

  // "FLIP" trick: remember where cards were, move them, then animate from old spot to new spot
  function animateLayoutChange(change) {
    const others = [...cardsBox.children].filter((el) => el !== drag.card);
    const before = new Map(others.map((el) => [el, el.getBoundingClientRect()]));
    change();
    others.forEach((el) => {
      const old = before.get(el);
      const now = el.getBoundingClientRect();
      const dx = old.left - now.left;
      const dy = old.top - now.top;
      if (dx || dy) {
        el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
          { duration: 300, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
      }
    });
  }

  function finish(event) {
    if (!drag || (event && event.pointerId !== drag.pointerId)) return;
    clearTimeout(drag.holdTimer);
    if (drag.active) {
      const { card } = drag;
      card.classList.remove("dragging");
      card.classList.add("settling"); // glide into its new spot
      card.style.transform = "";
      setTimeout(() => card.classList.remove("settling"), 350);
      // Put our list in the same order as the cards on screen, then remember it
      cards.sort((a, b) => [...cardsBox.children].indexOf(a.element) - [...cardsBox.children].indexOf(b.element));
      saveCities();
      justDragged = true;
      setTimeout(() => { justDragged = false; }, 50);
    }
    drag = null;
  }

  function cancel() {
    clearTimeout(drag.holdTimer);
    drag = null;
  }
}
enableDragToReorder();

// ---------- Sky effects: rain, snow, clouds, stars ----------
function drawSky(sky, mood) {
  sky.innerHTML = "";
  if (mood === "sunny")  sprinkle(sky, 1, "sun", "☀️", 20, 20);
  if (mood === "rainy")  sprinkle(sky, 30, "raindrop", "", 0.6, 1.1);
  if (mood === "stormy") sprinkle(sky, 50, "raindrop heavy", "", 0.4, 0.7);
  if (mood === "snowy")  sprinkle(sky, 20, "snowflake", "❄", 4, 8);
  if (mood === "cloudy" || mood === "foggy") sprinkle(sky, 3, "cloud", "☁️", 18, 30);
  if (mood === "stormy") {
    // Three dark clouds spread across the top, slowly rolling back and forth
    [-15, 30, 70].forEach((left, i) => {
      const cloud = document.createElement("div");
      cloud.className = "storm-cloud";
      cloud.style.left = left + "%";
      cloud.style.animationDelay = -i * 2 + "s";
      sky.appendChild(cloud);
    });
  }
  if (mood === "night")  sprinkle(sky, 18, "star", "✦", 2, 2);
  if (mood === "stormy") addLightning(sky);
}

// A lightning bolt and a flash of light that strike together every few seconds
function addLightning(sky) {
  const seconds = 5 + Math.random() * 3;  // how often it strikes
  const spot = 15 + Math.random() * 45;   // how far across the sky it strikes (%)
  const flash = document.createElement("div");
  flash.className = "flash";
  flash.style.setProperty("--x", spot + "%");
  const bolt = document.createElement("img");
  bolt.className = "bolt";
  bolt.src = "art/weather/bolt.svg";
  bolt.alt = "";
  bolt.style.left = spot + "%";
  // Same timing for both, so the bolt and the flash happen at the same moment
  for (const el of [flash, bolt]) {
    el.style.animationDuration = seconds + "s";
    el.style.animationDelay = -Math.random() * seconds + "s";
  }
  sky.append(flash, bolt);
}

// Scatters little decorations around with random spots and speeds
function sprinkle(sky, count, className, symbol, minSeconds, maxSeconds) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = className;
    el.textContent = symbol;
    if (className !== "sun") el.style.left = Math.random() * 100 + "%";
    if (className === "cloud" || className === "star") el.style.top = Math.random() * 55 + "%";
    el.style.animationDuration = minSeconds + Math.random() * (maxSeconds - minSeconds) + "s";
    el.style.animationDelay = -Math.random() * maxSeconds + "s"; // start mid-animation, so it's never empty
    sky.appendChild(el);
  }
}

// ---------- Remembering things in the browser ----------
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode: just don't save */ }
}
// Saves every card in order. "Your location" is saved as { here: true },
// because it gets looked up fresh each visit.
function saveCities() {
  save(SAVED_CITIES_KEY, cards.map((c) => (c.isHere ? { here: true } : c.place)));
}

// ---------- Search bar and °F/°C switch ----------
form.addEventListener("submit", async (event) => {
  event.preventDefault(); // stop the page from reloading
  message.textContent = "";
  try {
    const place = await findCity(cityInput.value.trim());
    cityInput.value = "";
    cityInput.blur();
    const card = addCard(place);
    saveCities();
    await loadCard(card);
    card.element.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    message.textContent = error.message;
  }
});

unitButtons.forEach((button) => button.addEventListener("click", () => {
  unit = button.dataset.unit;
  save(UNIT_KEY, unit);
  showUnit();
}));

function showUnit() {
  unitButtons.forEach((b) => b.classList.toggle("on", b.dataset.unit === unit));
  cards.filter((c) => c.weather).forEach(drawCard);
}

// ---------- Forest sparkles ----------
// Scatters glowing dots that drift up through the forest background
function makeSparkles(count) {
  const box = document.querySelector("#forest .sparkles");
  for (let i = 0; i < count; i++) {
    const dot = document.createElement("span");
    const size = 2 + Math.random() * 4;
    dot.className = "sparkle";
    dot.style.width = dot.style.height = size + "px";
    dot.style.left = Math.random() * 100 + "%";
    dot.style.bottom = Math.random() * 60 + "%";
    const seconds = 8 + Math.random() * 10;
    dot.style.animationDuration = `${seconds}s, ${1.5 + Math.random() * 2}s`;
    dot.style.animationDelay = `${-Math.random() * seconds}s, ${-Math.random() * 2}s`;
    box.appendChild(dot);
  }
}
makeSparkles(45);

// ---------- Start! ----------
async function start() {
  const here = await findVisitor();
  if (!unit) unit = ["US", "LR", "MM"].includes(here.countryCode) ? "F" : "C"; // countries that use °F
  showUnit();

  // Rebuild the cards in the saved order. Older saves didn't include
  // "your location", so put it first if it's missing.
  let saved = load(SAVED_CITIES_KEY, []);
  if (!saved.some((p) => p.here)) saved = [{ here: true }, ...saved];
  const allCards = saved.map((p) => (p.here ? addCard(here, { isHere: true }) : addCard(p)));
  await Promise.all(allCards.map(loadCard)); // load all cards at the same time
}

start();
