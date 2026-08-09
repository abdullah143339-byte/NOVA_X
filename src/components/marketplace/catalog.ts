export interface CatalogCategory {
  id: string;
  label: string;
  emoji: string;
  gradient: string;
  sub: string[];
}

export interface BrandSeed {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  tagline: string;
}

export interface StoreSeed {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  verified: boolean;
  rating: number;
  followers: number;
  tagline: string;
}

export interface CouponSeed {
  code: string;
  label: string;
  value: number;
  type: "percent" | "flat";
  minSpend: number;
  emoji: string;
  gradient: string;
}

export interface HeroBannerSeed {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  emoji: string;
  gradient: string;
}

export const MEGA_CATEGORIES: CatalogCategory[] = [
  { id: "electronics", label: "Electronics", emoji: "🔌", gradient: "from-blue-500 to-indigo-600", sub: ["Headphones", "Speakers", "Cameras", "Wearables", "Drones"] },
  { id: "mobiles", label: "Mobiles", emoji: "📱", gradient: "from-cyan-500 to-blue-600", sub: ["Smartphones", "Accessories", "Cases", "Chargers", "Power Banks"] },
  { id: "computers", label: "Computers", emoji: "💻", gradient: "from-slate-600 to-gray-700", sub: ["Laptops", "Desktops", "Monitors", "Keyboards", "Storage"] },
  { id: "gaming", label: "Gaming", emoji: "🎮", gradient: "from-violet-500 to-purple-600", sub: ["Consoles", "Controllers", "Headsets", "Games", "Setup Gear"] },
  { id: "fashion", label: "Fashion", emoji: "👗", gradient: "from-pink-500 to-rose-500", sub: ["Clothing", "Accessories", "Shoes", "Bags", "Jewellery"] },
  { id: "men", label: "Men", emoji: "👔", gradient: "from-indigo-500 to-blue-600", sub: ["Shirts", "T-Shirts", "Jeans", "Sneakers", "Watches"] },
  { id: "women", label: "Women", emoji: "👜", gradient: "from-fuchsia-500 to-pink-500", sub: ["Dresses", "Heels", "Handbags", "Jewellery", "Scarves"] },
  { id: "kids", label: "Kids", emoji: "🧸", gradient: "from-amber-500 to-orange-500", sub: ["Toys", "Clothing", "Books", "Nursery", "Outdoor"] },
  { id: "beauty", label: "Beauty", emoji: "💄", gradient: "from-rose-400 to-red-500", sub: ["Makeup", "Skincare", "Haircare", "Fragrance", "Tools"] },
  { id: "health", label: "Health", emoji: "💊", gradient: "from-emerald-500 to-green-600", sub: ["Vitamins", "Supplements", "Fitness", "Wellness", "Devices"] },
  { id: "home", label: "Home", emoji: "🏠", gradient: "from-orange-400 to-amber-600", sub: ["Decor", "Lighting", "Textiles", "Storage", "Gardening"] },
  { id: "kitchen", label: "Kitchen", emoji: "🍳", gradient: "from-red-400 to-orange-500", sub: ["Cookware", "Appliances", "Utensils", "Dining", "Coffee"] },
  { id: "furniture", label: "Furniture", emoji: "🛋️", gradient: "from-amber-600 to-yellow-700", sub: ["Sofas", "Tables", "Chairs", "Beds", "Wardrobes"] },
  { id: "sports", label: "Sports", emoji: "⚽", gradient: "from-green-500 to-emerald-600", sub: ["Fitness", "Outdoor", "Team Sports", "Cycling", "Yoga"] },
  { id: "books", label: "Books", emoji: "📚", gradient: "from-purple-500 to-violet-600", sub: ["Fiction", "Non-Fiction", "E-Books", "Comics", "Education"] },
  { id: "automotive", label: "Automotive", emoji: "🚗", gradient: "from-slate-500 to-gray-700", sub: ["Car Accessories", "Interiors", "Care", "Electronics", "Spares"] },
  { id: "groceries", label: "Groceries", emoji: "🛒", gradient: "from-lime-500 to-green-600", sub: ["Fresh", "Snacks", "Beverages", "Pantry", "Frozen"] },
  { id: "pet-supplies", label: "Pet Supplies", emoji: "🐾", gradient: "from-teal-500 to-cyan-600", sub: ["Food", "Toys", "Grooming", "Beds", "Health"] },
  { id: "office", label: "Office", emoji: "📎", gradient: "from-gray-500 to-slate-600", sub: ["Stationery", "Desks", "Chairs", "Printers", "Organisers"] },
  { id: "digital-products", label: "Digital Products", emoji: "🎨", gradient: "from-fuchsia-500 to-purple-600", sub: ["Templates", "UI Kits", "Icons", "Fonts", "Stock"] },
  { id: "software", label: "Software", emoji: "🖥️", gradient: "from-sky-500 to-blue-600", sub: ["Productivity", "Design", "Security", "Developer", "Business"] },
  { id: "ai-products", label: "AI Products", emoji: "🤖", gradient: "from-indigo-500 to-fuchsia-600", sub: ["AI Models", "Agents", "Chatbots", "Tools", "Automation"] },
  { id: "services", label: "Services", emoji: "🛠️", gradient: "from-cyan-500 to-teal-600", sub: ["Design", "Development", "Marketing", "Consulting", "Support"] },
];

export const TOP_BRANDS: BrandSeed[] = [
  { id: "nova", name: "NOVA", emoji: "✨", gradient: "from-primary to-accent", tagline: "Official AI products" },
  { id: "pixelworks", name: "PixelWorks", emoji: "🎨", gradient: "from-fuchsia-500 to-purple-600", tagline: "Design & creative tools" },
  { id: "codeforge", name: "CodeForge", emoji: "⚡", gradient: "from-amber-500 to-orange-600", tagline: "Developer kits & templates" },
  { id: "lumen", name: "Lumen", emoji: "💡", gradient: "from-yellow-400 to-amber-500", tagline: "Smart home & lighting" },
  { id: "aether", name: "Aether", emoji: "🔮", gradient: "from-violet-500 to-indigo-600", tagline: "AI model studio" },
  { id: "vertex", name: "Vertex", emoji: "📈", gradient: "from-emerald-500 to-green-600", tagline: "Analytics & dashboards" },
  { id: "soundwave", name: "SoundWave", emoji: "🎧", gradient: "from-cyan-500 to-blue-600", tagline: "Audio & wearables" },
  { id: "graphica", name: "Graphica", emoji: "🖌️", gradient: "from-rose-500 to-pink-600", tagline: "Digital art & assets" },
];

export const OFFICIAL_STORES: StoreSeed[] = [
  { id: "nova-store", name: "NOVA Official Store", emoji: "✨", gradient: "from-primary to-accent", verified: true, rating: 4.9, followers: 128000, tagline: "Authorised NOVA AI store" },
  { id: "pixelworks-store", name: "PixelWorks Studio", emoji: "🎨", gradient: "from-fuchsia-500 to-purple-600", verified: true, rating: 4.8, followers: 86000, tagline: "Creative templates for everyone" },
  { id: "codeforge-store", name: "CodeForge HQ", emoji: "⚡", gradient: "from-amber-500 to-orange-600", verified: true, rating: 4.7, followers: 54000, tagline: "Ship faster with ready code" },
  { id: "aether-lab", name: "Aether Lab", emoji: "🔮", gradient: "from-violet-500 to-indigo-600", verified: true, rating: 4.9, followers: 41000, tagline: "Frontier AI models" },
  { id: "soundwave-store", name: "SoundWave Audio", emoji: "🎧", gradient: "from-cyan-500 to-blue-600", verified: false, rating: 4.6, followers: 32000, tagline: "Pro audio for creators" },
  { id: "graphica-store", name: "Graphica Market", emoji: "🖌️", gradient: "from-rose-500 to-pink-600", verified: true, rating: 4.8, followers: 29000, tagline: "Curated digital art packs" },
];

export const COUPONS: CouponSeed[] = [
  { code: "NOVA10", label: "10% off everything", value: 10, type: "percent", minSpend: 0, emoji: "🎉", gradient: "from-primary to-accent" },
  { code: "SAVE20", label: "$20 off orders over $100", value: 20, type: "flat", minSpend: 100, emoji: "💸", gradient: "from-emerald-500 to-green-600" },
  { code: "FLASH30", label: "30% off flash sale", value: 30, type: "percent", minSpend: 25, emoji: "⚡", gradient: "from-amber-500 to-orange-600" },
  { code: "FIRST15", label: "15% off your first order", value: 15, type: "percent", minSpend: 0, emoji: "✨", gradient: "from-fuchsia-500 to-purple-600" },
  { code: "FREESHIP", label: "Free express shipping", value: 100, type: "flat", minSpend: 50, emoji: "🚚", gradient: "from-cyan-500 to-blue-600" },
  { code: "MEGA50", label: "$50 off orders over $250", value: 50, type: "flat", minSpend: 250, emoji: "🛍️", gradient: "from-rose-500 to-pink-600" },
];

export const HERO_BANNERS: HeroBannerSeed[] = [
  { id: "b1", title: "AI-Powered Marketplace", subtitle: "Discover products, models & services powered by intelligence.", cta: "Shop Now", emoji: "🚀", gradient: "from-primary via-accent to-primary/40" },
  { id: "b2", title: "Mega Sale Week", subtitle: "Up to 70% off across thousands of products. Limited time only.", cta: "Grab Deals", emoji: "⚡", gradient: "from-orange-500 via-red-500 to-rose-600" },
  { id: "b3", title: "New AI Products", subtitle: "Explore the latest AI models, agents and automation tools.", cta: "Explore", emoji: "🤖", gradient: "from-indigo-600 via-violet-600 to-fuchsia-600" },
  { id: "b4", title: "Top-Rated Stores", subtitle: "Shop from verified official stores with real customer reviews.", cta: "View Stores", emoji: "🛍️", gradient: "from-emerald-600 via-teal-600 to-cyan-600" },
];

// The marketplace is Pakistan-only: prices are in PKR, the language is
// always English, and delivery is limited to cities inside Pakistan.

export const LOCATIONS = [
  { id: "karachi", label: "Karachi" },
  { id: "lahore", label: "Lahore" },
  { id: "islamabad", label: "Islamabad" },
  { id: "rawalpindi", label: "Rawalpindi" },
  { id: "faisalabad", label: "Faisalabad" },
  { id: "multan", label: "Multan" },
  { id: "peshawar", label: "Peshawar" },
  { id: "quetta", label: "Quetta" },
  { id: "sialkot", label: "Sialkot" },
  { id: "hyderabad", label: "Hyderabad" },
];

export const SEARCH_SUGGESTIONS = [
  "AI templates",
  "React components",
  "Machine learning course",
  "Website design",
  "Mobile UI kit",
  "NestJS boilerplate",
  "Prompt engineering",
  "Digital art pack",
];

export const FLASH_SALE_IDS = [
  "3c3d812c-0405-4db8-9394-7cd5ba527e67",
  "f703336b-c5d8-49f9-a9b2-98741d3ebd7e",
  "fd42b538-1908-45b0-9d33-90c338c5e64d",
  "0042088f-7f02-4f58-9df5-3949a6565b9e",
  "b62ec5f7-cdd7-433c-8bcf-849a014cf815",
  "5aac05ad-8f14-497e-8fdb-6193e9eebe18",
];
