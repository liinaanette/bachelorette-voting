/* ------------------------------------------------------------------
   VENUES — this is the only file you need to edit to change the list.

   Each venue looks like this:

   {
     id:        "short-stable-id",   // NEVER change this once people have voted
     name:      "Venue name",
     area:      "Neighbourhood / street",
     price:     "35 €/h",            // short headline price, shown as a chip
     estMin:    175,                 // estimated total for 5 h, in €
     estMax:    175,                 // same as estMin for a fixed price
     quoteOnly: false,               // true = "ask for a quote", hides the numbers
     notes:     "Capacity, vibe, anything worth knowing.",
     travel:    "12 min walk",       // from brunch at Morel, Toom-Kuninga 21
     travelMode:"walk",              // "walk" | "taxi" | "unknown" — picks the icon
     travelStandalone: false,        // true = already a sentence, skip " from brunch"
     link:      "https://…",
     linkLabel: "Website",
     confirmParty: true,             // shows the "confirm paint & wine" warning
     flag:      "Something is wrong with this one",   // optional red warning
     estLabel:  "All in · 3–3.5 h",  // optional, default is "Est. total · 5 h"
     tag:       "Hosted — no organising",  // optional extra chip
     photos:    ["images/foo/1.jpg"] // stills, or an .mp4 clip (needs a
                                     // matching .jpg poster beside it);
                                     // leave [] for a placeholder
   }

   No photos yet — every venue draws a generated placeholder until you drop
   real images into its own folder under /images and list them here.
   See images/README.md for the folder-to-venue map.

   Travel times are rough estimates from Morel (Toom-Kuninga 21), measured
   by eye rather than routed — check anything borderline in a maps app.

   Prices checked Sept 2026 — verify before booking.
   Per-person figures are calculated automatically: total ÷ 10.
------------------------------------------------------------------ */

window.VENUES = [
  {
    id: "stuudio323",
    name: "Stuudio323",
    area: "Tatari 64, 3rd floor",
    price: "35 €/h weekends",
    estMin: 175,
    estMax: 175,
    notes: "Fits 8–20, so 11 sits comfortably in the middle rather than at the limit. Second cheapest, and one of only two we can walk to from brunch. Instagram-only — no website or online calendar, so someone has to DM them and wait for a reply. It's on the 3rd floor, so worth asking about a lift.",
    travel: "~10 min walk",
    travelMode: "walk",
    link: "https://www.instagram.com/stuudio323/",
    linkLabel: "Instagram",
    photos: [
      "images/stuudio323/1.jpg",
      "images/stuudio323/2.jpg",
      "images/stuudio323/3.jpg",
      "images/stuudio323/4.jpg"
    ]
  },
  {
    id: "loow",
    name: "LOOW Stuudio",
    area: "Tatari 64, city centre",
    price: "25 €/h weekends (min 3 h)",
    estMin: 125,
    estMax: 150,
    notes: "Cosy Scandinavian room with high ceilings, up to 25. Birthdays are a listed use and a past client has actually run a sip & paint here — the only venue where someone has already done exactly our evening. Full kitchen, 65\" TV, door-code access 08:00–24:00, so no waiting on a keyholder. Day rate is 150 €, barely more than five hours, so ask for it. Budget a further 40 € unless we tidy up ourselves.",
    travel: "~10 min walk",
    travelMode: "walk",
    link: "https://loow.ee",
    linkLabel: "Website",
    photos: [
      "images/loow/1.jpg",
      "images/loow/2.jpg",
      "images/loow/3.jpg"
    ]
  },
  {
    id: "jakefarra",
    name: "Jake Farra Studio",
    area: "Kuldnoka 28, Kristiine",
    price: "50 €/h",
    estMin: 250,
    estMax: 250,
    notes: "The most expensive per hour, and the most space for it: 75 m² for 20–25 people, so 11 with easels and a table of snacks is genuinely roomy. Has a terrace and garden, which no other option on this list does — worth a lot if the weather holds. Already rents for birthdays and baby showers, so we wouldn't be talking anyone into anything.",
    travel: "~8 min taxi",
    travelMode: "taxi",
    link: "https://jakefarra.com/fotostuudio-rent",
    linkLabel: "Website",
    photos: [
      "images/jakefarra/1.jpg",
      "images/jakefarra/2.jpg",
      "images/jakefarra/3.jpg",
      "images/jakefarra/4.jpg"
    ]
  },
  {
    id: "makeupband",
    name: "Makeupband Studio",
    area: "Lembitu 7, city centre",
    price: "25 €/h (min 3 h)",
    estMin: 100,
    estMax: 125,
    notes: "Cheapest on the list and the closest to brunch — an eight-minute walk, no taxis or coordinating cars. A whole day is 100 €, which is less than five hours at the hourly rate, so ask for the day price. One catch worth settling first: their birthday package is written for up to 10 people and we are 11.",
    travel: "~8 min walk",
    travelMode: "walk",
    link: "https://makeupband.ee/et/stuudio-rent",
    linkLabel: "Website",
    photos: [
      "images/makeupband/1.jpg",
      "images/makeupband/2.jpg",
      "images/makeupband/3.jpg",
      "images/makeupband/4.jpg"
    ]
  },
  {
    id: "shizen",
    name: "Shizen Stuudio",
    area: "Laki 4",
    price: "Price on request",
    quoteOnly: true,
    notes: "Bright room that seats all 20 at one table, which no other option here does — everyone painting together rather than split across two rooms. Kitchen corner with glasses and plates, own food and drinks welcome, decorating allowed, free parking. Price only on request from grete@shizen.ee. They also run their own texture-painting-and-wine workshop from 44 €/person if we'd rather not organise the painting ourselves.",
    travel: "~10 min taxi",
    travelMode: "taxi",
    link: "mailto:grete@shizen.ee",
    linkLabel: "Email for a quote",
    photos: [
      "images/shizen/1.jpg",
      "images/shizen/2.jpg",
      "images/shizen/3.jpg",
      "images/shizen/4.jpg",
      "images/shizen/5.jpg",
      "images/shizen/6.jpg"
    ]
  },
  {
    id: "sihi37a",
    name: "Sihi 37a House",
    area: "Nõmme",
    price: "400 € flat",
    estMin: 400,
    estMax: 400,
    notes: "The only one that isn't rented by the hour: a whole house, ours until midnight, fits up to 40. So it's the priciest for five hours and the cheapest if the day turns into an evening — and the only option where nobody has to pack up and leave at 5. Nõmme is leafy and quiet, but it's the furthest out, so everyone needs a plan for getting home.",
    travel: "~15 min taxi",
    travelMode: "taxi",
    link: "https://helinatilk.ee/peoruum",
    linkLabel: "Website",
    photos: [
      "images/sihi37a/1.jpg",
      "images/sihi37a/2.jpg"
    ]
  },
  {
    id: "bakbak",
    name: "BakBak Stuudio",
    area: "Marati 5, Põhjala tehas",
    price: "Price on request",
    quoteOnly: true,
    notes: "Eclectic vintage interior and easily the most interesting-looking space here, 202 m² in the old Põhjala factory. The problem is we can't compare it: party pricing is quote-only, so someone has to email them before this is a real option rather than a maybe. Worth doing early if the look appeals.",
    travel: "~12 min taxi",
    travelMode: "taxi",
    link: "https://bakbak.ee",
    linkLabel: "Website",
    photos: [
      "images/bakbak/1.jpg",
      "images/bakbak/2.jpg",
      "images/bakbak/3.jpg",
      "images/bakbak/4.jpg"
    ]
  },
  {
    id: "lovepaint",
    name: "LovePaint",
    area: "Tatari 64, 2nd floor — same building as LOOW",
    price: "560 € for 11, all in",
    estMin: 560,
    estMax: 560,
    estLabel: "All in · 3–3.5 h",
    tag: "Hosted — no organising",
    notes: "Not a room we rent: a hosted art party with an artist guiding everyone. The 560 € covers the artist, all materials and the drinks — a bottle of wine per two people, plus alcohol-free fizz — so it isn't really comparable to a bare room, where paint, canvases and wine are all still to buy. Shorter at 3–3.5 h, and still much the priciest, but nobody plans, shops or cleans up. Snacks 30 € extra. There's also a bachelorette package from 490 € for 8, with decorations, a photo zone, a Bride Team programme and 10 Polaroids. Minimum 8 on Fri/Sat, so 11 is fine.",
    travel: "~10 min walk",
    travelMode: "walk",
    link: "https://lovepaint.eu/et/tudrukuteohtud-ja-sunnipaevad",
    linkLabel: "Website",
    photos: [
      "images/lovepaint/1.mp4"
    ]
  }
];
