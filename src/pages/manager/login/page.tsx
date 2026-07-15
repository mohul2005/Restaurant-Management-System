import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/store/AuthContext";
import { supabase } from "@/lib/supabase";
import FloatingFood from "@/components/feature/FloatingFood";
import StaffAccountSetup from "@/components/feature/StaffAccountSetup";

export default function ManagerLoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [accountReady, setAccountReady] = useState(false);
  const [setupMessage, setSetupMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function ensureAccount() {
      setSetupMessage("Preparing your account...");
      try {
        const { data, error: invokeError } = await supabase.functions.invoke("setup-staff-accounts");
        if (cancelled) return;
        if (!invokeError && data?.success) {
          setAccountReady(true);
          setSetupMessage("");
        } else {
          setSetupMessage("Account setup may have failed. Try again or use the manual setup link below.");
        }
      } catch {
        if (!cancelled) setSetupMessage("Could not reach setup service. Check your connection.");
      }
    }
    ensureAccount();
    return () => { cancelled = true; };
  }, []);

  if (user) {
    navigate("/manager/dashboard", { replace: true });
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);

    if (signInError) {
      setError(signInError);
      return;
    }

    navigate("/manager/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background-50 flex items-center justify-center p-4">
      <FloatingFood />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary-500 flex items-center justify-center">
            <i className="ri-restaurant-2-line text-2xl text-background-50"></i>
          </div>
          <h1 className="font-heading text-2xl font-semibold text-foreground-900">Manager Login</h1>
          <p className="text-sm text-foreground-500 mt-1">Sign in to manage orders</p>
        </div>

        {setupMessage && (
          <div className={`mb-4 px-4 py-2.5 rounded-lg text-xs text-center ${accountReady ? 'bg-primary-50 border border-primary-200 text-primary-700' : 'bg-accent-50 border border-accent-200 text-accent-700'}`}>
            {setupMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-background-50 border border-background-200 rounded-xl p-6 space-y-4">
          {error && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 text-sm text-primary-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-foreground-600 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="mohulsarkar22@gmail.com"
              className="w-full px-3 py-2.5 text-sm border border-background-300 rounded-lg bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-foreground-600 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="w-full px-3 py-2.5 text-sm border border-background-300 rounded-lg bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link to="/" className="text-xs text-foreground-400 hover:text-foreground-600 transition-colors">
            &larr; Back to Home
          </Link>
        </div>

        <StaffAccountSetup />
      </div>
    </div>
  );
}