export interface CatalogCategory {
  id: string;
  label: string;
  emoji: string;
  gradient: string;
  sub: string[];
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
