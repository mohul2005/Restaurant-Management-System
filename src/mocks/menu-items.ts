export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "Starters" | "Main Course" | "Beverages" | "Desserts";
  image: string;
  available: boolean;
  isVeg: boolean;
  spiceLevel?: "mild" | "medium" | "hot";
}

export const menuItems: MenuItem[] = [
  {
    id: "m1",
    name: "Crispy Calamari",
    description: "Lightly battered squid rings fried golden, served with spicy marinara and lemon aioli dipping sauces",
    price: 320,
    category: "Starters",
    image: "https://readdy.ai/api/search-image?query=Crispy%20golden%20fried%20calamari%20rings%20on%20a%20dark%20slate%20plate%20with%20lemon%20wedge%20and%20two%20dipping%20sauces%2C%20restaurant%20food%20photography%2C%20warm%20moody%20lighting%2C%20clean%20minimal%20presentation%2C%20overhead%20shot%20with%20soft%20shadows%20on%20dark%20wood%20table&width=400&height=400&seq=calamari-2026&orientation=squarish",
    available: true,
    isVeg: false,
    spiceLevel: "mild"
  },
  {
    id: "m2",
    name: "Bruschetta Trio",
    description: "Toasted sourdough topped with tomato basil, mushroom truffle, and roasted pepper & feta — three flavor-packed bites",
    price: 280,
    category: "Starters",
    image: "https://readdy.ai/api/search-image?query=Three%20artisan%20bruschetta%20on%20rustic%20wooden%20board%20with%20tomato%20basil%20mushroom%20truffle%20and%20roasted%20pepper%20toppings%2C%20fresh%20herbs%20garnish%2C%20warm%20natural%20light%2C%20professional%20food%20photography%2C%20dark%20background&width=400&height=400&seq=bruschetta-2026&orientation=squarish",
    available: true,
    isVeg: true,
    spiceLevel: "mild"
  },
  {
    id: "m3",
    name: "Chicken Tikka Skewers",
    description: "Tender chicken chunks marinated in spiced yogurt, chargrilled to perfection with mint chutney on the side",
    price: 340,
    category: "Starters",
    image: "https://readdy.ai/api/search-image?query=Juicy%20chicken%20tikka%20skewers%20on%20a%20sizzling%20cast%20iron%20plate%20with%20charred%20onions%20and%20bell%20peppers%2C%20mint%20chutney%20dip%2C%20smoke%20rising%2C%20dark%20dramatic%20food%20photography%2C%20warm%20amber%20lighting&width=400&height=400&seq=tikka-2026&orientation=squarish",
    available: true,
    isVeg: false,
    spiceLevel: "medium"
  },
  {
    id: "m4",
    name: "Paneer Butter Masala",
    description: "Cottage cheese cubes simmered in a rich, creamy tomato gravy with fenugreek and garam masala — our signature dish",
    price: 380,
    category: "Main Course",
    image: "https://readdy.ai/api/search-image?query=Creamy%20paneer%20butter%20masala%20in%20a%20copper%20bowl%20with%20fresh%20cream%20swirl%20and%20coriander%20garnish%2C%20rich%20orange%20gravy%2C%20restaurant%20food%20photography%2C%20warm%20moody%20lighting%2C%20dark%20wood%20table%20background&width=400&height=400&seq=paneer-2026&orientation=squarish",
    available: true,
    isVeg: true,
    spiceLevel: "medium"
  },
  {
    id: "m5",
    name: "Butter Chicken",
    description: "Tandoori chicken tikka folded into a velvety tomato-cream sauce, finished with a touch of honey and kasuri methi",
    price: 420,
    category: "Main Course",
    image: "https://readdy.ai/api/search-image?query=Rich%20butter%20chicken%20in%20a%20ceramic%20bowl%20with%20cream%20drizzle%20and%20fresh%20coriander%2C%20golden%20orange%20sauce%2C%20professional%20food%20photography%2C%20dark%20moody%20lighting%2C%20elegant%20restaurant%20presentation%20on%20slate%20surface&width=400&height=400&seq=butter-chicken-2026&orientation=squarish",
    available: true,
    isVeg: false,
    spiceLevel: "medium"
  },
  {
    id: "m6",
    name: "Dal Makhani",
    description: "Slow-cooked black lentils with butter and cream, simmered overnight for that authentic smoky dhaba taste",
    price: 320,
    category: "Main Course",
    image: "https://readdy.ai/api/search-image?query=Rich%20creamy%20dal%20makhani%20in%20a%20traditional%20copper%20bowl%20topped%20with%20fresh%20cream%20and%20butter%2C%20dark%20lentils%20with%20glistening%20texture%2C%20warm%20restaurant%20food%20photography%2C%20dark%20wood%20background%2C%20soft%20dramatic%20lighting&width=400&height=400&seq=dal-2026&orientation=squarish",
    available: true,
    isVeg: true,
    spiceLevel: "mild"
  },
  {
    id: "m7",
    name: "Grilled Fish in Lemon Butter",
    description: "Fresh catch of the day marinated with herbs, grilled and drizzled with lemon butter caper sauce, served with sautéed vegetables",
    price: 520,
    category: "Main Course",
    image: "https://readdy.ai/api/search-image?query=Beautifully%20grilled%20fish%20fillet%20with%20golden%20sear%20marks%20on%20white%20ceramic%20plate%2C%20lemon%20butter%20sauce%20drizzle%2C%20saut%C3%A9ed%20seasonal%20vegetables%20on%20side%2C%20fresh%20herb%20garnish%2C%20elegant%20restaurant%20food%20photography%2C%20dark%20background&width=400&height=400&seq=grilled-fish-2026&orientation=squarish",
    available: true,
    isVeg: false,
    spiceLevel: "mild"
  },
  {
    id: "m8",
    name: "Chicken Biryani",
    description: "Fragrant basmati rice layered with spiced chicken, caramelized onions, saffron, and fresh mint — sealed and slow-cooked dum style",
    price: 450,
    category: "Main Course",
    image: "https://readdy.ai/api/search-image?query=Aromatic%20chicken%20biryani%20in%20a%20traditional%20clay%20pot%20with%20golden%20saffron%20rice%20and%20caramelized%20onions%20on%20top%2C%20steam%20rising%2C%20rich%20spices%20visible%2C%20professional%20food%20photography%2C%20dark%20moody%20lighting%2C%20elegant%20presentation&width=400&height=400&seq=biryani-2026&orientation=squarish",
    available: true,
    isVeg: false,
    spiceLevel: "hot"
  },
  {
    id: "m9",
    name: "Mango Lassi",
    description: "Creamy yogurt blended with Alphonso mango pulp, a hint of cardamom, and topped with crushed pistachios",
    price: 160,
    category: "Beverages",
    image: "https://readdy.ai/api/search-image?query=Tall%20glass%20of%20golden%20mango%20lassi%20with%20condensation%20drops%2C%20topped%20with%20crushed%20pistachios%20and%20saffron%20strands%2C%20on%20a%20dark%20wooden%20surface%2C%20warm%20natural%20light%2C%20refreshing%20summer%20drink%20photography%2C%20elegant%20restaurant%20style&width=400&height=400&seq=lassi-2026&orientation=squarish",
    available: true,
    isVeg: true,
    spiceLevel: "mild"
  },
  {
    id: "m10",
    name: "Fresh Lime Soda",
    description: "Zesty lime juice with sparkling water, served sweet or salted with a sprig of fresh mint and a pinch of roasted cumin",
    price: 120,
    category: "Beverages",
    image: "https://readdy.ai/api/search-image?query=Tall%20glass%20of%20sparkling%20fresh%20lime%20soda%20with%20ice%20cubes%20and%20mint%20sprig%2C%20condensation%20on%20glass%2C%20lime%20wedge%20on%20rim%2C%20dark%20background%2C%20refreshing%20beverage%20food%20photography%2C%20studio%20lighting%2C%20clean%20composition&width=400&height=400&seq=lime-soda-2026&orientation=squarish",
    available: true,
    isVeg: true,
    spiceLevel: "mild"
  },
  {
    id: "m11",
    name: "Masala Chai",
    description: "Handcrafted Indian tea brewed with fresh ginger, cardamom, cloves, and cinnamon — the perfect aromatic pick-me-up",
    price: 90,
    category: "Beverages",
    image: "https://readdy.ai/api/search-image?query=Traditional%20masala%20chai%20in%20a%20clay%20kulhad%20cup%20with%20steam%20rising%2C%20scattered%20whole%20spices%20cinnamon%20cardamom%20on%20dark%20wood%20surface%2C%20warm%20moody%20lighting%2C%20artisan%20tea%20photography%2C%20rustic%20elegant%20vibe&width=400&height=400&seq=chai-2026&orientation=squarish",
    available: true,
    isVeg: true,
    spiceLevel: "mild"
  },
  {
    id: "m12",
    name: "Gulab Jamun",
    description: "Soft milk-solid dumplings soaked in rose-scented sugar syrup, served warm with a scoop of vanilla ice cream",
    price: 180,
    category: "Desserts",
    image: "https://readdy.ai/api/search-image?query=Two%20warm%20golden%20gulab%20jamun%20in%20a%20small%20ceramic%20bowl%20with%20rose%20syrup%2C%20vanilla%20ice%20cream%20scoop%20on%20side%2C%20sprinkled%20with%20crushed%20pistachios%2C%20dark%20slate%20plate%2C%20elegant%20dessert%20photography%2C%20warm%20dramatic%20lighting&width=400&height=400&seq=gulab-jamun-2026&orientation=squarish",
    available: true,
    isVeg: true,
    spiceLevel: "mild"
  },
  {
    id: "m13",
    name: "Chocolate Lava Cake",
    description: "Decadent molten-centered chocolate cake served warm, paired with vanilla bean gelato and fresh berries",
    price: 280,
    category: "Desserts",
    image: "https://readdy.ai/api/search-image?query=Warm%20chocolate%20lava%20cake%20with%20molten%20center%20oozing%20out%2C%20vanilla%20gelato%20scoop%2C%20fresh%20raspberries%20and%20mint%20garnish%2C%20dark%20ceramic%20plate%2C%20elegant%20dessert%20photography%2C%20rich%20dark%20lighting%2C%20fine%20dining%20presentation&width=400&height=400&seq=lava-cake-2026&orientation=squarish",
    available: true,
    isVeg: true,
    spiceLevel: "mild"
  },
  {
    id: "m14",
    name: "Rasmalai",
    description: "Delicate flattened cottage cheese patties soaked in chilled saffron-infused milk, garnished with slivered almonds and rose petals",
    price: 200,
    category: "Desserts",
    image: "https://readdy.ai/api/search-image?query=Two%20delicate%20rasmalai%20patties%20floating%20in%20creamy%20saffron%20milk%20in%20a%20small%20copper%20bowl%2C%20almond%20slivers%20and%20rose%20petals%20on%20top%2C%20dark%20background%2C%20elegant%20Indian%20dessert%20photography%2C%20soft%20dramatic%20lighting&width=400&height=400&seq=rasmalai-2026&orientation=squarish",
    available: true,
    isVeg: true,
    spiceLevel: "mild"
  },
];

export const getItemsByCategory = (category: string) =>
  menuItems.filter((item) => item.category === category && item.available);