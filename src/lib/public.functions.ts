import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const EVENT_COLS =
  "id, slug, name, short_description, cover_url, venue, city, province, starts_at, status, featured, sales_paused, ticket_categories(price, capacity, sold, reserved, status)";

export const listPublicEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("events")
    .select(EVENT_COLS)
    .in("status", ["publicado", "venta_activa", "pausado", "agotado"])
    .order("starts_at", { ascending: true });
  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
});

export const getPublicEvent = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const { data: ev, error } = await publicClient()
      .from("events")
      .select(
        "id, slug, name, short_description, description, cover_url, organizer_name, venue, address, city, province, starts_at, ends_at, doors_open_at, age_min, entry_conditions, purchase_policy, refund_policy, status, sales_paused, service_fee_pct, ticket_categories(id, name, description, benefits, restrictions, price, currency, capacity, sold, reserved, sale_start, sale_end, max_per_order, status, sort_order)",
      )
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) console.error(error);
    return ev ?? null;
  });

export type PublicEventList = Awaited<ReturnType<typeof listPublicEvents>>;
export type PublicEvent = NonNullable<Awaited<ReturnType<typeof getPublicEvent>>>;
