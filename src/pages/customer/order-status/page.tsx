import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useOrder } from "@/store/OrderProvider";
import { supabase } from "@/lib/supabase";
import FloatingFood from "@/components/feature/FloatingFood";
import type { Order } from "@/store/OrderContext";

const STATUS_CONFIG: Record<Order["status"], { label: string; color: string; bg: string; icon: string; desc: string }> = {
  pending_approval: {
    label: "Pending Approval",
    color: "text-accent-700",
    bg: "bg-accent-50 border-accent-200",
    icon: "ri-time-line",
    desc: "Your order has been received and is waiting for manager approval.",
  },
  approved: {
    label: "Approved",
    color: "text-secondary-700",
    bg: "bg-secondary-50 border-secondary-200",
    icon: "ri-check-double-line",
    desc: "Order approved! Payment details will be shared shortly.",
  },
  awaiting_payment: {
    label: "Awaiting Payment",
    color: "text-secondary-700",
    bg: "bg-secondary-50 border-secondary-200",
    icon: "ri-bank-card-line",
    desc: "Please complete your payment using the UPI details below.",
  },
  paid: {
    label: "Payment Done",
    color: "text-primary-700",
    bg: "bg-primary-50 border-primary-200",
    icon: "ri-check-line",
    desc: "Payment confirmed! Your order is being sent to the kitchen.",
  },
  preparing: {
    label: "Preparing",
    color: "text-primary-700",
    bg: "bg-primary-50 border-primary-200",
    icon: "ri-fire-line",
    desc: "The kitchen is preparing your delicious meal right now.",
  },
  ready: {
    label: "Ready to Serve",
    color: "text-primary-700",
    bg: "bg-primary-50 border-primary-200",
    icon: "ri-restaurant-line",
    desc: "Your order is ready! It will be served to your table shortly.",
  },
};

const STATUS_STEPS: Order["status"][] = [
  "pending_approval",
  "approved",
  "awaiting_payment",
  "paid",
  "preparing",
  "ready",
];

interface ReservationData {
  id: string;
  status: string;
  feedback: string | null;
  first_name: string;
  last_name: string;
  table_code: string;
}

export default function OrderStatusPage() {
  const { tableCode, orderId } = useParams<{ tableCode: string; orderId: string }>();
  const { subscribeToOrder } = useOrder();
  const [order, setOrder] = useState<Order | null>(null);
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const receivedRef = useRef(false);

  // Feedback state
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [finishLoading, setFinishLoading] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);

  // Subscribe to order
  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;
    receivedRef.current = false;
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToOrder(orderId, (updatedOrder) => {
      if (!cancelled) {
        receivedRef.current = true;
        setOrder(updatedOrder);
        setLoading(false);
        setError(null);
      }
    });

    const timeout = setTimeout(() => {
      if (!cancelled && !receivedRef.current) {
        setLoading(false);
        setError("Order not found. It may have been removed.");
      }
    }, 8000);

    return () => {
      cancelled = true;
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [orderId, subscribeToOrder]);

  // Fetch and subscribe to reservation linked to this order
  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;

    const fetchReservation = async () => {
      const { data, error: fetchError } = await supabase
        .from("reservations")
        .select("id, status, feedback, first_name, last_name, table_code")
        .eq("order_id", orderId)
        .maybeSingle();

      if (!cancelled) {
        if (fetchError) {
          console.error("Failed to fetch reservation:", fetchError);
        } else if (data) {
          setReservation(data as ReservationData);
          if ((data as ReservationData).feedback) {
            setFeedbackDone(true);
          }
        }
      }
    };

    fetchReservation();

    const channel = supabase
      .channel(`reservation-order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          if (!cancelled) {
            const newData = payload.new as ReservationData;
            setReservation(newData);
            if (newData.feedback) {
              setFeedbackDone(true);
            }
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const handleFinishReservation = async () => {
    if (!reservation) return;
    setFinishLoading(true);
    const { error: updateError } = await supabase
      .from("reservations")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", reservation.id);

    setFinishLoading(false);
    if (updateError) {
      console.error("Failed to finish reservation:", updateError);
    } else {
      setReservation((prev) => (prev ? { ...prev, status: "completed" } : null));
      setShowFeedbackForm(true);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!reservation) return;
    setFeedbackSubmitting(true);
    const { error: updateError } = await supabase
      .from("reservations")
      .update({ feedback: feedback.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", reservation.id);

    setFeedbackSubmitting(false);
    if (updateError) {
      console.error("Failed to submit feedback:", updateError);
    } else {
      setFeedbackDone(true);
      setShowFeedbackForm(false);
    }
  };

  const handleSkipFeedback = () => {
    setFeedbackDone(true);
    setShowFeedbackForm(false);
  };

  if (!tableCode || !orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background-50">
        <div className="text-center">
          <p className="text-foreground-600">Invalid order link.</p>
          <Link to="/" className="text-primary-500 text-sm mt-2 inline-block hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          <p className="text-sm text-foreground-500">Loading order status...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-100 flex items-center justify-center">
            <i className="ri-error-warning-line text-2xl text-foreground-400"></i>
          </div>
          <p className="text-foreground-600 text-sm">{error || "Order not found."}</p>
          <Link to="/" className="text-primary-500 text-sm mt-3 inline-block font-medium hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIdx = STATUS_STEPS.indexOf(order.status);
  const config = STATUS_CONFIG[order.status];
  const isReservationCompleted = reservation?.status === "completed";
  const isOrderReady = order.status === "ready";

  return (
    <div className="min-h-screen bg-background-50 pb-8">
      <FloatingFood />
      <header className="sticky top-0 z-30 bg-background-50/95 backdrop-blur-sm border-b border-background-200">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link to={`/menu/${tableCode}`} className="text-foreground-500 hover:text-foreground-700">
            <i className="ri-arrow-left-line text-lg"></i>
          </Link>
          <div>
            <h1 className="font-heading text-lg font-semibold text-foreground-900">
              Order Status
            </h1>
            <p className="text-xs text-foreground-500">
              Table {tableCode} &middot; #{order.id.slice(0, 8)}
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 py-5 max-w-lg mx-auto">
        {/* Current Status Banner */}
        <div className={`rounded-xl border p-4 mb-6 ${config.bg}`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-background-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <i className={`${config.icon} text-lg ${config.color}`}></i>
            </div>
            <div>
              <p className="text-xs text-foreground-500 uppercase tracking-wide font-medium">Current Status</p>
              <p className={`text-base font-semibold ${config.color}`}>{config.label}</p>
              <p className="text-xs text-foreground-500 mt-1 leading-relaxed">{config.desc}</p>
            </div>
          </div>
        </div>

        {/* Reservation status badge */}
        {reservation && (
          <div className="mb-4 flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
              isReservationCompleted
                ? "bg-primary-50 text-primary-700 border-primary-200"
                : "bg-secondary-50 text-secondary-700 border-secondary-200"
            }`}>
              {isReservationCompleted ? (
                <span className="flex items-center gap-1">
                  <i className="ri-checkbox-circle-line text-[10px]"></i> Completed
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <i className="ri-calendar-check-line text-[10px]"></i> Active
                </span>
              )}
            </span>
            <span className="text-xs text-foreground-400">
              {reservation.first_name} {reservation.last_name} &middot; {reservation.table_code}
            </span>
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-foreground-500 uppercase tracking-wide mb-3">Progress</h3>
          <div className="space-y-0">
            {STATUS_STEPS.map((step, idx) => {
              const stepConfig = STATUS_CONFIG[step];
              const isCompleted = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const isPending = idx > currentStepIdx;

              return (
                <div key={step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                        isCompleted
                          ? "bg-primary-500 border-primary-500"
                          : isCurrent
                          ? "border-primary-500 bg-primary-50"
                          : "border-background-300 bg-background-50"
                      }`}
                    >
                      {isCompleted ? (
                        <i className="ri-check-line text-xs text-background-50"></i>
                      ) : isCurrent ? (
                        <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-background-300" />
                      )}
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div
                        className={`w-0.5 h-6 ${
                          isCompleted ? "bg-primary-500" : "bg-background-200"
                        }`}
                      />
                    )}
                  </div>
                  <div className={`pb-4 ${isPending ? "opacity-40" : ""}`}>
                    <p
                      className={`text-sm font-medium ${
                        isCompleted
                          ? "text-foreground-500"
                          : isCurrent
                          ? "text-foreground-900"
                          : "text-foreground-400"
                      }`}
                    >
                      {stepConfig.label}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-foreground-500 mt-0.5">{stepConfig.desc}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="rounded-xl border border-background-200 bg-background-50 overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-background-100">
            <h3 className="text-sm font-semibold text-foreground-900">Order Summary</h3>
          </div>
          <div className="divide-y divide-background-100">
            {order.items.map((item: { menuItemId: string; name: string; quantity: number; price: number }, i: number) => (
              <div key={i} className="px-4 py-2.5 flex justify-between items-center">
                <span className="text-sm text-foreground-700">
                  {item.name} <span className="text-foreground-400">x{item.quantity}</span>
                </span>
                <span className="text-sm font-medium text-foreground-900">
                  ₹{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-background-50 space-y-1.5">
            <div className="flex justify-between text-xs text-foreground-500">
              <span>Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-xs text-foreground-500">
              <span>GST (5%)</span>
              <span>₹{order.tax}</span>
            </div>
            <div className="flex justify-between text-xs text-foreground-500">
              <span>Service Charge (5%)</span>
              <span>₹{order.service_charge}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-foreground-900 pt-1 border-t border-background-100">
              <span>Total</span>
              <span>₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* UPI Payment Section */}
        {order.status === "awaiting_payment" && order.upi_handle && (
          <div className="rounded-xl border-2 border-accent-300 bg-accent-50 p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-accent-100">
                <i className="ri-bank-card-line text-accent-600 text-sm"></i>
              </div>
              <h3 className="text-sm font-semibold text-accent-800">Complete Payment via UPI</h3>
            </div>
            <div className="bg-background-50 rounded-lg p-4 text-center border border-accent-200">
              <p className="text-xs text-foreground-500 mb-2">UPI Handle</p>
              <p className="text-lg font-bold text-foreground-900 tracking-wide font-mono">
                {order.upi_handle}
              </p>
              <p className="text-xs text-foreground-500 mt-2">Amount: ₹{order.total}</p>
            </div>
            <p className="text-xs text-foreground-500 mt-3 text-center leading-relaxed">
              Open any UPI app (PhonePe, GPay, Paytm) and send <strong>₹{order.total}</strong> to <strong>{order.upi_handle}</strong>. Once the manager confirms your payment, this page will update automatically.
            </p>
          </div>
        )}

        {/* Approved — waiting for UPI */}
        {order.status === "approved" && (
          <div className="rounded-xl border border-background-200 bg-background-50 p-5 mb-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-secondary-100 flex items-center justify-center">
              <i className="ri-check-double-line text-xl text-secondary-600"></i>
            </div>
            <p className="text-sm text-foreground-700 font-medium">Order approved!</p>
            <p className="text-xs text-foreground-500 mt-1 leading-relaxed">
              The manager will share the UPI payment handle here shortly. Please keep this page open.
            </p>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-foreground-400">
              <div className="w-2 h-2 rounded-full bg-secondary-500 animate-pulse"></div>
              Waiting for payment details...
            </div>
          </div>
        )}

        {/* Payment Done */}
        {order.status === "paid" && (
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-5 mb-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-100 flex items-center justify-center">
              <i className="ri-check-line text-xl text-primary-600"></i>
            </div>
            <p className="text-sm text-foreground-700 font-medium">Payment received!</p>
            <p className="text-xs text-foreground-500 mt-1 leading-relaxed">
              Your payment has been confirmed. Your order is now being sent to the kitchen for preparation.
            </p>
          </div>
        )}

        {/* Preparing */}
        {order.status === "preparing" && (
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-5 mb-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-100 flex items-center justify-center">
              <i className="ri-fire-line text-xl text-primary-600"></i>
            </div>
            <p className="text-sm text-foreground-700 font-medium">In the kitchen!</p>
            <p className="text-xs text-foreground-500 mt-1 leading-relaxed">
              Our chefs are cooking up your meal right now. You will be notified when it is ready.
            </p>
          </div>
        )}

        {/* Ready */}
        {isOrderReady && (
          <>
            {!isReservationCompleted ? (
              /* Not yet finished — show finish button */
              <div className="rounded-xl border-2 border-primary-300 bg-primary-50 p-5 mb-6">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-100 flex items-center justify-center">
                    <i className="ri-restaurant-line text-xl text-primary-600"></i>
                  </div>
                  <p className="text-sm text-foreground-700 font-medium">Ready to serve!</p>
                  <p className="text-xs text-foreground-500 mt-1 leading-relaxed">
                    Your order is ready and will be brought to Table {tableCode} shortly. Enjoy your meal!
                  </p>
                </div>
                <button
                  onClick={handleFinishReservation}
                  disabled={finishLoading}
                  className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-background-50 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
                >
                  {finishLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-background-50 border-t-transparent rounded-full animate-spin"></span>
                      Finishing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <i className="ri-check-double-line"></i>
                      Finish Reservation
                    </span>
                  )}
                </button>
              </div>
            ) : feedbackDone ? (
              /* Completed with or without feedback */
              <div className="rounded-xl border border-primary-200 bg-primary-50 p-5 mb-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-100 flex items-center justify-center">
                  <i className="ri-emotion-happy-line text-xl text-primary-600"></i>
                </div>
                <p className="text-sm text-foreground-700 font-medium">Thank you for dining with us!</p>
                <p className="text-xs text-foreground-500 mt-1 leading-relaxed">
                  We hope you enjoyed your meal at Table {tableCode}. See you again soon!
                </p>
                {reservation?.feedback && (
                  <div className="mt-4 bg-background-50 border border-background-200 rounded-lg px-3 py-2.5 text-left">
                    <p className="text-xs text-foreground-400 mb-1">Your feedback</p>
                    <p className="text-sm text-foreground-700 italic">"{reservation.feedback}"</p>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-primary-200">
                  <Link
                    to="/dining-history"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    <i className="ri-history-line"></i>
                    View Dining History
                  </Link>
                </div>
              </div>
            ) : null}
          </>
        )}

        {/* Feedback Form */}
        {isOrderReady && isReservationCompleted && !feedbackDone && showFeedbackForm && (
          <div className="rounded-xl border border-background-200 bg-background-50 p-5 mb-6">
            <div className="text-center mb-4">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-secondary-100 flex items-center justify-center">
                <i className="ri-chat-3-line text-secondary-600"></i>
              </div>
              <p className="text-sm font-semibold text-foreground-900">How was your experience?</p>
              <p className="text-xs text-foreground-500 mt-0.5">
                Your feedback helps us improve. (Optional — skip if you prefer)
              </p>
            </div>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your thoughts about the food, service, ambiance..."
              maxLength={500}
              rows={4}
              className="w-full px-3 py-2.5 text-sm border border-background-300 rounded-lg bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 resize-none mb-3"
            />
            <div className="flex items-center justify-between text-xs text-foreground-400 mb-3">
              <span>{feedback.length}/500</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSkipFeedback}
                className="flex-1 py-2.5 border border-background-300 text-foreground-600 hover:bg-background-100 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                Skip
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={feedbackSubmitting || !feedback.trim()}
                className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {feedbackSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-background-50 border-t-transparent rounded-full animate-spin"></span>
                    Sending...
                  </span>
                ) : (
                  "Send Feedback"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Order meta */}
        <div className="text-center text-xs text-foreground-400">
          <p>Order placed at {new Date(order.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
          <p className="mt-1">
            <Link to={`/menu/${tableCode}`} className="text-primary-500 hover:underline font-medium">
              Order more items
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}