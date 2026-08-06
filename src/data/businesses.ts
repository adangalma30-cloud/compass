import type { Business } from "../types/business";

const businesses: Business[] = [
  {
    id: 1,
    name: "Third Eye Bookshop",
    description:
      "A beloved independent bookshop specialising in philosophy, spirituality, and rare finds. A quiet sanctuary in the heart of Portland.",
    rating: 4.9,
    reviews: 67,
    city: "Portland, OR",
    category: "Retail",
    tags: ["books", "philosophy", "indie"],
    icon: "📚",
    featured: true,
  },
  {
    id: 2,
    name: "Joe's Coffee",
    description:
      "Neighbourhood coffee roasters serving meticulously sourced single-origin pour-overs. The kind of place regulars guard as a secret.",
    rating: 4.8,
    reviews: 123,
    city: "Seattle, WA",
    category: "Café",
    tags: ["coffee", "pastries", "wifi"],
    icon: "☕",
    featured: true,
  },
  {
    id: 3,
    name: "Tech World",
    description:
      "The go-to store for electronics, components, and expert advice. Family-owned since 1998 — they'll actually help you find what you need.",
    rating: 4.6,
    reviews: 42,
    city: "San Francisco, CA",
    category: "Retail",
    tags: ["electronics", "gadgets", "repair"],
    icon: "💻",
    featured: false,
  },
  {
    id: 4,
    name: "The Golden Fork",
    description:
      "Farm-to-table American classics in a warm, unpretentious setting. Their weekend brunch has a loyal following — reservations recommended.",
    rating: 4.7,
    reviews: 198,
    city: "Austin, TX",
    category: "Restaurant",
    tags: ["brunch", "farm-to-table", "american"],
    icon: "🍽️",
    featured: true,
  },
  {
    id: 5,
    name: "Moonrise Bar",
    description:
      "Intimate craft cocktail bar with rotating seasonal menus and live jazz on Thursdays. Hidden down an alley — worth finding.",
    rating: 4.5,
    reviews: 84,
    city: "Nashville, TN",
    category: "Bar",
    tags: ["cocktails", "live music", "craft"],
    icon: "🍸",
    featured: true,
  },
  {
    id: 6,
    name: "Bloom & Co",
    description:
      "A boutique flower studio offering bespoke arrangements, workshops, and gifting. Every piece is made to order with locally grown flowers.",
    rating: 4.8,
    reviews: 55,
    city: "Portland, OR",
    category: "Retail",
    tags: ["flowers", "gifts", "workshops"],
    icon: "🌸",
    featured: false,
  },
  {
    id: 7,
    name: "Soba Noodle House",
    description:
      "Handmade buckwheat soba in broths simmered for 18 hours. Simple, honest, and deeply satisfying — a hidden gem for noodle lovers.",
    rating: 4.7,
    reviews: 91,
    city: "Seattle, WA",
    category: "Restaurant",
    tags: ["japanese", "noodles", "vegetarian-friendly"],
    icon: "🍜",
    featured: false,
  },
  {
    id: 8,
    name: "Drift Espresso",
    description:
      "Specialty espresso bar with Scandinavian-inspired interiors and a menu that changes with the season. Excellent for slow mornings.",
    rating: 4.9,
    reviews: 210,
    city: "Austin, TX",
    category: "Café",
    tags: ["espresso", "specialty", "cozy"],
    icon: "☕",
    featured: false,
  },
];

export default businesses;
