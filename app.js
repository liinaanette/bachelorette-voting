/* ------------------------------------------------------------------
   Paint & sip venue voting.

   Approval voting: everyone picks up to three venues, highest tally wins.
   One vote set per first name — trust-based, no accounts, no anti-cheating
   beyond "don't be weird".

   Two modes, chosen automatically:
     cloud  — Supabase is configured, votes are shared and live.
     local  — it isn't, votes live in this browser only (preview mode).
------------------------------------------------------------------ */

(function () {
  "use strict";

  var MAX_PICKS = 3;
  var SPLIT_BETWEEN = 10; // we cover the bride's share between the 10 of us
  var KEY_NAME = "bv.voterName";
  var KEY_LOCAL_VOTES = "bv.localVotes";
  var POLL_MS = 20000;

  var VENUES = window.VENUES || [];
  var cfg = window.SUPABASE_CONFIG || {};

  // Cloud mode needs both the config and the Supabase library — if the CDN
  // is blocked (some office wifi does this), fall back rather than blow up.
  var configured = !!(cfg.url && cfg.anonKey);
  var libLoaded = !!(window.supabase && window.supabase.createClient);

  var state = {
    name: null,
    votes: new Map(), // voter name -> array of venue ids
    sort: "default",
    notes: [],
    mode: configured && libLoaded ? "cloud" : "local",
    error: configured && !libLoaded
      ? "Couldn't load the voting library, so your picks are only saved on this phone for now. Try again on a different connection."
      : null
  };

  var MAX_NOTE = 280;
  var supa = null;
  var cards = new Map();
  var openRows = new Set();
  var savesInFlight = 0;

  var el = {
    namePanel: document.getElementById("namePanel"),
    nameForm: document.getElementById("nameForm"),
    nameInput: document.getElementById("nameInput"),
    nameError: document.getElementById("nameError"),
    whoami: document.getElementById("whoami"),
    whoamiName: document.getElementById("whoamiName"),
    changeName: document.getElementById("changeName"),
    status: document.getElementById("status"),
    venues: document.getElementById("venues"),
    tally: document.getElementById("tally"),
    results: document.getElementById("results"),
    resultsNote: document.getElementById("resultsNote"),
    modeNote: document.getElementById("modeNote"),
    dock: document.getElementById("dock"),
    dockCount: document.getElementById("dockCount"),
    dockJump: document.getElementById("dockJump"),
    noteForm: document.getElementById("noteForm"),
    noteInput: document.getElementById("noteInput"),
    noteCount: document.getElementById("noteCount"),
    noteSubmit: document.getElementById("noteSubmit"),
    noteLocked: document.getElementById("noteLocked"),
    noteError: document.getElementById("noteError"),
    notes: document.getElementById("notes"),
    tpl: document.getElementById("venueCard")
  };

  /* ---------- storage helpers (private browsing can throw) ---------- */

  function lsGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function lsSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* no-op */ }
  }

  /* ---------- names ---------- */

  // "  liina  " and "LIINA" should be the same person, so names are
  // normalised to one canonical spelling before they become the key.
  function normalizeName(raw) {
    var name = String(raw || "").replace(/\s+/g, " ").trim().toLowerCase();
    return name.replace(/(^|[\s'-])(\p{L})/gu, function (_, sep, ch) {
      return sep + ch.toUpperCase();
    });
  }

  /* ---------- money ---------- */

  function euro(n) {
    return "€" + (Math.round(n * 100) / 100).toLocaleString("en-GB", {
      minimumFractionDigits: n % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    });
  }

  function totalText(v) {
    if (v.quoteOnly) return "Ask for a quote";
    if (v.estMax && v.estMax !== v.estMin) return euro(v.estMin) + "–" + euro(v.estMax);
    return euro(v.estMin);
  }

  function perPersonText(v) {
    if (v.quoteOnly) return "—";
    var lo = v.estMin / SPLIT_BETWEEN;
    var hi = (v.estMax || v.estMin) / SPLIT_BETWEEN;
    return lo === hi ? euro(lo) : euro(lo) + "–" + euro(hi);
  }

  /* ---------- tally ---------- */

  function tallyFor(venueId) {
    var voters = [];
    state.votes.forEach(function (ids, voter) {
      if (ids.indexOf(venueId) !== -1) voters.push(voter);
    });
    voters.sort(function (a, b) { return a.localeCompare(b); });
    return voters;
  }

  // A venue removed from venues.js after people voted would otherwise still
  // occupy a slot: the stored array says 3 picks while only 2 cards show one,
  // and the voter can't choose a replacement. Drop unknown ids on the way in.
  var KNOWN_IDS = {};
  VENUES.forEach(function (v) { KNOWN_IDS[v.id] = true; });

  function cleanPicks(ids) {
    if (!Array.isArray(ids)) return [];
    return ids.filter(function (id) { return KNOWN_IDS[id]; }).slice(0, MAX_PICKS);
  }

  function myPicks() {
    return state.name ? (state.votes.get(state.name) || []) : [];
  }

  /* ---------- placeholder art ---------- */

  // Until real photos land, each venue gets its own bit of abstract colour
  // rather than a grey "no image" box. The palette is picked from the venue
  // id, so it's stable and neighbouring cards don't match.
  var PALETTES = [
    ["#f7d9e3", "#e3a8c2", "#7d3f5e"],
    ["#fae3d4", "#eeb99f", "#98513f"],
    ["#e8dcf4", "#c4abe2", "#584482"],
    ["#dceae6", "#a9cec1", "#37695b"],
    ["#fdeccd", "#f0cc8d", "#8b632c"],
    ["#dde6f2", "#aec4e4", "#3a5480"]
  ];

  function hashCode(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }

  function monogram(name) {
    var words = String(name).replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter(Boolean);
    if (!words.length) return "?";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  var TRAVEL_ICONS = { walk: "\uD83D\uDEB6", taxi: "\uD83D\uDE95", unknown: "\u2753" };

  function placeholder(venue) {
    var pal = PALETTES[hashCode(venue.id) % PALETTES.length];
    var box = document.createElement("div");
    box.className = "placeholder";
    box.style.setProperty("--ph-from", pal[0]);
    box.style.setProperty("--ph-to", pal[1]);
    box.style.setProperty("--ph-ink", pal[2]);
    // the blobs are decorative, so nudge them per venue too
    box.style.setProperty("--ph-x", (hashCode(venue.id + "x") % 50 + 20) + "%");
    box.style.setProperty("--ph-y", (hashCode(venue.id + "y") % 50 + 20) + "%");

    var mono = document.createElement("span");
    mono.className = "placeholder__mono";
    mono.textContent = monogram(venue.name);

    var cap = document.createElement("span");
    cap.className = "placeholder__cap";
    cap.textContent = "Photo coming soon";

    box.appendChild(mono);
    box.appendChild(cap);
    return box;
  }

  function imageSlide(src, venue, i) {
    var img = document.createElement("img");
    img.className = "photo";
    img.src = src;
    img.alt = venue.name + " — photo " + (i + 1);
    img.loading = i === 0 ? "eager" : "lazy";
    img.decoding = "async";
    return img;
  }

  // A clip behaves like a photo in the strip: muted, looping, no chrome.
  // It only downloads once scrolled into view, so nobody streams it by
  // scrolling past. Autoplay is a best effort — Low Power Mode, data saver
  // and stricter browsers all refuse it — so there is always a tap target
  // and a visible play button rather than a poster that does nothing.
  function videoSlide(src, venue) {
    var wrap = document.createElement("div");
    wrap.className = "videoslide";

    var vid = document.createElement("video");
    vid.className = "photo photo--video";
    vid.muted = true;
    vid.setAttribute("muted", "");            // iOS wants the attribute, not just the property
    vid.loop = true;
    vid.setAttribute("loop", "");
    vid.playsInline = true;
    vid.setAttribute("playsinline", "");
    vid.setAttribute("webkit-playsinline", "");
    vid.preload = "none";
    vid.poster = src.replace(/\.mp4$/i, ".jpg");
    vid.setAttribute("aria-label", venue.name + " — short clip");

    var badge = document.createElement("button");
    badge.className = "videoslide__play";
    badge.type = "button";
    badge.setAttribute("aria-label", "Play clip");
    badge.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

    wrap.appendChild(vid);
    wrap.appendChild(badge);

    var loaded = false;
    function ensureLoaded() {
      if (loaded) return;
      vid.src = src;
      vid.load();          // preload="none" means it has nothing until we ask
      loaded = true;
    }
    function attempt() {
      ensureLoaded();
      var p = vid.play();
      if (p && p.catch) p.catch(function () { /* refused — the badge stays */ });
    }

    vid.addEventListener("playing", function () { wrap.classList.add("is-playing"); });
    vid.addEventListener("pause", function () { wrap.classList.remove("is-playing"); });

    badge.addEventListener("click", function (e) {
      e.preventDefault();
      attempt();            // a real tap, so this is allowed everywhere
    });

    if (!("IntersectionObserver" in window)) return wrap;

    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) attempt();
        else if (loaded) vid.pause();
      });
    }, { threshold: 0.4 }).observe(vid);

    return wrap;
  }

  function addDots(card, strip, count) {
    var wrap = document.createElement("div");
    wrap.className = "dots";
    wrap.setAttribute("aria-hidden", "true"); // decorative; the images carry the alt text
    var dots = [];
    for (var i = 0; i < count; i++) {
      var d = document.createElement("span");
      d.className = "dots__dot" + (i === 0 ? " is-on" : "");
      dots.push(d);
      wrap.appendChild(d);
    }
    card.querySelector(".card__photos").appendChild(wrap);

    var ticking = false;
    strip.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var at = Math.round(strip.scrollLeft / strip.clientWidth);
        dots.forEach(function (d, i) { d.classList.toggle("is-on", i === at); });
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- rendering ---------- */

  function buildCards() {
    var frag = document.createDocumentFragment();

    VENUES.forEach(function (v) {
      var node = el.tpl.content.firstElementChild.cloneNode(true);
      node.dataset.venue = v.id;

      var photos = node.querySelector("[data-photos]");
      if ((v.photos || []).length) {
        v.photos.forEach(function (src, i) {
          photos.appendChild(/\.mp4$/i.test(src)
            ? videoSlide(src, v)
            : imageSlide(src, v, i));
        });
        // nothing else signals that the strip scrolls, so show dots
        if (v.photos.length > 1) addDots(node, photos, v.photos.length);
      } else {
        photos.appendChild(placeholder(v));
      }

      node.querySelector("[data-name]").textContent = v.name;
      node.querySelector("[data-area]").textContent = v.area || "";
      node.querySelector("[data-price]").textContent = v.price || "";
      if (v.estLabel) node.querySelector("[data-estlabel]").textContent = v.estLabel;
      if (v.tag) {
        var tag = node.querySelector("[data-tag]");
        tag.hidden = false;
        tag.textContent = v.tag;
      }
      node.querySelector("[data-total]").textContent = totalText(v);
      node.querySelector("[data-perperson]").textContent = perPersonText(v);
      node.querySelector("[data-notes]").textContent = v.notes || "";

      if (v.travel) {
        var travel = node.querySelector("[data-travel]");
        travel.hidden = false;
        travel.classList.add("is-" + (v.travelMode || "unknown"));
        node.querySelector("[data-travel-icon]").textContent = TRAVEL_ICONS[v.travelMode] || TRAVEL_ICONS.unknown;
        // Most read as "~8 min walk from brunch", but a couple are already
        // whole sentences and opt out of the suffix.
        node.querySelector("[data-travel-text]").textContent =
          v.travelStandalone ? v.travel : v.travel + " from brunch";
      }

      if (v.flag) {
        var flag = node.querySelector("[data-flag]");
        flag.hidden = false;
        flag.textContent = "🚩 " + v.flag;
      }

      if (v.confirmParty) node.querySelector("[data-warn]").hidden = false;

      var link = node.querySelector("[data-link]");
      if (v.link) {
        link.href = v.link;
        link.textContent = (v.linkLabel || "Website") + " ↗";
      } else {
        link.remove();
      }

      var voteBtn = node.querySelector("[data-vote]");
      voteBtn.addEventListener("click", function () { toggleVote(v.id); });

      cards.set(v.id, {
        root: node,
        voteBtn: voteBtn,
        count: node.querySelector("[data-votecount]"),
        voters: node.querySelector("[data-voters]")
      });
      frag.appendChild(node);
    });

    el.venues.appendChild(frag);
  }

  function sortedVenues() {
    var list = VENUES.slice();
    var order = new Map(VENUES.map(function (v, i) { return [v.id, i]; }));

    if (state.sort === "price") {
      list.sort(function (a, b) {
        // "ask for a quote" can't be compared, so it sits at the bottom
        if (a.quoteOnly !== b.quoteOnly) return a.quoteOnly ? 1 : -1;
        if (a.quoteOnly) return order.get(a.id) - order.get(b.id);
        return a.estMin - b.estMin || order.get(a.id) - order.get(b.id);
      });
    } else if (state.sort === "votes") {
      list.sort(function (a, b) {
        return tallyFor(b.id).length - tallyFor(a.id).length ||
               order.get(a.id) - order.get(b.id);
      });
    }
    return list;
  }

  function renderCards() {
    var picks = myPicks();
    var full = picks.length >= MAX_PICKS;
    var locked = !state.name;

    var order = sortedVenues();

    // Re-appending a node detaches it, which scrolls its photo strip back to
    // the first image and drops focus — so only touch the DOM if the order
    // genuinely changed, not on every background refresh.
    var current = el.venues.children;
    var moved = order.some(function (v, i) {
      return !current[i] || current[i].dataset.venue !== v.id;
    });
    if (moved) {
      order.forEach(function (v) { el.venues.appendChild(cards.get(v.id).root); });
    }

    order.forEach(function (v) {
      var card = cards.get(v.id);
      var voters = tallyFor(v.id);
      var picked = picks.indexOf(v.id) !== -1;

      card.count.textContent = voters.length === 1 ? "1 vote" : voters.length + " votes";
      card.count.hidden = voters.length === 0;

      if (voters.length) {
        card.voters.hidden = false;
        card.voters.textContent = "Picked by " + voters.join(", ");
      } else {
        card.voters.hidden = true;
      }

      card.root.classList.toggle("is-picked", picked);
      card.voteBtn.classList.toggle("is-on", picked);
      card.voteBtn.setAttribute("aria-pressed", picked ? "true" : "false");
      card.voteBtn.disabled = locked || (full && !picked);
      card.voteBtn.textContent = picked ? "✓ Picked" : (full ? "Un-pick one first" : "Pick this");
    });
  }

  function renderTally() {
    var rows = VENUES.map(function (v) {
      return { venue: v, voters: tallyFor(v.id) };
    }).sort(function (a, b) {
      return b.voters.length - a.voters.length || a.venue.name.localeCompare(b.venue.name);
    });

    var most = rows.length ? rows[0].voters.length : 0;
    el.tally.textContent = "";

    if (!state.votes.size) {
      var empty = document.createElement("li");
      empty.className = "tally__empty";
      empty.textContent = "No votes yet. Be the first.";
      el.tally.appendChild(empty);
      el.resultsNote.textContent = "";
      return;
    }

    el.resultsNote.textContent = state.votes.size === 1
      ? "1 person has voted. Tap a row to see who picked what."
      : state.votes.size + " people have voted. Tap a row to see who picked what.";

    rows.forEach(function (row) {
      var li = document.createElement("li");
      li.className = "tally__row";
      if (row.voters.length && row.voters.length === most) li.classList.add("is-leader");

      var btn = document.createElement("button");
      btn.className = "tally__btn";
      btn.type = "button";
      btn.setAttribute("aria-expanded", openRows.has(row.venue.id) ? "true" : "false");
      // desktop gets the names on hover, phones get them on tap
      btn.title = row.voters.length ? row.voters.join(", ") : "No votes yet";

      var name = document.createElement("span");
      name.className = "tally__name";
      name.textContent = row.venue.name;

      var bar = document.createElement("span");
      bar.className = "tally__bar";
      var fill = document.createElement("span");
      fill.className = "tally__fill";
      fill.style.width = (most ? (row.voters.length / most) * 100 : 0) + "%";
      bar.appendChild(fill);

      var num = document.createElement("span");
      num.className = "tally__num";
      num.textContent = String(row.voters.length);

      btn.appendChild(name);
      btn.appendChild(bar);
      btn.appendChild(num);
      btn.addEventListener("click", function () {
        if (openRows.has(row.venue.id)) openRows.delete(row.venue.id);
        else openRows.add(row.venue.id);
        renderTally();
      });

      li.appendChild(btn);

      if (openRows.has(row.venue.id)) {
        var who = document.createElement("p");
        who.className = "tally__who";
        who.textContent = row.voters.length ? row.voters.join(" · ") : "Nobody yet.";
        li.appendChild(who);
      }

      el.tally.appendChild(li);
    });
  }

  function renderChrome() {
    var named = !!state.name;
    el.namePanel.hidden = named;
    el.whoami.hidden = !named;
    el.dock.hidden = !named;
    if (named) {
      el.whoamiName.textContent = state.name;
      var n = myPicks().length;
      el.dockCount.textContent = n + " of " + MAX_PICKS + " picked" +
        (n === MAX_PICKS ? " ✓" : "");
      el.dock.classList.toggle("is-full", n === MAX_PICKS);
    }

    if (state.error) {
      el.status.hidden = false;
      el.status.className = "status status--warn";
      el.status.textContent = state.error;
    } else if (state.mode === "local") {
      el.status.hidden = false;
      el.status.className = "status status--info";
      el.status.textContent = "Preview mode: votes are saved in this browser only, so nobody else can see them yet. Add the Supabase keys in config.js to make it live.";
    } else {
      el.status.hidden = true;
    }

    el.modeNote.textContent = state.mode === "cloud"
      ? "Votes are shared live with everyone who opens this link."
      : "Preview mode — votes stay on this device.";
  }

  function render() {
    renderChrome();
    renderCards();
    renderTally();
    renderNotes();
  }

  /* ---------- voting ---------- */

  function toggleVote(venueId) {
    if (!state.name) return;
    var picks = myPicks().slice();
    var at = picks.indexOf(venueId);

    if (at !== -1) picks.splice(at, 1);
    else if (picks.length >= MAX_PICKS) return;
    else picks.push(venueId);

    state.votes.set(state.name, picks);
    render();
    save(state.name, picks);
  }

  function save(name, picks) {
    if (state.mode !== "cloud") {
      var all = {};
      state.votes.forEach(function (ids, voter) { all[voter] = ids; });
      lsSet(KEY_LOCAL_VOTES, JSON.stringify(all));
      return;
    }

    savesInFlight++;
    supa.from("votes")
      .upsert({ voter_name: name, venue_ids: picks, updated_at: new Date().toISOString() },
              { onConflict: "voter_name" })
      .then(function (res) {
        if (res.error) throw res.error;
        if (state.error) { state.error = null; renderChrome(); }
      })
      .catch(function (err) {
        console.error("save failed", err);
        state.error = "Couldn't save your picks just now — check your connection. They're still on screen, so try tapping again in a moment.";
        renderChrome();
      })
      .then(function () { savesInFlight--; });
  }

  /* ---------- loading ---------- */

  function loadLocal() {
    var raw = lsGet(KEY_LOCAL_VOTES);
    if (!raw) return;
    try {
      var all = JSON.parse(raw);
      Object.keys(all).forEach(function (voter) {
        if (Array.isArray(all[voter])) state.votes.set(voter, cleanPicks(all[voter]));
      });
    } catch (e) { /* corrupt, ignore */ }
  }

  function loadCloud() {
    return supa.from("votes").select("voter_name, venue_ids")
      .then(function (res) {
        if (res.error) throw res.error;
        var next = new Map();
        (res.data || []).forEach(function (row) {
          next.set(row.voter_name, cleanPicks(row.venue_ids));
        });
        // A refresh that lands while our own save is still in flight would
        // otherwise show us the pre-save row and make the tap look undone.
        if (state.name && (savesInFlight > 0 || !next.has(state.name))) {
          next.set(state.name, state.votes.get(state.name) || []);
        }
        state.votes = next;
        state.error = null;
        render();
      })
      .catch(function (err) {
        console.error("load failed", err);
        state.error = "Can't reach the vote list right now. Your own picks still work — it should catch up on its own.";
        renderChrome();
      });
  }

  /* ---------- ideas wall ---------- */

  var KEY_LOCAL_NOTES = "bv.localNotes";

  function timeAgo(iso) {
    var then = new Date(iso).getTime();
    if (!then) return "";
    var mins = Math.floor((Date.now() - then) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + " min ago";
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + " h ago";
    var days = Math.floor(hrs / 24);
    return days === 1 ? "yesterday" : days + " days ago";
  }

  function renderNotes() {
    var named = !!state.name;
    el.noteInput.disabled = !named;
    el.noteSubmit.disabled = !named;
    el.noteLocked.hidden = named;

    el.notes.textContent = "";
    if (!state.notes.length) {
      var empty = document.createElement("li");
      empty.className = "notes__empty";
      empty.textContent = "Nothing yet — first idea goes here.";
      el.notes.appendChild(empty);
      return;
    }

    state.notes.forEach(function (n) {
      var li = document.createElement("li");
      li.className = "note";

      var head = document.createElement("div");
      head.className = "note__head";

      var who = document.createElement("span");
      who.className = "note__who";
      who.textContent = n.author;

      var when = document.createElement("span");
      when.className = "note__when";
      when.textContent = timeAgo(n.created_at);

      var body = document.createElement("p");
      body.className = "note__body";
      body.textContent = n.body;   // textContent, never innerHTML

      head.appendChild(who);
      head.appendChild(when);
      li.appendChild(head);
      li.appendChild(body);
      el.notes.appendChild(li);
    });
  }

  function updateNoteCount() {
    var left = MAX_NOTE - el.noteInput.value.length;
    el.noteCount.textContent = left + " left";
    el.noteCount.classList.toggle("is-low", left <= 30);
  }

  // The generic "check your connection" hid the actual cause, which matters
  // when the thing that is wrong is the database rather than the phone.
  function describeError(err) {
    if (!err) return "Unknown error.";
    var code = err.code || "";
    var msg = err.message || String(err);
    if (code === "PGRST205" || /schema cache/i.test(msg)) {
      return "The API hasn't noticed the notes table yet. In Supabase run: notify pgrst, 'reload schema';";
    }
    if (code === "42P01" || /does not exist/i.test(msg)) {
      return "The notes table is missing — supabase/schema.sql hasn't been run yet.";
    }
    if (code === "42501" || /row-level security|permission denied/i.test(msg)) {
      return "The database refused it (permissions). Re-run supabase/schema.sql.";
    }
    if (/failed to fetch|networkerror|load failed/i.test(msg)) {
      return "Couldn't reach the server — check your connection.";
    }
    return msg + (code ? " (" + code + ")" : "");
  }

  function saveLocalNotes() {
    lsSet(KEY_LOCAL_NOTES, JSON.stringify(state.notes));
  }

  function addNote(body) {
    var note = { author: state.name, body: body, created_at: new Date().toISOString() };
    state.notes.unshift(note);   // optimistic: show it straight away
    renderNotes();

    if (state.mode !== "cloud") { saveLocalNotes(); return; }

    supa.from("notes").insert({ author: note.author, body: note.body })
      .then(function (res) {
        if (res.error) throw res.error;
        loadNotes();
      })
      .catch(function (err) {
        console.error("note failed", err);
        // take the optimistic note back rather than pretending it saved
        var at = state.notes.indexOf(note);
        if (at !== -1) state.notes.splice(at, 1);
        renderNotes();
        el.noteError.hidden = false;
        el.noteError.textContent = "Couldn't save that. " + describeError(err);
        el.noteInput.value = note.body;
        updateNoteCount();
      });
  }

  function loadNotes() {
    if (state.mode !== "cloud") {
      var raw = lsGet(KEY_LOCAL_NOTES);
      if (raw) { try { state.notes = JSON.parse(raw) || []; } catch (e) { state.notes = []; } }
      renderNotes();
      return;
    }
    return supa.from("notes").select("author, body, created_at")
      .order("created_at", { ascending: false }).limit(100)
      .then(function (res) {
        if (res.error) throw res.error;
        state.notes = res.data || [];
        renderNotes();
      })
      .catch(function (err) { console.error("notes load failed", err); });
  }

  el.noteInput.addEventListener("input", updateNoteCount);

  el.noteForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!state.name) return;
    var body = el.noteInput.value.trim();
    if (!body) return;
    el.noteError.hidden = true;
    el.noteInput.value = "";
    updateNoteCount();
    addNote(body);
  });

  /* ---------- wiring ---------- */

  el.nameForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = normalizeName(el.nameInput.value);
    if (name.length < 2) {
      el.nameError.hidden = false;
      el.nameError.textContent = "That's a bit short — give us at least two letters.";
      return;
    }
    el.nameError.hidden = true;
    state.name = name;
    lsSet(KEY_NAME, name);
    if (!state.votes.has(name)) state.votes.set(name, []);
    render();
    el.venues.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  el.changeName.addEventListener("click", function () {
    state.name = null;
    lsSet(KEY_NAME, "");
    render();
    el.nameInput.value = "";
    el.namePanel.scrollIntoView({ behavior: "smooth", block: "center" });
    el.nameInput.focus();
  });

  el.dockJump.addEventListener("click", function () {
    el.results.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-sort]"), function (btn) {
    btn.addEventListener("click", function () {
      state.sort = btn.dataset.sort;
      Array.prototype.forEach.call(document.querySelectorAll("[data-sort]"), function (other) {
        other.classList.toggle("is-on", other === btn);
      });
      renderCards();
    });
  });

  /* ---------- boot ---------- */

  var saved = normalizeName(lsGet(KEY_NAME));
  if (saved.length >= 2) state.name = saved;

  buildCards();

  if (state.mode === "cloud") {
    supa = window.supabase.createClient(cfg.url, cfg.anonKey);
    if (state.name) state.votes.set(state.name, []);
    render();

    loadCloud();
    loadNotes();

    // Live updates. Realtime has to be switched on for both tables (see
    // README); the poll below covers us if it isn't, or if the socket drops.
    var pendingVotes = null, pendingNotes = null;
    function votesSoon() {
      clearTimeout(pendingVotes);
      pendingVotes = setTimeout(loadCloud, 250);
    }
    function notesSoon() {
      clearTimeout(pendingNotes);
      pendingNotes = setTimeout(loadNotes, 250);
    }
    supa.channel("board-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, votesSoon)
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, notesSoon)
      .subscribe();

    function refreshAll() {
      if (document.hidden) return;
      loadCloud();
      loadNotes();
    }
    setInterval(refreshAll, POLL_MS);
    document.addEventListener("visibilitychange", refreshAll);

    // "5 min ago" goes stale just sitting there
    setInterval(function () { if (!document.hidden && state.notes.length) renderNotes(); }, 60000);
  } else {
    loadLocal();
    if (state.name && !state.votes.has(state.name)) state.votes.set(state.name, []);
    render();
    loadNotes();
  }

  updateNoteCount();

  if (!state.name) el.nameInput.focus({ preventScroll: true });
})();
