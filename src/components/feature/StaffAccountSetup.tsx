import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StaffAccountSetup() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSetup = async () => {
    setStatus("loading");
    setMessage("Creating staff accounts...");

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("setup-staff-accounts");

      if (invokeError) {
        setStatus("error");
        setMessage(invokeError.message || "Failed to create accounts");
        return;
      }

      if (data?.success) {
        const created = data.results.filter((r: { status: string }) => r.status === "created");
        const failed = data.results.filter((r: { status: string }) => r.status === "failed");

        if (created.length > 0) {
          setStatus("success");
          setMessage(
            `Accounts created: ${created.map((r: { email: string }) => r.email).join(", ")}. ` +
            `Default password for all: (check setup). ${failed.length > 0 ? `Could not create: ${failed.map((r: { email: string }) => r.email).join(", ")}` : ""}`
          );
        } else {
          setStatus("success");
          setMessage("Accounts may already exist. Try logging in with: mohulsarkar22@gmail.com / ryanburl2024");
        }
      } else {
        setStatus("error");
        setMessage(data?.error || "Something went wrong");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Failed to connect to setup service");
    }
  };

  if (status === "success") {
    return (
      <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700">
        <p className="font-medium mb-1">Staff accounts ready</p>
        <p className="text-green-600">mohulsarkar22@gmail.com / ryanburl2024</p>
      </div>
    );
  }

  return (
    <div className="mt-4 text-center">
      <button
        onClick={handleSetup}
        disabled={status === "loading"}
        className="text-xs text-foreground-400 hover:text-foreground-600 underline transition-colors cursor-pointer disabled:opacity-50"
      >
        {status === "loading" ? "Setting up accounts..." : "Set up staff accounts"}
      </button>
      {status === "error" && (
        <p className="text-xs text-red-500 mt-1">{message}</p>
      )}
    </div>
  );
}