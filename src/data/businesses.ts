import type { Business } from "../types/business";

const businesses: Business[] = [
  {
    id: 1,
    name: "Third Eye Bookshop",
    description:
      "A beloved independent bookshop specialising in philosophy, spirituality, and rare finds. A quiet sanctuary in the heart of Portland where staff recommendations are always worth trusting.",
    rating: 4.9,
    reviews: 67,
    city: "Portland, OR",
    category: "Retail",
    tags: ["books", "philosophy", "indie"],
    icon: "📚",
    featured: true,
    aiSummary:
      "Third Eye is one of Portland's most distinctive independent bookshops. Its near-perfect rating across dozens of reviews reflects a shop that genuinely cares — about curation, about community, and about the kind of discovery that only happens when you wander the shelves. Best for seekers, readers, and anyone who considers bookshops a form of therapy.",
    address: "1421 SE Hawthorne Blvd, Portland, OR 97214",
    phone: "(503) 555-0182",
    website: "thirdeyebooks.com",
    hours: [
      { days: "Mon – Fri", time: "10:00 AM – 8:00 PM" },
      { days: "Saturday", time: "10:00 AM – 9:00 PM" },
      { days: "Sunday", time: "11:00 AM – 6:00 PM" },
    ],
  },
  {
    id: 2,
    name: "Joe's Coffee",
    description:
      "Neighbourhood coffee roasters serving meticulously sourced single-origin pour-overs. The kind of place regulars guard as a secret — fast wifi, great natural light, and a menu that earns its prices.",
    rating: 4.8,
    reviews: 123,
    city: "Seattle, WA",
    category: "Café",
    tags: ["coffee", "pastries", "wifi"],
    icon: "☕",
    featured: true,
    aiSummary:
      "Joe's consistently ranks among Seattle's most-loved independent cafés. High marks across all categories — coffee quality, atmosphere, and service — make it a reliable choice whether you're working remotely or catching up with someone. The single-origin rotation attracts coffee enthusiasts, but it's welcoming enough for everyone else too.",
    address: "312 Pike St, Seattle, WA 98101",
    phone: "(206) 555-0047",
    website: "joescoffeeseattle.com",
    hours: [
      { days: "Mon – Fri", time: "7:00 AM – 6:00 PM" },
      { days: "Saturday", time: "8:00 AM – 6:00 PM" },
      { days: "Sunday", time: "9:00 AM – 4:00 PM" },
    ],
  },
  {
    id: 3,
    name: "Tech World",
    description:
      "The go-to store for electronics, components, and expert advice. Family-owned since 1998 — they'll actually help you find what you need, and they won't push you toward the most expensive option.",
    rating: 4.6,
    reviews: 42,
    city: "San Francisco, CA",
    category: "Retail",
    tags: ["electronics", "gadgets", "repair"],
    icon: "💻",
    featured: false,
    aiSummary:
      "Tech World stands out in a category often dominated by impersonal chain stores. Reviewers consistently highlight knowledgeable staff and honest advice — a rarity. Solid choice for electronics purchases, repairs, or when you need someone to actually talk you through a decision.",
    address: "740 Market St, San Francisco, CA 94102",
    phone: "(415) 555-0293",
    website: "techworldsf.com",
    hours: [
      { days: "Mon – Sat", time: "9:00 AM – 7:00 PM" },
      { days: "Sunday", time: "11:00 AM – 5:00 PM" },
    ],
  },
  {
    id: 4,
    name: "The Golden Fork",
    description:
      "Farm-to-table American classics in a warm, unpretentious setting. Their weekend brunch has a loyal following — reservations recommended. Sourcing changes with the season, and the kitchen adapts beautifully.",
    rating: 4.7,
    reviews: 198,
    city: "Austin, TX",
    category: "Restaurant",
    tags: ["brunch", "farm-to-table", "american"],
    icon: "🍽️",
    featured: true,
    aiSummary:
      "The Golden Fork is one of Austin's most consistently praised restaurants in its category. Nearly 200 reviews at 4.7 stars is a strong signal — this isn't a place that peaked at opening. Expect seasonal menus, quality sourcing, and a room that's buzzy without being loud. Go for brunch if you can; go for dinner if you can't get a brunch reservation.",
    address: "1806 S Congress Ave, Austin, TX 78704",
    phone: "(512) 555-0164",
    website: "thegoldenfork.com",
    hours: [
      { days: "Tue – Fri", time: "11:00 AM – 10:00 PM" },
      { days: "Sat – Sun", time: "9:00 AM – 10:00 PM" },
      { days: "Monday", time: "Closed" },
    ],
  },
  {
    id: 5,
    name: "Moonrise Bar",
    description:
      "Intimate craft cocktail bar with rotating seasonal menus and live jazz on Thursdays. Hidden down an alley — worth finding. The kind of bar that makes you feel like a local the moment you walk in.",
    rating: 4.5,
    reviews: 84,
    city: "Nashville, TN",
    category: "Bar",
    tags: ["cocktails", "live music", "craft"],
    icon: "🍸",
    featured: true,
    aiSummary:
      "Moonrise is the kind of place that gets better the more you visit. The rotating cocktail menu rewards regulars, and the jazz nights draw a genuinely interesting crowd. Reviewers frequently mention the atmosphere as the main draw — which is high praise for a bar. Best experienced on a Thursday when the music is live.",
    address: "217 5th Ave N, Nashville, TN 37219",
    phone: "(615) 555-0381",
    website: "moonrisebar.com",
    hours: [
      { days: "Mon – Wed", time: "5:00 PM – 12:00 AM" },
      { days: "Thu – Sat", time: "5:00 PM – 2:00 AM" },
      { days: "Sunday", time: "Closed" },
    ],
  },
  {
    id: 6,
    name: "Bloom & Co",
    description:
      "A boutique flower studio offering bespoke arrangements, workshops, and gifting. Every piece is made to order with locally grown flowers — no standing displays, no generic bouquets.",
    rating: 4.8,
    reviews: 55,
    city: "Portland, OR",
    category: "Retail",
    tags: ["flowers", "gifts", "workshops"],
    icon: "🌸",
    featured: false,
    aiSummary:
      "Bloom & Co earns its 4.8 rating through consistency and genuine craft. Reviewers mention the arrangements holding up significantly longer than supermarket flowers, and the workshops as a standout experience. Ideal for gifts, events, or anyone who wants something made with intention rather than pulled from a refrigerator.",
    address: "2847 NE Alberta St, Portland, OR 97211",
    phone: "(503) 555-0574",
    website: "bloomandco.studio",
    hours: [
      { days: "Tue – Sat", time: "9:00 AM – 6:00 PM" },
      { days: "Sunday", time: "10:00 AM – 3:00 PM" },
      { days: "Monday", time: "Closed" },
    ],
  },
  {
    id: 7,
    name: "Soba Noodle House",
    description:
      "Handmade buckwheat soba in broths simmered for 18 hours. Simple, honest, and deeply satisfying — a hidden gem for noodle lovers. Vegetarian and vegan options available across the full menu.",
    rating: 4.7,
    reviews: 91,
    city: "Seattle, WA",
    category: "Restaurant",
    tags: ["japanese", "noodles", "vegetarian-friendly"],
    icon: "🍜",
    featured: false,
    aiSummary:
      "Soba Noodle House has the hallmarks of a place that will still be here in ten years: a focused menu, a clear point of view, and ratings that reflect genuine love rather than novelty hype. The 18-hour broth is mentioned in almost every positive review. Worth a visit if you want something quieter and more considered than the average Seattle dining experience.",
    address: "1519 1st Ave, Seattle, WA 98101",
    phone: "(206) 555-0712",
    website: "sobanoodlehouse.com",
    hours: [
      { days: "Mon – Sat", time: "11:30 AM – 9:30 PM" },
      { days: "Sunday", time: "12:00 PM – 8:00 PM" },
    ],
  },
  {
    id: 8,
    name: "Drift Espresso",
    description:
      "Specialty espresso bar with Scandinavian-inspired interiors and a menu that changes with the season. Excellent for slow mornings — the kind of café that makes you want to sit for two hours with a book.",
    rating: 4.9,
    reviews: 210,
    city: "Austin, TX",
    category: "Café",
    tags: ["espresso", "specialty", "cozy"],
    icon: "☕",
    featured: false,
    aiSummary:
      "Drift has the highest review count in its category and maintains a 4.9 — that combination is exceptionally rare and meaningful. Reviewers use words like 'perfect', 'consistent', and 'my favourite place in the city'. The Scandinavian aesthetic is understated and calming. Go early on weekends — it fills up and the wait is worth it, but you'll wish you'd arrived sooner.",
    address: "900 W 10th St, Austin, TX 78703",
    phone: "(512) 555-0825",
    website: "driftespresso.co",
    hours: [
      { days: "Mon – Fri", time: "7:00 AM – 5:00 PM" },
      { days: "Sat – Sun", time: "8:00 AM – 5:00 PM" },
    ],
  },
];

export default businesses;
