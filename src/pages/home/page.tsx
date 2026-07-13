import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { restaurantTables } from "@/mocks/tables";

export default function Home() {
  const navigate = useNavigate();
  const [tableInput, setTableInput] = useState("");
  const [error, setError] = useState("");

  const handleTableSelect = (code: string) => {
    navigate(`/menu/${code}`);
  };

  const handleManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tableInput.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter a table code");
      return;
    }
    const found = restaurantTables.find((t) => t.code === trimmed);
    if (found) {
      navigate(`/menu/${found.code}`);
    } else {
      setError("Table not found. Please check the code and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <header className="bg-primary-500 text-background-50 px-4 py-6">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
            The Spice Kitchen
          </h1>
          <p className="mt-1 text-primary-100 text-sm">
            Modern Indian Dining
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl font-semibold text-foreground-900">
              Welcome
            </h2>
            <p className="mt-2 text-foreground-600 text-sm leading-relaxed">
              Select your table below or enter your table code to view the menu and start ordering.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {restaurantTables.map((table) => (
              <button
                key={table.id}
                onClick={() => handleTableSelect(table.code)}
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-background-300 bg-background-50 hover:bg-primary-50 hover:border-primary-300 transition-all duration-200 cursor-pointer group"
              >
                <span className="text-2xl mb-1">
                  <i className="ri-restaurant-line text-primary-500 group-hover:text-primary-600"></i>
                </span>
                <span className="font-heading text-lg font-semibold text-foreground-900">
                  {table.code}
                </span>
                <span className="text-xs text-foreground-500 mt-0.5">
                  {table.seats} seats
                </span>
              </button>
            ))}
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-background-300"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background-50 px-3 text-foreground-500">
                or enter table code manually
              </span>
            </div>
          </div>

          <form onSubmit={handleManualEntry} className="space-y-3">
            <div>
              <label htmlFor="tableCode" className="block text-sm font-medium text-foreground-700 mb-1.5">
                Table Code
              </label>
              <input
                id="tableCode"
                type="text"
                value={tableInput}
                onChange={(e) => {
                  setTableInput(e.target.value);
                  setError("");
                }}
                placeholder="e.g. T01"
                className="w-full px-4 py-3 rounded-lg border border-background-300 bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm transition-all"
                maxLength={5}
              />
              {error && (
                <p className="mt-1.5 text-xs text-primary-600 flex items-center gap-1">
                  <i className="ri-error-warning-line"></i>
                  {error}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-primary-500 text-background-50 rounded-lg font-medium text-sm hover:bg-primary-600 active:bg-primary-700 transition-all duration-200 cursor-pointer whitespace-nowrap"
            >
              View Menu
            </button>
          </form>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-foreground-400">
        Scan the QR code on your table to get started
      </footer>
    </div>
  );
}