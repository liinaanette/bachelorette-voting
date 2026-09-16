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
    mode: configured && libLoaded ? "cloud" : "local",
    error: configured && !libLoaded
      ? "Couldn't load the voting library, so your picks are only saved on this phone for now. Try again on a different connection."
      : null
  };

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

  /* ---------- rendering ---------- */

  function buildCards() {
    var frag = document.createDocumentFragment();

    VENUES.forEach(function (v) {
      var node = el.tpl.content.firstElementChild.cloneNode(true);
      node.dataset.venue = v.id;

      var photos = node.querySelector("[data-photos]");
      if ((v.photos || []).length) {
        v.photos.forEach(function (src, i) {
          var img = document.createElement("img");
          img.className = "photo";
          img.src = src;
          img.alt = v.name + " — photo " + (i + 1);
          img.loading = i === 0 ? "eager" : "lazy";
          img.decoding = "async";
          photos.appendChild(img);
        });
      } else {
        photos.appendChild(placeholder(v));
      }

      node.querySelector("[data-name]").textContent = v.name;
      node.querySelector("[data-area]").textContent = v.area || "";
      node.querySelector("[data-price]").textContent = v.price || "";
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
        if (Array.isArray(all[voter])) state.votes.set(voter, all[voter]);
      });
    } catch (e) { /* corrupt, ignore */ }
  }

  function loadCloud() {
    return supa.from("votes").select("voter_name, venue_ids")
      .then(function (res) {
        if (res.error) throw res.error;
        var next = new Map();
        (res.data || []).forEach(function (row) {
          next.set(row.voter_name, Array.isArray(row.venue_ids) ? row.venue_ids : []);
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

    // Live updates. Realtime has to be switched on for the table (see
    // README); the poll below covers us if it isn't, or if the socket drops.
    var pending = null;
    function refreshSoon() {
      clearTimeout(pending);
      pending = setTimeout(loadCloud, 250);
    }
    supa.channel("votes-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, refreshSoon)
      .subscribe();

    setInterval(function () {
      if (!document.hidden) loadCloud();
    }, POLL_MS);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) loadCloud();
    });
  } else {
    loadLocal();
    if (state.name && !state.votes.has(state.name)) state.votes.set(state.name, []);
    render();
  }

  if (!state.name) el.nameInput.focus({ preventScroll: true });
})();
