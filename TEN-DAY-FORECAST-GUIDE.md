# Build a 10-Day Forecast Yourself 🌤️

You're going to add a **10-day forecast** to the details sheet that slides up when you tap a card. You'll do it by hand, one small step at a time, in your real files.

You don't need to understand everything at once. Each step changes a few lines, and then you check that it worked before moving on. If something breaks, that's normal. Section 9 shows you how to find out why.

**What you'll build:** under "Next 24 hours" in the details sheet, a list like this:

```
Today   ☀️   59°   77°
Sat     🌧️   55°   68°
Sun     ⛅   52°   70°
...10 days in total
```

**Time:** about 1–2 hours, with breaks.

---

## Part 1: Get set up (do this once)

### Step 1. Install VS Code
1. Go to **https://code.visualstudio.com** and click the big **Download for Windows** button.
2. Run the installer. Click **Next** on everything. On the "Select Additional Tasks" screen, tick **"Add 'Open with Code' action to Windows Explorer"** for both file and folder. That lets you right-click a folder and open it in VS Code.
3. Open VS Code.

### Step 2. Open your project folder
1. In VS Code, click **File, then Open Folder...**
2. Go to **Documents → weather-app** and click **Select Folder**.
3. If it asks "Do you trust the authors of the files in this folder?", click **Yes, I trust the authors** (that's you and me!).

✅ **You should see:** your files listed in the left sidebar: `index.html`, `style.css`, `app.js`, `art`, and so on.

### Step 3. Install Live Server (so the app reloads by itself)
1. Click the **Extensions** icon in the far-left bar (it looks like four little squares).
2. Search for **Live Server** (by Ritwick Dey) and click **Install**.
3. In the sidebar, right-click **index.html**, then choose **Open with Live Server**.

✅ **You should see:** your app opens in the browser at an address like `http://127.0.0.1:5500/index.html`, with **real live weather** (not sample weather like the preview link). From now on, every time you save a file (**Ctrl+S**), the browser refreshes by itself.

> Why not just double-click `index.html`? Opening it through Live Server makes it act like a real website, which is how it will behave on GitHub Pages later.

### Step 4. Install Git and save a "starting point"
Git is like a save point in a video game. If you break something, you can always go back.

1. Download Git from **https://git-scm.com/download/win** and install it (the default choices are fine).
2. **Close and reopen VS Code** so it notices Git.
3. Click the **Source Control** icon in the left bar (it looks like a branch: three dots connected by lines).
4. Click **Initialize Repository**.
5. The first time, Git needs your name and email. Open the terminal with **View, then Terminal**, and type these two lines (press Enter after each, using your own email):
   ```
   git config --global user.name "Angie Soto"
   git config --global user.email "you@example.com"
   ```
6. Back in Source Control, type a message in the box at the top: `Starting point before the 10-day forecast`. Then click **Commit**. If it asks "stage all changes?", click **Yes** (or **Always**).

✅ **You should see:** the list of changed files disappears. Your save point exists!

> **Habit to build:** after each step below works, commit with a short message saying what you did. That's real developer workflow, and it's great project-management evidence for your portfolio.

---

## Part 2: Look at the data first

Before writing code, always look at what the API actually sends back.

### Step 5. Ask the API for 10 days, in your browser
Paste this into your browser's address bar (it's Austin, Texas):

```
https://api.open-meteo.com/v1/forecast?latitude=30.27&longitude=-97.74&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=10
```

✅ **You should see** text (JSON) with a `"daily"` section like this:

```
"daily": {
  "time": ["2026-10-30", "2026-10-31", ... 10 dates],
  "weather_code": [0, 61, 2, ...],
  "temperature_2m_max": [25.1, 20.3, ...],
  "temperature_2m_min": [15.2, 12.8, ...]
}
```

> 💡 Tip: Chrome and Edge have a **"Pretty-print"** checkbox at the top that makes it easier to read.

**The key idea:** these are **lists that line up**. Item number 0 in each list is today, item 1 is tomorrow, and so on. So for tomorrow:
- the date is `time[1]`
- the weather is `weather_code[1]`
- the high is `temperature_2m_max[1]`
- the low is `temperature_2m_min[1]`

Your code will walk through the list and build one row per day. Try changing `forecast_days=10` to `forecast_days=3` and press Enter to see the lists get shorter.

---

## Part 3: Build it

### Step 6. Ask for 10 days in the app (`app.js`)
1. Open **app.js**. Press **Ctrl+F** and search for `forecast_days`.
2. You'll find the `getWeather` function. Look at these two lines:
   ```js
       + "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max"
       + "&timezone=auto&forecast_days=2");
   ```
3. Make **two** changes:
   - Add `weather_code,` right after `&daily=` (we need each day's weather to pick its icon).
   - Change `forecast_days=2` to `forecast_days=10`.

   It should now look like this:
   ```js
       + "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max"
       + "&timezone=auto&forecast_days=10");
   ```
4. Save with **Ctrl+S**.

✅ **You should see:** the app looks exactly the same. That's correct! We're getting more data, but not showing it yet.

### Step 7. Peek at the data with the Console
The **Console** is where your code can talk to you. It's your #1 debugging tool.

1. In **app.js**, search for `function openDetails`. A few lines down you'll find:
   ```js
     const { current: now, hourly: h, daily: d } = card.weather;
   ```
2. Right **under** that line, add:
   ```js
     console.log("10-day data:", d);
   ```
3. Save. In the browser, press **F12** (or right-click, then **Inspect**) and click the **Console** tab.
4. Tap any weather card to open its details.

✅ **You should see:** `10-day data:` followed by something you can click to expand. Open it and check that `time` and `weather_code` each have **10** items.

> If you see red text instead, jump to **Part 4: When something goes wrong**.

You can leave the `console.log` in while you work and delete it at the end.

### Step 8. Add a spot for the forecast (`index.html`)
1. Open **index.html**. Search for `class="hourly"`. You'll see:
   ```html
         <p class="section-label">Next 24 hours</p>
         <div class="hourly"></div>
         <div class="detail-grid"></div>
   ```
2. Between the `hourly` line and the `detail-grid` line, add two new lines so it looks like this:
   ```html
         <p class="section-label">Next 24 hours</p>
         <div class="hourly"></div>
         <p class="section-label">10-day forecast</p>
         <div class="ten-day"></div>
         <div class="detail-grid"></div>
   ```
3. Save.

✅ **You should see:** tap a card, and the details sheet now has a "10-DAY FORECAST" heading with nothing under it yet. That empty `<div class="ten-day">` is the box your JavaScript will fill.

**Commit!** Message: `Add space for the 10-day forecast`

### Step 9. Turn a date into a day name (`app.js`)
The API gives dates like `"2026-10-31"`, but we want `"Sat"`. Let's write a tiny helper function.

1. In **app.js**, search for `function hourLabel`. Right **above** that function, add:
   ```js
   // "2026-10-31" -> "Sat"
   function dayName(date) {
     return new Date(date + "T12:00").toLocaleDateString("en-US", { weekday: "short" });
   }
   ```
2. Save. Test it in the **Console**: click next to the `>` at the bottom, type `dayName("2026-10-31")` and press Enter.

✅ **You should see:** `'Sat'`

> Why `"T12:00"`? It means "noon on that day". Without it, the computer may treat the date as midnight in London time, and in the US that can turn into the *day before*. Noon keeps it safe.

### Step 10. Build one row per day (`app.js`)
This is the main step! Take it slowly.

1. In **app.js**, inside `openDetails`, search for this line:
   ```js
     const feels = now.apparent_temperature - now.temperature_2m;
   ```
2. Right **above** that line, add this block:
   ```js
     // 10-day forecast: one row for each day the API sent us
     $(".ten-day").replaceChildren(...d.time.map((date, i) => {
       const row = document.createElement("div");
       row.className = "day-row";

       const name = document.createElement("span");
       name.className = "day-name";
       name.textContent = i === 0 ? "Today" : dayName(date);

       const low = document.createElement("span");
       low.className = "day-low";
       low.textContent = temp(d.temperature_2m_min[i]);

       const high = document.createElement("span");
       high.className = "day-high";
       high.textContent = temp(d.temperature_2m_max[i]);

       row.append(name, makeIcon(describeWeather(d.weather_code[i])), low, high);
       return row;
     }));
   ```
3. Save, then tap a card.

✅ **You should see:** 10 lines of text under "10-day forecast", each with a day name, an icon and two temperatures. They'll look squished together. We'll style them next.

**What each part means:**
| Code | In plain words |
|---|---|
| `d.time.map((date, i) => { ... })` | "For each date in the list, do this." `i` is the position: 0 for today, 1 for tomorrow, and so on |
| `document.createElement("div")` | Make a new, empty box |
| `.className = "day-row"` | Give it a name so CSS can style it |
| `.textContent = ...` | Put words inside it |
| `temp(...)` | Your existing helper that shows °F or °C, whichever the visitor picked |
| `makeIcon(describeWeather(...))` | Your existing helpers: turn a weather number into an emoji (or your friend's drawing later!) |
| `row.append(...)` | Put the 4 pieces inside the row, in order |
| `$(".ten-day").replaceChildren(...)` | Swap whatever was in the box for the new rows |

**Commit!** Message: `Show the 10-day forecast rows`

### Step 11. Make it pretty (`style.css`)
1. Open **style.css**. Search for `.detail-grid {`.
2. Right **above** it, paste:
   ```css
   /* 10-day forecast list */
   .ten-day {
     padding: 4px 14px;
     border-radius: 18px;
     background: rgba(255, 255, 255, 0.7);
   }
   .day-row {
     display: grid;
     grid-template-columns: 4em 2.5em 1fr 3em; /* day, icon, low, high */
     align-items: center;
     gap: 8px;
     padding: 8px 0;
     border-bottom: 1px solid rgba(0, 0, 0, 0.06);
     font-variant-numeric: tabular-nums; /* numbers line up neatly */
   }
   .day-row:last-child { border-bottom: none; }
   .day-name { font-weight: 600; }
   .day-row .icon { font-size: 1.4rem; text-align: center; }
   .day-row .icon img { height: 1.6rem; }
   .day-low { text-align: right; color: var(--soft-ink); }
   .day-high { text-align: right; font-weight: 600; }
   ```
3. Save, then tap a card.

✅ **You should see:** a neat, iPhone-style list: day on the left, icon, then the low (grey) and high (bold) lined up on the right.

**Play with it!** Try changing `rgba(255, 255, 255, 0.7)` to `rgba(216, 255, 158, 0.5)` for a minty glow, or `4em` to `6em`. Save and watch it change. Undo with **Ctrl+Z**.

### Step 12. Clean up and celebrate 🎉
1. Delete the `console.log("10-day data:", d);` line from Step 7.
2. Click **°C** and then **°F** in the app, and check that the 10-day temperatures switch too.
3. Try a few cities, including one far away, like Tokyo.
4. **Commit!** Message: `10-day forecast done`

Then tell me in the project. I'll copy it to the shared folder and the preview link (and add 10 days of sample weather there).

---

## Part 4: When something goes wrong

**Open the Console first (F12 → Console).** Red text tells you what broke and where. Click the file name on the right (like `app.js:285`) and it jumps you to the line.

| What you see | What it usually means | How to fix it |
|---|---|---|
| `Cannot read properties of undefined (reading '0')` | The code is reading a list that doesn't exist | Check that you added `weather_code,` to the `&daily=` line in Step 6 |
| `dayName is not defined` | The helper from Step 9 is missing or misspelled | Check the spelling. JavaScript cares about capital letters (`dayName` ≠ `dayname`) |
| `Unexpected token` or `missing )` | A bracket, comma or quote is missing | Compare your block with the guide character by character. VS Code underlines the problem in red |
| Nothing shows, and there's no red error | The class names don't match | `ten-day` in index.html must match `".ten-day"` in app.js exactly |
| The whole app is blank | A typo stopped all of app.js from running | Check the Console. Worst case, see "Undo everything" below |
| The browser doesn't refresh | Live Server isn't running | Look for **Port: 5500** at the bottom-right of VS Code. If it says **Go Live**, click it |

**Undo everything since your last commit:** in Source Control, hover over a changed file and click the curved-arrow **Discard Changes** icon. You're back at your last save point.

**Still stuck?** Copy the red error text and paste it to me in the project. Tell me which step you were on.

---

## ✅ Checklist

- [ ] VS Code installed and the weather-app folder open
- [ ] Live Server running, showing real weather
- [ ] Git set up, with a "starting point" commit
- [ ] Looked at the 10-day data in the browser (Step 5)
- [ ] `weather_code` added and `forecast_days=10` (Step 6)
- [ ] Saw the data in the Console (Step 7)
- [ ] Added the `ten-day` box to index.html (Step 8)
- [ ] `dayName` helper works in the Console (Step 9)
- [ ] 10 rows show in the details sheet (Step 10)
- [ ] Rows styled (Step 11)
- [ ] °F/°C switch works for the 10 days, `console.log` removed, final commit (Step 12)

---

## 🌟 Stretch ideas (when you're ready for more)

1. **Rain chance per day.** The data already has `d.precipitation_probability_max[i]`. Add a small blue `"60%"` under the icon when it's 20% or more. Hint: look at how the hourly strip does `rain.textContent = ...`.
2. **iPhone-style temperature bar.** Between low and high, add a little bar that's longer for days with a bigger temperature swing. Hint: give a `<span>` a `width` based on `high - low`.
3. **Highlight the weekend.** Give Saturday and Sunday rows a soft background. Hint: `new Date(date + "T12:00").getDay()` is `0` for Sunday and `6` for Saturday.
4. **Show the next 3 days on the card itself**, not just in the details sheet.
5. **Your friend's icons.** When @yurienthu sends icon drawings, the 10-day list uses them automatically, because it uses `makeIcon`!
