import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useOrder } from "@/store/OrderProvider";
import { useMenuItems } from "@/hooks/useMenuItems";
import { menuCategories, restaurantTables } from "@/mocks/tables";

export default function MenuPage() {
  const { tableCode } = useParams<{ tableCode: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useOrder();
  const { items: menuItems, loading, error } = useMenuItems();
  const [activeCategory, setActiveCategory] = useState<string>("Starters");
  const [searchTerm, setSearchTerm] = useState("");

  const table = restaurantTables.find((t) => t.code === tableCode);

  const filteredItems = useMemo(() => {
    let items = menuItems.filter((item) => item.category === activeCategory);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term)
      );
    }
    return items;
  }, [menuItems, activeCategory, searchTerm]);

  const cartCount = state.cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = state.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const isInCart = (itemId: string) => state.cart.some((i) => i.menuItemId === itemId);
  const getCartQty = (itemId: string) => state.cart.find((i) => i.menuItemId === itemId)?.quantity || 0;

  if (!table) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-foreground-600">Table not found.</p>
          <Link to="/" className="text-primary-500 text-sm mt-2 inline-block hover:underline">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-50 pb-24">
      <header className="sticky top-0 z-30 bg-background-50 border-b border-background-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-foreground-500 hover:text-foreground-700">
              <i className="ri-arrow-left-line text-lg"></i>
            </Link>
            <div>
              <h1 className="font-heading text-lg font-semibold text-foreground-900">
                The Spice Kitchen
              </h1>
              <p className="text-xs text-foreground-500">
                Table {table.code} &middot; {table.seats} seats
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search menu..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-background-300 bg-background-100 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all"
            />
          </div>
        </div>

        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {menuCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-primary-500 text-background-50"
                  : "bg-background-100 text-foreground-600 hover:bg-background-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 py-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg border border-background-200 animate-pulse">
                <div className="w-20 h-20 rounded-lg bg-background-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-background-200 rounded w-1/2" />
                  <div className="h-3 bg-background-200 rounded w-3/4" />
                  <div className="h-4 bg-background-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-foreground-500 text-sm mb-3">Failed to load menu.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              Retry
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-foreground-500 text-sm">No items found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                isInCart={isInCart(item.id)}
                cartQty={getCartQty(item.id)}
                onAdd={() =>
                  dispatch({
                    type: "ADD_ITEM",
                    payload: {
                      menuItemId: item.id,
                      name: item.name,
                      price: item.price,
                      image: item.image,
                    },
                  })
                }
                onRemove={() => dispatch({ type: "REMOVE_ITEM", payload: { menuItemId: item.id } })}
                onUpdateQty={(qty: number) =>
                  dispatch({
                    type: "UPDATE_QUANTITY",
                    payload: { menuItemId: item.id, quantity: qty },
                  })
                }
              />
            ))}
          </div>
        )}
      </main>

      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-background-50 border-t border-background-200">
          <button
            onClick={() => navigate(`/cart/${tableCode}`)}
            className="w-full flex items-center justify-between bg-primary-500 text-background-50 px-5 py-3.5 rounded-lg font-medium text-sm hover:bg-primary-600 active:bg-primary-700 transition-all duration-200 cursor-pointer whitespace-nowrap"
          >
            <span className="flex items-center gap-2">
              <i className="ri-shopping-cart-line text-lg"></i>
              <span>{cartCount} item{cartCount !== 1 ? "s" : ""}</span>
            </span>
            <span className="font-semibold">₹{cartTotal}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function MenuItemCard({
  item,
  isInCart,
  cartQty,
  onAdd,
  onRemove,
  onUpdateQty,
}: {
  item: {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    is_veg: boolean;
  };
  isInCart: boolean;
  cartQty: number;
  onAdd: () => void;
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
}) {
  return (
    <div className="flex gap-3 p-3 rounded-lg border border-background-200 bg-background-50 hover:border-background-300 transition-all">
      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-background-100">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground-900 truncate">
              {item.name}
              {item.is_veg && (
                <span className="inline-flex items-center ml-1.5 w-3.5 h-3.5">
                  <span className="w-3 h-3 rounded-sm border border-green-500 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  </span>
                </span>
              )}
            </h3>
            <p className="text-xs text-foreground-500 mt-0.5 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-semibold text-foreground-900">
            ₹{item.price}
          </span>

          {!isInCart ? (
            <button
              onClick={onAdd}
              className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-background-50 transition-all cursor-pointer"
            >
              <i className="ri-add-line text-base"></i>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-primary-50 rounded-lg px-2 py-1">
              <button
                onClick={() => (cartQty <= 1 ? onRemove() : onUpdateQty(cartQty - 1))}
                className="w-6 h-6 flex items-center justify-center rounded text-primary-600 hover:bg-primary-100 transition-all cursor-pointer"
              >
                <i className="ri-subtract-line text-sm"></i>
              </button>
              <span className="text-sm font-semibold text-primary-700 min-w-[1.25rem] text-center">
                {cartQty}
              </span>
              <button
                onClick={() => onUpdateQty(cartQty + 1)}
                className="w-6 h-6 flex items-center justify-center rounded text-primary-600 hover:bg-primary-100 transition-all cursor-pointer"
              >
                <i className="ri-add-line text-sm"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}