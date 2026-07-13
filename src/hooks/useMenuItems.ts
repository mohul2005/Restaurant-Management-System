import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface MenuItem {
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

export function useMenuItems() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchItems = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("menu_items")
          .select("*")
          .eq("available", true)
          .order("category")
          .order("name");

        if (fetchError) throw fetchError;
        if (!cancelled) {
          setItems(data as MenuItem[]);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load menu");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchItems();

    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading, error };
}