// ─────────────────────────────────────────────────────────────────────────────
//  PROJECT CONFIG — everything a marketer needs to change lives in this file.
//  Swap the texts, units, prices and media paths to re-skin the site for another
//  development. See README.md for the full walkthrough.
// ─────────────────────────────────────────────────────────────────────────────
import { facadeGrid } from './lib/grid.js';

// Where each apartment sits on the hero frame (the frame the camera stops on).
// Coordinates are percentages of the frame: x 0-100 left→right, y 0-100 top→bottom.
// Append ?calibrate to the URL to see these outlines permanently while you tune them.
const shape = facadeGrid({
  quad: { tl: [22.3, 12.7], tr: [78.4, 16.6], br: [78.4, 81.0], bl: [22.3, 81.0] },
  cols: [0, 0.364, 0.686, 1],
  rows: [0, 0.278, 0.518, 0.756, 1],
});

// Apartment types shared by several units.
const types = {
  west: {
    label: 'Forest corner',
    bedrooms: 3,
    bathrooms: 2,
    area: 112,
    outdoor: 16,
    aspect: 'South & west',
    plan: 'media/plans/type-west.svg',
    summary:
      'A three-bedroom corner home wrapped by pines, with evening sun on the balcony and a second aspect over the birch slope.',
  },
  centre: {
    label: 'Lake front',
    bedrooms: 2,
    bathrooms: 2,
    area: 84,
    outdoor: 12,
    aspect: 'South',
    plan: 'media/plans/type-centre.svg',
    summary:
      'A two-bedroom home with a full-width glass front. Living room, kitchen and main bedroom all open straight onto the lake.',
  },
  east: {
    label: 'Shore corner',
    bedrooms: 3,
    bathrooms: 2,
    area: 118,
    outdoor: 18,
    aspect: 'South & east',
    plan: 'media/plans/type-east.svg',
    summary:
      'The largest plan in the building: three bedrooms on the water side, morning light from the east and the longest balcony.',
  },
};

const floors = [
  { level: 3, name: 'Third floor', row: 0 },
  { level: 2, name: 'Second floor', row: 1 },
  { level: 1, name: 'First floor', row: 2 },
  { level: 0, name: 'Garden level', row: 3 },
];
const bays = [
  { key: 'west', col: 0 },
  { key: 'centre', col: 1 },
  { key: 'east', col: 2 },
];
const basePrice = { west: 742000, centre: 548000, east: 796000 };
const status = {
  '0.2': 'sold', '1.1': 'sold', '3.3': 'sold',
  '1.3': 'reserved', '2.1': 'reserved',
};

const units = floors.flatMap((floor) =>
  bays.map((bay, i) => {
    const id = `${floor.level}.${i + 1}`;
    const type = types[bay.key];
    return {
      id,
      name: `Apartment ${id}`,
      type: bay.key,
      floor: floor.level,
      floorName: floor.name,
      ...type,
      // Garden-level homes swap the balcony for a private terrace and lawn.
      outdoor: floor.level === 0 ? type.outdoor + 22 : type.outdoor,
      outdoorLabel: floor.level === 0 ? 'Garden terrace' : 'Balcony',
      price: Math.round((basePrice[bay.key] * (1 + floor.level * 0.045)) / 1000) * 1000,
      status: status[id] || 'available',
      shape: shape(floor.row, bay.col),
    };
  }),
);

export default {
  brand: {
    name: 'Halden Shore',
    mark: ['Halden', 'Shore'],
    strapline: 'Twelve lakefront homes',
    location: 'Lake Halden, Northern Lakes',
  },

  locale: 'en-IE',
  currency: 'EUR',
  areaUnit: 'm²',

  nav: [
    { label: 'The place', href: '#place' },
    { label: 'Residences', href: '#residences' },
    { label: 'Gallery', href: '#gallery' },
  ],
  cta: { label: 'Book a viewing', href: '#contact' },

  // Frame sequences produced by `npm run frames` (see scripts/extract-frames.mjs).
  frames: 'media/frames',

  // The scroll journey, top to bottom. `scroll` is the length of each scene in
  // viewport heights: larger = slower camera. `caption.from/to` are 0-1 within the scene.
  journey: [
    {
      type: 'clip', clip: '01-approach', scroll: 2.2, chapter: 'The lake',
      caption: {
        title: 'Where the forest', accent: 'meets the water',
        text: 'A still northern lake, an hour from the city and a world away from it.',
        from: 0, to: 0.5,
      },
    },
    {
      type: 'clip', clip: '02-arrival', scroll: 1.6, chapter: 'The building',
      caption: {
        title: 'Halden', accent: 'Shore',
        text: 'Twelve homes in limestone and cedar, every one of them facing the lake. Ready to move in from spring 2027.',
        cta: 'Choose your apartment',
        from: 0.45, to: 1.02, brand: true,
      },
    },
    { type: 'selector', scroll: 1.3, chapter: 'Choose a home' },
    { type: 'clip', clip: '03-flyin', scroll: 1.3, chapter: 'Step inside' },
    {
      type: 'clip', clip: '04-enter', scroll: 1.3,
      room: { name: 'Balcony', detail: '12 m² · south facing', from: 0.05, to: 0.5 },
    },
    {
      type: 'clip', clip: '05-living', scroll: 1.6, chapter: 'Living',
      room: { name: 'Living, dining & kitchen', detail: '38 m² · 2.8 m ceilings', from: 0, to: 0.85 },
    },
    {
      type: 'clip', clip: '06-bedroom', scroll: 1.6, chapter: 'Bedroom',
      room: { name: 'Main bedroom', detail: '16 m² · fitted oak wardrobes', from: 0.45, to: 1.01 },
    },
  ],

  selector: {
    title: 'Choose your apartment',
    accent: 'and step inside',
    hint: 'Hover a home to preview it. Click to select it.',
    // The walkthrough footage was filmed in this unit.
    showApartment: '3.2',
    // "Step inside" auto-scrolls through this many scenes after the selector.
    stepInsideScenes: 2,
  },

  statuses: {
    available: { label: 'Available', color: '#5fd58d' },
    reserved: { label: 'Reserved', color: '#e9b45a' },
    sold: { label: 'Sold', color: '#9aa3a0' },
  },

  place: {
    eyebrow: 'The place',
    title: 'A quiet shore,',
    accent: 'kept that way',
    text: 'Halden Shore is a single low building set back among birch and pine, on a south-facing slope that runs down to its own jetty. No through road, no neighbours on the water side, and a green roof that disappears into the hillside when you look back from the lake.',
    facts: [
      { value: 12, label: 'Homes' },
      { value: 84, suffix: '–118 m²', label: 'Two and three bedrooms' },
      { value: 60, suffix: ' m', label: 'To the private jetty' },
      { value: 2027, label: 'Completion, spring', plain: true },
    ],
    features: [
      { title: 'Built for the climate', text: 'Triple glazing, ground-source heating and a sedum roof. Energy class A.' },
      { title: 'Outdoor room for every home', text: 'Deep recessed balconies you can use in the rain, or a private garden terrace at ground level.' },
      { title: 'The practical things', text: 'Underground parking with charging, bike and kayak store, lift to every floor.' },
    ],
  },

  residences: {
    eyebrow: 'Residences',
    title: 'Find the one',
    accent: 'that fits',
    text: 'Live availability for all twelve homes. Open any of them for the floor plan, or ask us to hold it for a viewing.',
  },

  units,

  gallery: {
    eyebrow: 'Gallery',
    title: 'Light, oak',
    accent: 'and limestone',
    images: [
      { src: 'media/gallery/living-lake.webp', alt: 'Living room opening onto the balcony and the lake', caption: 'Living room' },
      { src: 'media/gallery/living-kitchen.webp', alt: 'Open-plan living room with oak kitchen', caption: 'Kitchen & dining' },
      { src: 'media/gallery/bedroom.webp', alt: 'Main bedroom with a full-height window to the pines', caption: 'Main bedroom' },
      { src: 'media/gallery/bathroom.webp', alt: 'Limestone bathroom with freestanding bath', caption: 'Bathroom' },
      { src: 'media/gallery/balcony.webp', alt: 'Recessed balcony with a table for two', caption: 'Balcony' },
      { src: 'media/gallery/building.webp', alt: 'The building seen from the birch slope', caption: 'From the slope' },
    ],
  },

  enquiry: {
    eyebrow: 'Viewings',
    title: 'Come and stand',
    accent: 'on the balcony',
    text: 'The show apartment is open Thursday to Sunday. Tell us which home you have in mind and we will have its plans ready.',
    // Set `endpoint` to a URL that accepts a JSON POST (your CRM, Formspree, a serverless
    // function…). While it is empty the form opens the visitor's mail app addressed to `email`.
    endpoint: '',
    email: 'sales@example.com',
    phone: '+00 000 000 000',
    agent: 'Halden Shore sales office',
  },

  footer: {
    note: 'Images are computer generated and indicative only. Prices and availability are examples for this demo.',
  },
};
