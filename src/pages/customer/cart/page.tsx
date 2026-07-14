import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useOrder } from "@/store/OrderProvider";
import { restaurantTables } from "@/mocks/tables";

export default function CartPage() {
  const { tableCode } = useParams<{ tableCode: string }>();
  const navigate = useNavigate();
  const { state, dispatch, placeOrder } = useOrder();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const table = restaurantTables.find((t) => t.code === tableCode);

  const subtotal = state.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const serviceCharge = Math.round(subtotal * 0.05);
  const total = subtotal + tax + serviceCharge;

  const handlePlaceOrder = async () => {
    if (!tableCode || state.cart.length === 0) return;
    setPlacing(true);
    setError(null);

    try {
      const orderId = await placeOrder(tableCode);
      if (orderId) {
        navigate(`/order-status/${tableCode}/${orderId}`);
      } else {
        setError("Failed to place order. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

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
    <div className="min-h-screen bg-background-50 flex flex-col">
      <header className="sticky top-0 z-30 bg-background-50/95 backdrop-blur-sm border-b border-background-200">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link to={`/menu/${tableCode}`} className="text-foreground-500 hover:text-foreground-700">
            <i className="ri-arrow-left-line text-lg"></i>
          </Link>
          <div>
            <h1 className="font-heading text-lg font-semibold text-foreground-900">
              Your Cart
            </h1>
            <p className="text-xs text-foreground-500">Table {table.code}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4">
        {state.cart.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-100 flex items-center justify-center">
              <i className="ri-shopping-cart-line text-2xl text-foreground-400"></i>
            </div>
            <p className="text-foreground-600 text-sm">Your cart is empty</p>
            <Link
              to={`/menu/${tableCode}`}
              className="mt-3 inline-block text-primary-500 text-sm font-medium hover:underline"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {state.cart.map((item) => (
                <div
                  key={item.menuItemId}
                  className="flex items-center gap-3 p-3 rounded-lg border border-background-200 bg-background-50"
                >
                  <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-background-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground-900 truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-foreground-500">₹{item.price} each</p>
                  </div>
                  <div className="flex items-center gap-2 bg-background-100 rounded-lg px-2 py-1">
                    <button
                      onClick={() => {
                        if (item.quantity <= 1) {
                          dispatch({ type: "REMOVE_ITEM", payload: { menuItemId: item.menuItemId } });
                        } else {
                          dispatch({
                            type: "UPDATE_QUANTITY",
                            payload: { menuItemId: item.menuItemId, quantity: item.quantity - 1 },
                          });
                        }
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded text-foreground-500 hover:bg-background-200 transition-all cursor-pointer"
                    >
                      <i className="ri-subtract-line text-sm"></i>
                    </button>
                    <span className="text-sm font-semibold text-foreground-900 min-w-[1.25rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        dispatch({
                          type: "UPDATE_QUANTITY",
                          payload: { menuItemId: item.menuItemId, quantity: item.quantity + 1 },
                        })
                      }
                      className="w-6 h-6 flex items-center justify-center rounded text-foreground-500 hover:bg-background-200 transition-all cursor-pointer"
                    >
                      <i className="ri-add-line text-sm"></i>
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-foreground-900 w-16 text-right">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-background-200 bg-background-50 p-4 space-y-2">
              <div className="flex justify-between text-sm text-foreground-600">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-sm text-foreground-600">
                <span>GST (5%)</span>
                <span>₹{tax}</span>
              </div>
              <div className="flex justify-between text-sm text-foreground-600">
                <span>Service Charge (5%)</span>
                <span>₹{serviceCharge}</span>
              </div>
              <div className="border-t border-background-200 pt-2 flex justify-between text-base font-semibold text-foreground-900">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-primary-50 border border-primary-200 text-primary-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full mt-5 py-3.5 px-4 bg-primary-500 text-background-50 rounded-lg font-medium text-sm hover:bg-primary-600 active:bg-primary-700 transition-all duration-200 cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {placing ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-loader-4-line animate-spin"></i>
                  Placing Order...
                </span>
              ) : (
                <>Place Order &middot; ₹{total}</>
              )}
            </button>
          </>
        )}
      </main>
    </div>
  );
}