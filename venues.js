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
     photos:    ["images/foo-1.jpg"] // 1–3 images; leave [] for a placeholder
   }

   No photos yet — every venue draws a generated placeholder until you drop
   real images into /images and list them. See README.md.

   Travel times are rough estimates from Morel (Toom-Kuninga 21), measured
   by eye rather than routed — check anything borderline in a maps app.

   Prices checked Sept 2026 — verify before booking.
   Per-person figures are calculated automatically: total ÷ 10.
------------------------------------------------------------------ */

window.VENUES = [
  {
    id: "stuudio323",
    name: "Stuudio323",
    area: "Address not published — ask them",
    price: "35 €/h weekends",
    estMin: 175,
    estMax: 175,
    notes: "Fits 8–20, so 11 sits comfortably in the middle rather than at the limit. Instagram-only: no website, no public address, no online calendar — someone has to DM them and wait for a reply, so start this one early if it interests you.",
    travel: "Unknown — no public address",
    travelMode: "unknown",
    travelStandalone: true,
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
    notes: "The most expensive per hour, and the most space for it: 75 m² for 20–25 people, so 11 with easels and a table of snacks is genuinely roomy. Has a terrace and garden, which no other option on this list does — worth a lot if the weather holds. Already rents for birthdays and baby showers, so we wouldn't be talking anyone into anything.",
    travel: "~8 min taxi",
    travelMode: "taxi",
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
    notes: "Scandinavian loft with big windows — the best natural light of the cheap options, which matters if we want the photos to look good. Small birthdays are explicitly fine. Two hours of free parking for anyone driving. Same building as Tulbi and Photoroom, so worth comparing all three in one trip.",
    travel: "~25 min walk or 5 min taxi",
    travelMode: "walk",
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
    notes: "Darker and cosier than Barefoot upstairs — better for evening-party mood, worse for seeing what you're painting. Suits small groups. Weekends in high season cost more than the listed rate, so the estimate is a range until someone asks for the actual Saturday price.",
    travel: "~25 min walk or 5 min taxi",
    travelMode: "walk",
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
    notes: "Textured walls and wooden floors — the most characterful of the three at this address, and the most expensive. One room should do us; two halls together start at 70 €/h and would be overkill for 11. The wide estimate is because of that choice. Was closed Jan–Sept 2026, so confirm they're actually open before anyone gets attached.",
    travel: "~25 min walk or 5 min taxi",
    travelMode: "walk",
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
    notes: "Second cheapest, and the rate drops after two hours, so it gets better the longer we stay — a whole day is 175 € if we wanted to stretch out. Two catches: it's out in the Laki industrial area with nothing around it, and it's on the 4th floor with no lift mentioned, which is a real question with 11 people and a lot of bags.",
    travel: "~10 min taxi",
    travelMode: "taxi",
    link: "https://fotosioon.com/soovid-stuudiot-rentida",
    linkLabel: "Website",
    confirmParty: true,
    photos: []
  },
  {
    id: "saal",
    name: "Saal Stuudio",
    area: "Kaevuri 1, Kopli",
    price: "30 € + VAT 1st h, then 25 € + VAT",
    estMin: 159,
    estMax: 159,
    notes: "Bright, spacious and by the sea in old Kopli — the nicest setting on the list if we want a walk afterwards. But it's the most purely a photo studio: less of a room you settle into for five hours. Prices are quoted without VAT, unlike everyone else here; the estimate has the 22% added so it's comparable. Full day 150 € + VAT.",
    travel: "~15 min taxi",
    travelMode: "taxi",
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
    notes: "Cheapest on the list and the only one we can walk to from brunch — no taxis, no coordinating cars, nobody getting lost. A whole day is 100 €, which is less than five hours at the hourly rate, so ask for the day price. One catch worth settling first: their birthday package is written for up to 10 people and we are 11.",
    travel: "~8 min walk",
    travelMode: "walk",
    link: "https://makeupband.ee/et/stuudio-rent",
    linkLabel: "Website",
    confirmParty: true,
    photos: []
  },
  {
    id: "tagahoov",
    name: "Tagahoov",
    area: "Kastani 42, Aparaaditehas — TARTU",
    price: "250 € first 3 h, then 60 €/h",
    estMin: 370,
    estMax: 370,
    notes: "A real event space rather than a photo studio, 240 m² for up to 50, and adult parties are what they do — but it is in Tartu, not Tallinn. Their own site gives the address as Aparaaditehas, Kastani 42, third floor.",
    travel: "~2.5 h drive — this is in another city",
    travelMode: "taxi",
    travelStandalone: true,
    flag: "This venue is in Tartu, roughly 185 km away. Almost certainly a mistake on the list.",
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
    notes: "The only one that isn't rented by the hour: a whole house, ours until midnight, fits up to 40. So it's the priciest for five hours and the cheapest if the day turns into an evening — and the only option where nobody has to pack up and leave at 5. Nõmme is leafy and quiet, but it's the furthest out, so everyone needs a plan for getting home.",
    travel: "~15 min taxi",
    travelMode: "taxi",
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
    notes: "Eclectic vintage interior and easily the most interesting-looking space here, 202 m² in the old Põhjala factory. The problem is we can't compare it: party pricing is quote-only, so someone has to email them before this is a real option rather than a maybe. Worth doing early if the look appeals.",
    travel: "~12 min taxi",
    travelMode: "taxi",
    link: "https://bakbak.ee",
    linkLabel: "Website",
    confirmParty: true,
    photos: []
  }
];
