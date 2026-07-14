import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  is_veg: boolean;
  spice_level: number;
  available: boolean;
  created_at: string;
}

const CATEGORIES = ["Starters", "Main Course", "Beverages", "Desserts"] as const;
const SPICE_OPTIONS: { label: string; value: number }[] = [
  { label: "Mild", value: 0 },
  { label: "Medium", value: 1 },
  { label: "Hot", value: 2 },
];

const EMPTY_FORM: Omit<MenuItem, "id" | "created_at"> = {
  name: "",
  description: "",
  price: 0,
  category: "Starters",
  image: "",
  is_veg: true,
  spice_level: 0,
  available: true,
};

export default function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterAvailable, setFilterAvailable] = useState<string>("All");

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from("menu_items").select("*").order("category").order("name");
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setItems((data as MenuItem[]) || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load menu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (item: MenuItem) => {
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image,
      is_veg: item.is_veg,
      spice_level: item.spice_level,
      available: item.available,
    });
    setEditingId(item.id);
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Item name is required");
      return;
    }
    if (form.price <= 0) {
      setFormError("Price must be greater than 0");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Math.round(form.price),
        category: form.category,
        image: form.image.trim() || "",
        is_veg: form.is_veg,
        spice_level: form.spice_level,
        available: form.available,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("menu_items")
          .update(payload)
          .eq("id", editingId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("menu_items")
          .insert(payload);
        if (insertError) throw insertError;
      }

      setShowForm(false);
      resetForm();
      await fetchItems();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    const { error: toggleError } = await supabase
      .from("menu_items")
      .update({ available: !item.available })
      .eq("id", item.id);
    if (toggleError) {
      console.error("Failed to toggle availability:", toggleError);
      return;
    }
    await fetchItems();
  };

  const handleDelete = async (id: string) => {
    const { error: deleteError } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", id);
    if (deleteError) {
      console.error("Failed to delete item:", deleteError);
      return;
    }
    setDeleteConfirm(null);
    await fetchItems();
  };

  const filteredItems = items.filter((item) => {
    if (filterCategory !== "All" && item.category !== filterCategory) return false;
    if (filterAvailable === "Available" && !item.available) return false;
    if (filterAvailable === "Unavailable" && item.available) return false;
    return true;
  });

  const groupedItems: Record<string, MenuItem[]> = {};
  filteredItems.forEach((item) => {
    if (!groupedItems[item.category]) groupedItems[item.category] = [];
    groupedItems[item.category].push(item);
  });

  const spiceLabel = (level: number) => {
    const opt = SPICE_OPTIONS.find((s) => s.value === level);
    return opt ? opt.label : "Mild";
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
        <p className="text-sm text-foreground-500">Loading menu...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground-600 uppercase tracking-wide whitespace-nowrap">
            Menu ({items.length} items)
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 text-xs border border-background-300 rounded-lg bg-background-50 text-foreground-700 cursor-pointer"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filterAvailable}
            onChange={(e) => setFilterAvailable(e.target.value)}
            className="px-3 py-1.5 text-xs border border-background-300 rounded-lg bg-background-50 text-foreground-700 cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Available">Available</option>
            <option value="Unavailable">Unavailable</option>
          </select>
          <button
            onClick={openAddForm}
            className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-background-50 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-add-line mr-1"></i> Add Item
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-sm text-primary-700">
          {error}
          <button onClick={fetchItems} className="ml-2 underline cursor-pointer">Retry</button>
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-background-100 flex items-center justify-center">
            <i className="ri-restaurant-line text-xl text-foreground-300"></i>
          </div>
          <p className="text-sm text-foreground-500 font-medium">No menu items found</p>
          <p className="text-xs text-foreground-400 mt-1">Click &quot;Add Item&quot; to create your first menu entry</p>
        </div>
      ) : (
        <div className="space-y-5">
          {CATEGORIES.map((cat) => {
            const catItems = groupedItems[cat];
            if (!catItems || catItems.length === 0) return null;
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 rounded-full bg-primary-500"></div>
                  <h3 className="text-xs font-semibold text-foreground-500 uppercase tracking-wide">
                    {cat} ({catItems.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                        item.available
                          ? "bg-background-50 border-background-200"
                          : "bg-background-100/50 border-background-200/50 opacity-60"
                      }`}
                    >
                      {/* Image */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-background-200">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <i className="ri-image-line text-foreground-400 text-lg"></i>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground-900 truncate">{item.name}</p>
                          {item.is_veg ? (
                            <span className="w-3.5 h-3.5 rounded-sm border border-green-500 flex items-center justify-center flex-shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            </span>
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-sm border border-red-500 flex items-center justify-center flex-shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            </span>
                          )}
                          {!item.available && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-600 font-medium whitespace-nowrap">
                              Off Menu
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground-500 truncate mt-0.5">{item.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-semibold text-primary-500">₹{item.price}</span>
                          <span className="text-[11px] text-foreground-400">{spiceLabel(item.spice_level)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => toggleAvailability(item)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer"
                          title={item.available ? "Mark unavailable" : "Mark available"}
                        >
                          <i
                            className={`text-sm ${
                              item.available ? "ri-eye-line text-primary-600" : "ri-eye-off-line text-foreground-400"
                            }`}
                          ></i>
                        </button>
                        <button
                          onClick={() => openEditForm(item)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer"
                          title="Edit item"
                        >
                          <i className="ri-pencil-line text-sm text-foreground-500"></i>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary-50 transition-colors cursor-pointer"
                          title="Delete item"
                        >
                          <i className="ri-delete-bin-line text-sm text-primary-400"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => { setShowForm(false); resetForm(); }}></div>
          <div className="relative bg-background-50 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-background-50 border-b border-background-200 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="font-heading text-base font-semibold text-foreground-900">
                {editingId ? "Edit Menu Item" : "Add Menu Item"}
              </h3>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-background-100 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-foreground-500"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg text-xs text-primary-700">
                  {formError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-foreground-600 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-background-300 rounded-lg bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400"
                  placeholder="e.g. Paneer Butter Masala"
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-foreground-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-background-300 rounded-lg bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 resize-none"
                  placeholder="Brief description of the dish..."
                  maxLength={300}
                />
              </div>

              {/* Price + Category row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground-600 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={form.price || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-background-300 rounded-lg bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-400"
                    placeholder="0"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground-600 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-background-300 rounded-lg bg-background-50 text-foreground-700 cursor-pointer focus:outline-none focus:border-primary-400"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Veg + Spice + Available row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground-600 mb-1">Type</label>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, is_veg: !prev.is_veg }))}
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
                      form.is_veg
                        ? "bg-accent-50 border-accent-300 text-accent-700"
                        : "bg-primary-50 border-primary-300 text-primary-700"
                    }`}
                  >
                    {form.is_veg ? "Veg" : "Non-Veg"}
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground-600 mb-1">Spice Level</label>
                  <select
                    value={form.spice_level}
                    onChange={(e) => setForm((prev) => ({ ...prev, spice_level: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-background-300 rounded-lg bg-background-50 text-foreground-700 cursor-pointer focus:outline-none focus:border-primary-400"
                  >
                    {SPICE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground-600 mb-1">Available</label>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, available: !prev.available }))}
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
                      form.available
                        ? "bg-accent-100 border-accent-300 text-accent-800"
                        : "bg-background-100 border-background-300 text-foreground-500"
                    }`}
                  >
                    {form.available ? "Yes" : "No"}
                  </button>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-medium text-foreground-600 mb-1">
                  Image URL{" "}
                  <span className="text-foreground-400 font-normal">
                    (Stable Diffusion link or any image URL)
                  </span>
                </label>
                <input
                  type="url"
                  value={form.image}
                  onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-background-300 rounded-lg bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400"
                  placeholder="https://..."
                />
                {form.image && (
                  <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden bg-background-200">
                    <img
                      src={form.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 py-2.5 border border-background-300 text-foreground-600 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
                >
                  {saving ? "Saving..." : editingId ? "Update Item" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)}></div>
          <div className="relative bg-background-50 rounded-2xl w-full max-w-sm p-5 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-50 flex items-center justify-center">
              <i className="ri-error-warning-line text-xl text-primary-500"></i>
            </div>
            <h3 className="font-heading text-base font-semibold text-foreground-900 mb-1">Delete Item?</h3>
            <p className="text-sm text-foreground-500 mb-4">This action cannot be undone. The item will be permanently removed from the menu.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 border border-background-300 text-foreground-600 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 text-background-50 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}