# Where are we painting? 🎨🥂

A one-page venue vote for a self-organised paint & sip bachelorette in Tallinn.
Send the link to the group chat, everyone types their first name and picks their
three favourites, and the tally updates live for everyone.

No accounts, no app, no build step — it's four static files and a folder of images.

```
index.html          the page
styles.css          the looks
app.js              voting logic
venues.js      ←    the only file you edit to change venues
config.js      ←    your Supabase keys go here
images/             venue photos (placeholders for now)
supabase/schema.sql the one-time database setup
scripts/            placeholder-art generator
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
   `votes` table, opens it up for anonymous voting, and switches on live updates.
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

### GitHub Pages (free, already wired up)

`.github/workflows/pages.yml` publishes the site on every push to `main`.

1. Merge this branch into `main`.
2. Repo → **Settings** → **Pages** → under **Build and deployment**, set
   **Source** to **GitHub Actions**.
3. The next push deploys. Your link will be:

   **https://liinaanette.github.io/bachelorette-voting/**

Check the **Actions** tab if you want to watch it build.

### Netlify (if you'd rather)

New site → import this repo → leave the build command empty and set the publish
directory to `/`. Netlify gives you a nicer-looking URL you can rename.

---

## 3. Editing the venues

Everything lives in [`venues.js`](venues.js) as a plain list. Add, remove and
reorder freely — the page rebuilds itself from that list.

```js
{
  id: "barefoot",                 // never change this once people have voted!
  name: "Barefoot Studio",
  area: "Pärnu mnt 142",
  price: "35 € 1st h, then 30 €/h",
  estMin: 155,                    // 5 h estimate, €
  estMax: 155,                    // a bigger number here shows a range
  quoteOnly: false,               // true = "ask for a quote", hides the numbers
  notes: "Scandinavian loft…",
  link: "https://barefootstudio.ee/stuudio",
  linkLabel: "Website",
  confirmParty: true,             // shows the paint-&-wine warning
  photos: ["images/barefoot-1.svg", "images/barefoot-2.svg"]
}
```

Two things worth knowing:

- **`id` is the vote key.** Changing an id detaches every vote already cast for
  that venue. Renaming, re-pricing, re-photographing — all fine. Just leave `id`.
- **Per-person figures are calculated**, not typed: the estimate ÷ 10, since the
  ten of us cover the bride's share. To change the divisor, edit `SPLIT_BETWEEN`
  at the top of `app.js`.

### Real photos

The images in `/images` are generated placeholders — the venue websites weren't
reachable from where this was built, so nothing was scraped. To swap in the real
thing:

1. Save 1–3 photos per venue (from the venue's own site, their Instagram, or
   screenshots). Aim for roughly 1200 px wide and under ~200 KB each —
   [squoosh.app](https://squoosh.app) does this in the browser.
2. Drop them in `/images` and point the venue's `photos` list at them:
   `photos: ["images/barefoot-1.jpg", "images/barefoot-2.jpg"]`
3. Delete the leftover `.svg` placeholders for that venue.

Cards show the first photo large; extra ones become a swipe-through gallery.

If you add a new venue and want a placeholder for it in the meantime:

```sh
node scripts/make-placeholders.mjs
```

It only creates files that don't exist yet, so it can never overwrite a real photo.

---

## 4. Resetting the votes

Supabase → **Table Editor** → `votes` → select the rows → delete. Or SQL Editor:

```sql
truncate table public.votes;      -- wipes everyone
delete from public.votes where voter_name = 'Kadri';   -- just one person
```

Everyone's page updates within seconds. Their **name** stays remembered in their
own browser (that's `localStorage`, you can't clear it from here) — they'll just
have no picks. Anyone can reset themselves by tapping "Not you?".

In preview mode there's no database: a person clears their own votes with
their browser's "clear site data", or by tapping "Not you?" and using a new name.

---

## 5. Details you might get asked about

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
- **Privacy.** First names and picks only, sitting in your Supabase project.
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
