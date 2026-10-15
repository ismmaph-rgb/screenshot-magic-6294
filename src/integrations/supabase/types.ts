export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity: string
          entity_id: string | null
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: number
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: number
        }
        Relationships: []
      }
      event_costs: {
        Row: {
          amount: number
          concept: string
          created_at: string
          event_id: string
          id: string
          is_projection: boolean
        }
        Insert: {
          amount?: number
          concept: string
          created_at?: string
          event_id: string
          id?: string
          is_projection?: boolean
        }
        Update: {
          amount?: number
          concept?: string
          created_at?: string
          event_id?: string
          id?: string
          is_projection?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "event_costs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_staff: {
        Row: {
          created_at: string
          event_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_staff_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          age_min: number | null
          city: string
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          doors_open_at: string | null
          ends_at: string | null
          entry_conditions: string | null
          featured: boolean
          gallery: string[]
          id: string
          name: string
          organizer_id: string | null
          organizer_name: string | null
          province: string
          publish_at: string | null
          purchase_policy: string | null
          refund_policy: string | null
          replaced_by: string | null
          sales_paused: boolean
          service_fee_pct: number
          short_description: string | null
          slug: string
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          updated_at: string
          venue: string | null
        }
        Insert: {
          address?: string | null
          age_min?: number | null
          city?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          doors_open_at?: string | null
          ends_at?: string | null
          entry_conditions?: string | null
          featured?: boolean
          gallery?: string[]
          id?: string
          name: string
          organizer_id?: string | null
          organizer_name?: string | null
          province?: string
          publish_at?: string | null
          purchase_policy?: string | null
          refund_policy?: string | null
          replaced_by?: string | null
          sales_paused?: boolean
          service_fee_pct?: number
          short_description?: string | null
          slug: string
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
          venue?: string | null
        }
        Update: {
          address?: string | null
          age_min?: number | null
          city?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          doors_open_at?: string | null
          ends_at?: string | null
          entry_conditions?: string | null
          featured?: boolean
          gallery?: string[]
          id?: string
          name?: string
          organizer_id?: string | null
          organizer_name?: string | null
          province?: string
          publish_at?: string | null
          purchase_policy?: string | null
          refund_policy?: string | null
          replaced_by?: string | null
          sales_paused?: boolean
          service_fee_pct?: number
          short_description?: string | null
          slug?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_replaced_by_fkey"
            columns: ["replaced_by"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          category_id: string
          category_name: string
          id: string
          order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          category_id: string
          category_name: string
          id?: string
          order_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          category_id?: string
          category_name?: string
          id?: string
          order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ticket_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_dni: string | null
          buyer_email: string
          buyer_id: string
          buyer_name: string
          buyer_phone: string | null
          created_at: string
          currency: string
          event_id: string
          expires_at: string
          fee: number
          id: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          number: string
          paid_at: string | null
          payment_provider: string | null
          refunded_amount: number
          rrpp_commission: number
          rrpp_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          terms_accepted_at: string | null
          total: number
          updated_at: string
        }
        Insert: {
          buyer_dni?: string | null
          buyer_email: string
          buyer_id: string
          buyer_name: string
          buyer_phone?: string | null
          created_at?: string
          currency?: string
          event_id: string
          expires_at?: string
          fee?: number
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          number?: string
          paid_at?: string | null
          payment_provider?: string | null
          refunded_amount?: number
          rrpp_commission?: number
          rrpp_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          terms_accepted_at?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          buyer_dni?: string | null
          buyer_email?: string
          buyer_id?: string
          buyer_name?: string
          buyer_phone?: string | null
          created_at?: string
          currency?: string
          event_id?: string
          expires_at?: string
          fee?: number
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          number?: string
          paid_at?: string | null
          payment_provider?: string | null
          refunded_amount?: number
          rrpp_commission?: number
          rrpp_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          terms_accepted_at?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_rrpp_id_fkey"
            columns: ["rrpp_id"]
            isOneToOne: false
            referencedRelation: "rrpp"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          fee_amount: number
          id: string
          net_amount: number
          order_id: string
          provider: string
          provider_payment_id: string
          raw: Json | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency?: string
          fee_amount?: number
          id?: string
          net_amount?: number
          order_id: string
          provider: string
          provider_payment_id: string
          raw?: Json | null
          status: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          fee_amount?: number
          id?: string
          net_amount?: number
          order_id?: string
          provider?: string
          provider_payment_id?: string
          raw?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          dni: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          dni?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          dni?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      rrpp: {
        Row: {
          active: boolean
          code: string
          commission_pct: number
          created_at: string
          id: string
          name: string
          sales_goal: number | null
          user_id: string | null
        }
        Insert: {
          active?: boolean
          code: string
          commission_pct?: number
          created_at?: string
          id?: string
          name: string
          sales_goal?: number | null
          user_id?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          commission_pct?: number
          created_at?: string
          id?: string
          name?: string
          sales_goal?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      rrpp_payouts: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          rrpp_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          rrpp_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          rrpp_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rrpp_payouts_rrpp_id_fkey"
            columns: ["rrpp_id"]
            isOneToOne: false
            referencedRelation: "rrpp"
            referencedColumns: ["id"]
          },
        ]
      }
      scans: {
        Row: {
          code_tail: string | null
          event_id: string
          id: string
          operator_id: string
          reason: string
          result: string
          scanned_at: string
          ticket_id: string | null
        }
        Insert: {
          code_tail?: string | null
          event_id: string
          id?: string
          operator_id: string
          reason: string
          result: string
          scanned_at?: string
          ticket_id?: string | null
        }
        Update: {
          code_tail?: string | null
          event_id?: string
          id?: string
          operator_id?: string
          reason?: string
          result?: string
          scanned_at?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scans_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scans_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_categories: {
        Row: {
          benefits: string | null
          capacity: number
          created_at: string
          currency: string
          description: string | null
          event_id: string
          id: string
          max_per_order: number
          name: string
          price: number
          reserved: number
          restrictions: string | null
          sale_end: string | null
          sale_start: string | null
          sold: number
          sort_order: number
          status: string
          visibility: string
        }
        Insert: {
          benefits?: string | null
          capacity?: number
          created_at?: string
          currency?: string
          description?: string | null
          event_id: string
          id?: string
          max_per_order?: number
          name: string
          price?: number
          reserved?: number
          restrictions?: string | null
          sale_end?: string | null
          sale_start?: string | null
          sold?: number
          sort_order?: number
          status?: string
          visibility?: string
        }
        Update: {
          benefits?: string | null
          capacity?: number
          created_at?: string
          currency?: string
          description?: string | null
          event_id?: string
          id?: string
          max_per_order?: number
          name?: string
          price?: number
          reserved?: number
          restrictions?: string | null
          sale_end?: string | null
          sale_start?: string | null
          sold?: number
          sort_order?: number
          status?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_categories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          backup_code: string
          category_id: string
          category_name: string
          event_id: string
          holder_name: string | null
          id: string
          issued_at: string
          order_id: string
          qr_token: string
          status: Database["public"]["Enums"]["ticket_status"]
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          backup_code: string
          category_id: string
          category_name: string
          event_id: string
          holder_name?: string | null
          id?: string
          issued_at?: string
          order_id: string
          qr_token: string
          status?: Database["public"]["Enums"]["ticket_status"]
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          backup_code?: string
          category_id?: string
          category_name?: string
          event_id?: string
          holder_name?: string | null
          id?: string
          issued_at?: string
          order_id?: string
          qr_token?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ticket_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_assign_staff: {
        Args: { p_email: string; p_event_id: string }
        Returns: Json
      }
      admin_dashboard: {
        Args: { p_event?: string; p_from?: string; p_to?: string }
        Returns: Json
      }
      admin_link_rrpp_user: {
        Args: { p_email: string; p_rrpp_id: string }
        Returns: Json
      }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          roles: string[]
          user_id: string
        }[]
      }
      admin_set_role: {
        Args: {
          p_email: string
          p_grant: boolean
          p_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: Json
      }
      confirm_order_paid: {
        Args: {
          p_actor?: string
          p_amount: number
          p_fee: number
          p_order_id: string
          p_payment_id: string
          p_provider: string
          p_raw: Json
        }
        Returns: Json
      }
      create_order: {
        Args: {
          p_buyer: Json
          p_event_id: string
          p_items: Json
          p_rrpp_code?: string
        }
        Returns: string
      }
      duplicate_event: { Args: { p_event_id: string }; Returns: string }
      event_impact: { Args: { p_event_id: string }; Returns: Json }
      expire_pending_orders: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_order_refunded: {
        Args: { p_actor: string; p_amount: number; p_order_id: string }
        Returns: Json
      }
      rrpp_my_stats: { Args: never; Returns: Json }
      scan_ticket: {
        Args: { p_code: string; p_event_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "superadmin" | "organizador" | "rrpp" | "puerta" | "comprador"
      event_status:
        | "borrador"
        | "en_revision"
        | "programado"
        | "publicado"
        | "venta_activa"
        | "pausado"
        | "agotado"
        | "finalizado"
        | "suspendido"
        | "cancelado"
        | "archivado"
      order_status:
        | "pendiente"
        | "procesando"
        | "pagada"
        | "fallida"
        | "expirada"
        | "reembolsada_parcial"
        | "reembolsada"
      ticket_status:
        | "pendiente"
        | "valida"
        | "utilizada"
        | "anulada"
        | "reembolsada"
        | "bloqueada"
        | "transferida"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["superadmin", "organizador", "rrpp", "puerta", "comprador"],
      event_status: [
        "borrador",
        "en_revision",
        "programado",
        "publicado",
        "venta_activa",
        "pausado",
        "agotado",
        "finalizado",
        "suspendido",
        "cancelado",
        "archivado",
      ],
      order_status: [
        "pendiente",
        "procesando",
        "pagada",
        "fallida",
        "expirada",
        "reembolsada_parcial",
        "reembolsada",
      ],
      ticket_status: [
        "pendiente",
        "valida",
        "utilizada",
        "anulada",
        "reembolsada",
        "bloqueada",
        "transferida",
      ],
    },
  },
} as const
