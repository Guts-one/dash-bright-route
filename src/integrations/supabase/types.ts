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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          created_at: string
          geofence_radius_m: number
          id: string
          lat: number
          lng: number
          name: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          geofence_radius_m?: number
          id?: string
          lat: number
          lng: number
          name: string
        }
        Update: {
          address?: string | null
          created_at?: string
          geofence_radius_m?: number
          id?: string
          lat?: number
          lng?: number
          name?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          completed_ts: string | null
          created_at: string
          customer_id: string
          delay_reason: string | null
          driver_id: string | null
          id: string
          issue_category: string | null
          issue_notes: string | null
          route_id: string
          signature_url: string | null
          status: string
          stop_order: number
          truck_id: string
        }
        Insert: {
          completed_ts?: string | null
          created_at?: string
          customer_id: string
          delay_reason?: string | null
          driver_id?: string | null
          id?: string
          issue_category?: string | null
          issue_notes?: string | null
          route_id: string
          signature_url?: string | null
          status?: string
          stop_order?: number
          truck_id: string
        }
        Update: {
          completed_ts?: string | null
          created_at?: string
          customer_id?: string
          delay_reason?: string | null
          driver_id?: string | null
          id?: string
          issue_category?: string | null
          issue_notes?: string | null
          route_id?: string
          signature_url?: string | null
          status?: string
          stop_order?: number
          truck_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      gps_events: {
        Row: {
          id: string
          lat: number
          lng: number
          speed: number | null
          truck_id: string
          ts: string
        }
        Insert: {
          id?: string
          lat: number
          lng: number
          speed?: number | null
          truck_id: string
          ts?: string
        }
        Update: {
          id?: string
          lat?: number
          lng?: number
          speed?: number | null
          truck_id?: string
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "gps_events_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_alerts: {
        Row: {
          created_ts: string
          id: string
          message: string
          resolved_ts: string | null
          rule_id: string
          severity: string
          truck_id: string
        }
        Insert: {
          created_ts?: string
          id?: string
          message: string
          resolved_ts?: string | null
          rule_id: string
          severity: string
          truck_id: string
        }
        Update: {
          created_ts?: string
          id?: string
          message?: string
          resolved_ts?: string | null
          rule_id?: string
          severity?: string
          truck_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_alerts_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "maintenance_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_alerts_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_rules: {
        Row: {
          created_at: string
          id: string
          interval_days: number
          interval_km: number
          last_service_date: string
          last_service_km: number
          truck_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          interval_days: number
          interval_km: number
          last_service_date?: string
          last_service_km?: number
          truck_id: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          interval_days?: number
          interval_km?: number
          last_service_date?: string
          last_service_km?: number
          truck_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_rules_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      route_deviation_events: {
        Row: {
          end_ts: string | null
          id: string
          max_distance_m: number
          notes: string | null
          route_id: string
          start_ts: string
          truck_id: string
        }
        Insert: {
          end_ts?: string | null
          id?: string
          max_distance_m?: number
          notes?: string | null
          route_id: string
          start_ts?: string
          truck_id: string
        }
        Update: {
          end_ts?: string | null
          id?: string
          max_distance_m?: number
          notes?: string | null
          route_id?: string
          start_ts?: string
          truck_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_deviation_events_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_deviation_events_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          created_at: string
          date: string
          id: string
          planned_path: Json
          truck_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          planned_path?: Json
          truck_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          planned_path?: Json
          truck_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      trucks: {
        Row: {
          created_at: string
          driver_id: string | null
          fuel_used_l: number | null
          id: string
          last_lat: number | null
          last_lng: number | null
          last_speed: number | null
          last_update_ts: string | null
          name: string
          odometer_km: number | null
          plate: string
        }
        Insert: {
          created_at?: string
          driver_id?: string | null
          fuel_used_l?: number | null
          id?: string
          last_lat?: number | null
          last_lng?: number | null
          last_speed?: number | null
          last_update_ts?: string | null
          name: string
          odometer_km?: number | null
          plate: string
        }
        Update: {
          created_at?: string
          driver_id?: string | null
          fuel_used_l?: number | null
          id?: string
          last_lat?: number | null
          last_lng?: number | null
          last_speed?: number | null
          last_update_ts?: string | null
          name?: string
          odometer_km?: number | null
          plate?: string
        }
        Relationships: []
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "manager" | "driver"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["manager", "driver"],
    },
  },
} as const
