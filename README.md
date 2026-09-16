# Where are we painting? 🎨🥂

A one-page venue vote for a self-organised paint & sip bachelorette in Tallinn.
Send the link to the group chat, everyone types their first name and picks their
three favourites, and the tally updates live for everyone.

No accounts, no app, no build step — it's five static files.

```
index.html          the page
styles.css          the looks
app.js              voting logic
venues.js      ←    the only file you edit to change venues
config.js      ←    your Supabase keys go here
images/             one folder per venue, for photos
images/README.md    which folder belongs to which venue
supabase/schema.sql the one-time database setup
scripts/            regenerates the image folders
```

---

## 1. Make the votes shared (Supabase, ~5 minutes)

Until you do this the page runs in **preview mode**: it works, but each person
only sees their own votes. You'll see a note on the page saying so.

1. Make a free account at [supabase.com](https://supabase.com) and create a new
   project. Any region near Estonia (e.g. Frankfurt) is fine. It takes a minute
   or two to spin up.
2. In the project, open **SQL Editor** → **New query**. Paste in everything from
   [`supabase/schema.sql`](supabase/schema.sql) and hit **Run**. That creates the
   `votes` and `notes` tables, opens them for anonymous use, and switches on
   live updates.
3. Go to **Project Settings** → **API** (in newer dashboards: **API Keys**) and copy:
   - the **Project URL** — looks like `https://abcdefghijklm.supabase.co`
   - the **anon / public** key — a long string starting `eyJ…`
4. Paste both into `config.js`:

   ```js
   window.SUPABASE_CONFIG = {
     url: "https://abcdefghijklm.supabase.co",
     anonKey: "eyJhbGciOi..."
   };
   ```

5. Commit and push. Within a minute the live site picks it up.

**Is it safe to commit the anon key?** Yes — it's designed to be public and ends
up in every visitor's browser regardless. What protects the table is the row
level security in `schema.sql`, which lets anonymous visitors do exactly three
things on exactly one table: read votes, add a vote, change a vote. Deleting
isn't allowed at all, so nobody can wipe the results by accident. Never commit
the **service_role** key — that one really is a master key.

**If the live tally doesn't update by itself:** realtime replication may be off
for the table. Supabase → **Database** → **Replication** → add `votes` to the
`supabase_realtime` publication. Even without it the page re-checks every 20
seconds and whenever someone switches back to the tab, so it'll never be more
than a few seconds stale — it just won't be instant.

---

## 2. Put it online

There's no build step, so any static host works. All of these redeploy by
themselves every time you push.

### Vercel

1. [vercel.com](https://vercel.com) → **Continue with GitHub**.
2. **Add New…** → **Project** → import `bachelorette-voting`.
3. It'll ask for a **Framework Preset** — choose **Other**, and leave the
   build command and output directory empty. There's nothing to build.
4. **Deploy**.
5. **Settings** → **Domains** to rename it to something you'd rather send to
   a group chat — the default URL has the repo name in it.

### Netlify

Same idea: **Add new site** → **Import an existing project** → pick the repo →
leave the build command empty and set the publish directory to `/`. Rename
under **Site configuration** → **Change site name**.

### GitHub Pages

Not used. There was a workflow for it, but Pages can't be enabled by the
workflow token, so every push emailed a failure notice — it's been removed.
If you ever want it back, add a workflow using `actions/deploy-pages` and turn
Pages on by hand at Settings → Pages → Source → GitHub Actions.

---

## 3. Editing the venues

Everything lives in [`venues.js`](venues.js) as a plain list. Add, remove and
reorder freely — the page rebuilds itself from that list.

```js
{
  id: "loow",                     // never change this once people have voted!
  name: "LOOW Stuudio",
  area: "Tatari 64, city centre",
  price: "25 €/h weekends (min 3 h)",
  estMin: 125,                    // 5 h estimate, €
  estMax: 150,                    // a bigger number here shows a range
  quoteOnly: false,               // true = "ask for a quote", hides the numbers
  notes: "Cosy Scandinavian room…",
  travel: "~10 min walk",         // from brunch at Morel, Toom-Kuninga 21
  travelMode: "walk",             // walk | taxi | unknown — picks the icon
  link: "https://loow.ee",
  linkLabel: "Website",
  photos: ["images/loow/1.jpg", "images/loow/2.jpg"]
}
```

Optional extras: `estLabel` replaces "Est. total · 5 h" (LovePaint uses
"All in · 3–3.5 h"), `tag` adds a chip, and `flag` shows a red warning.

Two things worth knowing:

- **`id` is the vote key.** Changing an id detaches every vote already cast for
  that venue. Renaming, re-pricing, re-photographing — all fine. Just leave `id`.
- **Per-person figures are calculated**, not typed: the estimate ÷ 10, since the
  ten of us cover the bride's share. To change the divisor, edit `SPLIT_BETWEEN`
  at the top of `app.js`.

### Adding photos

All eight venues have photos. A venue left on `photos: []` falls back to a
generated placeholder — a coloured panel with its initials — which looks
deliberate rather than broken, so you can add a venue now and photograph it
later.

To add or replace photos:

1. Aim for roughly 1200 px wide and under ~200 KB each;
   [squoosh.app](https://squoosh.app) does the compressing in the browser.
   Oversized files are the main thing that makes this page slow on mobile data.
2. Each venue has its own folder under `images/` — drop the files in the
   matching one, then list them on that venue:

   ```js
   photos: ["images/loow/1.jpg", "images/loow/2.jpg"]
   ```

   [`images/README.md`](images/README.md) maps every folder to its venue and
   website. Added a new venue? `node scripts/make-image-folders.mjs` creates
   its folder and refreshes that index.

3. Commit and push. Any venue still on `photos: []` keeps its placeholder, so
   you can do this a few venues at a time.

Cards show the first photo large; extra ones become a swipe-through gallery
with dots underneath.

**Video works too.** List an `.mp4` and put a `.jpg` of the same name beside it
as the poster frame (`images/lovepaint/1.mp4` + `1.jpg`). Clips play muted and
looping, and only download once scrolled into view. Keep them short and under
~1.5 MB; phones pay for every byte. Use H.264 — it's the codec every phone
decodes.

Autoplay is never guaranteed: Low Power Mode, data saver and stricter browsers
all refuse it. When that happens the poster stays with a play button over it,
so the clip is always one tap away rather than a still that does nothing.

---

## 4. Resetting the votes (and the ideas wall)

Supabase → **Table Editor** → `votes` → select the rows → delete. Or SQL Editor:

```sql
truncate table public.votes;      -- wipes everyone
delete from public.votes where voter_name = 'Kadri';   -- just one person

truncate table public.notes;      -- clears the ideas wall
delete from public.notes where id = 12;                -- remove one note

truncate table public.budgets;    -- clears everyone's pledges
```

Note that the anon key deliberately **cannot delete anything** — that's what
stops a stray tap wiping the results — so tidying up is always done here in the
dashboard, never from the page.

Everyone's page updates within seconds. Their **name** stays remembered in their
own browser (that's `localStorage`, you can't clear it from here) — they'll just
have no picks. Anyone can reset themselves by tapping "Not you?".

In preview mode there's no database: a person clears their own votes with
their browser's "clear site data", or by tapping "Not you?" and using a new name.

---

## 5. Details you might get asked about

- **Compact view.** The toggle by the sort chips strips the cards to name,
  price, votes and the pick button — about 88% shorter — for once you've voted
  and just want to watch the tally. The choice is remembered per browser.
- **Weather.** The hero shows the forecast for the date in `EVENT_DATE`
  (`app.js`), fetched from Open-Meteo in the browser — free, no key. It only
  forecasts ~16 days ahead, so before that it shows what early October in
  Tallinn is normally like, and if the request fails it shows nothing at all
  rather than an error.
- **Voting rule.** Approval voting — up to 3 picks each, most approvals wins.
  It's better than "pick one" for this: it surfaces the option most people are
  happy with rather than the one a third of the group loves and the rest hate.
- **One vote set per name.** Names are normalised (`  liINA ` → `Liina`), so
  capitalisation and stray spaces don't create duplicate voters. Two actual
  Liinas will collide — have one of them add an initial.
- **Changing your mind** is expected: tap a pick to drop it, then pick another.
  There's no submit button, every tap saves immediately.
- **No anti-cheating**, deliberately. Anyone could vote as someone else. It's
  eleven friends deciding where to paint.
- **The pot.** Everyone says anonymously what they can chip in; the page shows
  only the total, the count and the average. A pledge is keyed by a random
  token the browser invents, never by a name, so no row can be traced to a
  person. `anon` has **no access to the `budgets` table at all** — it can only
  call `set_pledge()`, a `security definer` function that validates and writes
  on its behalf, and read `budget_totals`, which returns aggregates only. So
  individual amounts cannot be read back with the public key.

  (Writing directly with an upsert cannot work here: `INSERT … ON CONFLICT DO
  UPDATE` needs SELECT privilege on the conflict column, which is precisely
  the privilege being withheld. Hence the function.)

  Everyone counts at the agreed **€75** until they change it, so the total is
  meaningful from the start and only moves when someone actually deviates.
  Change the figure with `PLEDGE_DEFAULT` at the top of `app.js`.

  `EXTRAS` in `venues.js` lists everything that isn't the room — paint and
  canvases, snacks and soft drinks at the studio, and the bride's brunch —
  and the page subtracts them before judging a venue, so cards show what is
  genuinely left rather than what the room alone costs.

  An extra marked `onlySelfRun: true` is skipped for a venue marked
  `allIn: true` (LovePaint), which already includes the paint and drinks.
  Counting them there would make the hosted option look worse than it is.

  The bride's line covers her brunch, two cocktails there and a bottle each of
  wine and sparkling for the studio. Everyone else's alcohol and meals out are
  not in these figures — they pay their own.

  Returning your pledge to the default deletes your row rather than storing it,
  so "3 of 10 changed theirs" always means three people actually deviated.
- **Ideas wall.** A shared notes box under the results for everything that
  isn't a venue: what to paint, snacks, drinks, timings. Same trust model as
  voting — anyone can post, nobody can delete or edit someone else's note.
  Notes are capped at 280 characters, enforced both in the page and in the
  row level security policy.
- **Privacy.** First names, picks and any notes people write, sitting in your Supabase project.
  Delete the project when you've booked and it's all gone.

---

## Running it locally

No build, no dependencies:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` straight off disk mostly works too, but a local server
matches what the group will actually see.)
