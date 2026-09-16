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
     link:      "https://…",
     linkLabel: "Website",
     confirmParty: true,             // shows the "confirm paint & wine" warning
     photos:    ["images/foo-1.jpg"] // 1–3 images; leave [] for a placeholder
   }

   No photos yet — every venue draws a generated placeholder until you drop
   real images into /images and list them. See README.md.

   Prices checked Sept 2026 — verify before booking.
   Per-person figures are calculated automatically: total ÷ 10.
------------------------------------------------------------------ */

window.VENUES = [
  {
    id: "stuudio323",
    name: "Stuudio323",
    area: "Tallinn — see Instagram for address",
    price: "35 €/h weekends",
    estMin: 175,
    estMax: 175,
    notes: "Fits 8–20 people, so 11 is comfortable. Instagram-only — DM them to book.",
    link: "https://www.instagram.com/stuudio323/",
    linkLabel: "Instagram",
    confirmParty: true,
    photos: []
  },
  {
    id: "jakefarra",
    name: "Jake Farra Studio",
    area: "Kuldnoka 28, Kristiine",
    price: "50 €/h",
    estMin: 250,
    estMax: 250,
    notes: "75 m² for 20–25 people, plus a terrace and garden. Already rents for birthdays and baby showers, so a paint & sip should be an easy yes.",
    link: "https://jakefarra.com/fotostuudio-rent",
    linkLabel: "Website",
    confirmParty: true,
    photos: []
  },
  {
    id: "barefoot",
    name: "Barefoot Studio",
    area: "Pärnu mnt 142",
    price: "35 € 1st h, then 30 €/h",
    estMin: 155,
    estMax: 155,
    notes: "Scandinavian loft with big windows. Small birthdays are OK and there's 2 h of free parking.",
    link: "https://barefootstudio.ee/stuudio",
    linkLabel: "Website",
    confirmParty: true,
    photos: []
  },
  {
    id: "tulbi",
    name: "Tulbi Fotostuudio — Loft hall",
    area: "Pärnu mnt 142",
    price: "40 € 1st h, then 35 €/h",
    estMin: 180,
    estMax: 215,
    notes: "Darker and cosier than the others, suits small groups. Weekends in high season cost more — ask for the Saturday rate.",
    link: "https://tulbifoto.ee",
    linkLabel: "Website",
    confirmParty: true,
    photos: []
  },
  {
    id: "photoroom",
    name: "Photoroom",
    area: "Pärnu mnt 142",
    price: "40–45 €/h per room",
    estMin: 200,
    estMax: 350,
    notes: "Textured walls and wooden floors. Two halls together start at 70 €/h. Was closed Jan–Sept 2026 — confirm they're open again.",
    link: "https://photoroom.ee",
    linkLabel: "Website",
    confirmParty: true,
    photos: []
  },
  {
    id: "fotosioon",
    name: "Fotosioon",
    area: "Laki 16, 4th floor",
    price: "30 €/h, 25 €/h from 3rd h",
    estMin: 135,
    estMax: 135,
    notes: "Cheapest of the studios. A whole day is 175 € if we want to spread out. No lift mentioned — worth checking, it's on the 4th floor.",
    link: "https://fotosioon.com/soovid-stuudiot-rentida",
    linkLabel: "Website",
    confirmParty: true,
    photos: []
  },
  {
    id: "saal",
    name: "Saal Stuudio",
    area: "Kopli, by the sea",
    price: "30 € + VAT 1st h, then 25 € + VAT",
    estMin: 159,
    estMax: 159,
    notes: "Bright and by the sea. More of a pure photo studio than a party room. Full day is 150 € + VAT. Estimate includes VAT.",
    link: "https://saalstuudio.ee",
    linkLabel: "Website",
    confirmParty: true,
    photos: []
  },
  {
    id: "makeupband",
    name: "Makeupband Studio",
    area: "Lembitu 7, city centre",
    price: "25 €/h (min 3 h)",
    estMin: 100,
    estMax: 125,
    notes: "Cheapest option and right in the centre. A whole day is 100 €. Their birthday package is for up to 10 people, so 11 needs confirming.",
    link: "https://makeupband.ee/et/stuudio-rent",
    linkLabel: "Website",
    confirmParty: true,
    photos: []
  },
  {
    id: "tagahoov",
    name: "Tagahoov",
    area: "Tallinn",
    price: "250 € first 3 h, then 60 €/h",
    estMin: 370,
    estMax: 370,
    notes: "An actual event space, not a photo studio — adult parties are what they do, so nothing to talk them into. A whole evening is 480 €.",
    link: "https://tagahoov.com",
    linkLabel: "Website",
    confirmParty: false,
    photos: []
  },
  {
    id: "sihi37a",
    name: "Sihi 37a House",
    area: "Nõmme",
    price: "400 € flat",
    estMin: 400,
    estMax: 400,
    notes: "A whole house, ours until midnight, fits up to 40. The priciest per hour of the 5 h — but the only one where nobody has to leave at 5.",
    link: "https://helinatilk.ee/peoruum",
    linkLabel: "Website",
    confirmParty: false,
    photos: []
  },
  {
    id: "bakbak",
    name: "BakBak Stuudio",
    area: "Marati 5, Põhjala tehas",
    price: "Price on request",
    quoteOnly: true,
    notes: "Eclectic vintage interior, 202 m². Party pricing only on request — someone needs to email them before we can compare.",
    link: "https://bakbak.ee",
    linkLabel: "Website",
    confirmParty: true,
    photos: []
  }
];
