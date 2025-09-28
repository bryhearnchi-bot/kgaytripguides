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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      amenities: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          date: string
          id: number
          party_theme_id: number | null
          talent_ids: Json | null
          time: string
          title: string
          trip_id: number
          type: string
          updated_at: string | null
          venue: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: number
          party_theme_id?: number | null
          talent_ids?: Json | null
          time: string
          title: string
          trip_id: number
          type: string
          updated_at?: string | null
          venue: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: number
          party_theme_id?: number | null
          talent_ids?: Json | null
          time?: string
          title?: string
          trip_id?: number
          type?: string
          updated_at?: string | null
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_party_theme_id_fkey"
            columns: ["party_theme_id"]
            isOneToOne: false
            referencedRelation: "party_themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          metadata: Json | null
          role: string
          salt: string
          token_hash: string
          trip_id: number | null
          used: boolean | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by: string
          metadata?: Json | null
          role: string
          salt: string
          token_hash: string
          trip_id?: number | null
          used?: boolean | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          metadata?: Json | null
          role?: string
          salt?: string
          token_hash?: string
          trip_id?: number | null
          used?: boolean | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary: {
        Row: {
          all_aboard_time: string | null
          arrival_time: string | null
          date: string
          day: number
          departure_time: string | null
          description: string | null
          highlights: Json | null
          id: number
          location_id: number | null
          location_image_url: string | null
          location_name: string
          location_type_id: number
          order_index: number
          segment: string | null
          trip_id: number
        }
        Insert: {
          all_aboard_time?: string | null
          arrival_time?: string | null
          date: string
          day: number
          departure_time?: string | null
          description?: string | null
          highlights?: Json | null
          id?: number
          location_id?: number | null
          location_image_url?: string | null
          location_name: string
          location_type_id: number
          order_index: number
          segment?: string | null
          trip_id: number
        }
        Update: {
          all_aboard_time?: string | null
          arrival_time?: string | null
          date?: string
          day?: number
          departure_time?: string | null
          description?: string | null
          highlights?: Json | null
          id?: number
          location_id?: number | null
          location_image_url?: string | null
          location_name?: string
          location_type_id?: number
          order_index?: number
          segment?: string | null
          trip_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_location_type_id_fkey"
            columns: ["location_type_id"]
            isOneToOne: false
            referencedRelation: "location_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      location_types: {
        Row: {
          created_at: string | null
          id: number
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          coordinates: Json | null
          country: string
          created_at: string | null
          description: string | null
          id: number
          image_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          coordinates?: Json | null
          country: string
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          coordinates?: Json | null
          country?: string
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      party_themes: {
        Row: {
          amazon_shopping_list_url: string | null
          costume_ideas: string | null
          created_at: string | null
          id: number
          image_url: string | null
          long_description: string | null
          name: string
          short_description: string | null
          updated_at: string | null
        }
        Insert: {
          amazon_shopping_list_url?: string | null
          costume_ideas?: string | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          long_description?: string | null
          name: string
          short_description?: string | null
          updated_at?: string | null
        }
        Update: {
          amazon_shopping_list_url?: string | null
          costume_ideas?: string | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          long_description?: string | null
          name?: string
          short_description?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string | null
          avatar_url: string | null
          bio: string | null
          communication_preferences: Json | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_sign_in_at: string | null
          location: Json | null
          marketing_emails: boolean | null
          name: Json | null
          phone_number: string | null
          role: string | null
          social_links: Json | null
          trip_updates_opt_in: boolean | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          account_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          communication_preferences?: Json | null
          created_at?: string | null
          email: string
          id: string
          is_active?: boolean | null
          last_sign_in_at?: string | null
          location?: Json | null
          marketing_emails?: boolean | null
          name?: Json | null
          phone_number?: string | null
          role?: string | null
          social_links?: Json | null
          trip_updates_opt_in?: boolean | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          account_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          communication_preferences?: Json | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_sign_in_at?: string | null
          location?: Json | null
          marketing_emails?: boolean | null
          name?: Json | null
          phone_number?: string | null
          role?: string | null
          social_links?: Json | null
          trip_updates_opt_in?: boolean | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      resort_amenities: {
        Row: {
          amenity_id: number
          resort_id: number
        }
        Insert: {
          amenity_id: number
          resort_id: number
        }
        Update: {
          amenity_id?: number
          resort_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "resort_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resort_amenities_resort_id_fkey"
            columns: ["resort_id"]
            isOneToOne: false
            referencedRelation: "resorts"
            referencedColumns: ["id"]
          },
        ]
      }
      resort_venues: {
        Row: {
          resort_id: number
          venue_id: number
        }
        Insert: {
          resort_id: number
          venue_id: number
        }
        Update: {
          resort_id?: number
          venue_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "resort_venues_resort_id_fkey"
            columns: ["resort_id"]
            isOneToOne: false
            referencedRelation: "resorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resort_venues_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      resorts: {
        Row: {
          capacity: number | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string | null
          description: string | null
          id: number
          image_url: string | null
          location: string
          name: string
          property_map_url: string | null
          room_count: number | null
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          location: string
          name: string
          property_map_url?: string | null
          room_count?: number | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          location?: string
          name?: string
          property_map_url?: string | null
          room_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ship_amenities: {
        Row: {
          amenity_id: number
          ship_id: number
        }
        Insert: {
          amenity_id: number
          ship_id: number
        }
        Update: {
          amenity_id?: number
          ship_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ship_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ship_amenities_ship_id_fkey"
            columns: ["ship_id"]
            isOneToOne: false
            referencedRelation: "ships"
            referencedColumns: ["id"]
          },
        ]
      }
      ship_venues: {
        Row: {
          ship_id: number
          venue_id: number
        }
        Insert: {
          ship_id: number
          venue_id: number
        }
        Update: {
          ship_id?: number
          venue_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ship_venues_ship_id_fkey"
            columns: ["ship_id"]
            isOneToOne: false
            referencedRelation: "ships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ship_venues_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      ships: {
        Row: {
          capacity: number | null
          created_at: string | null
          cruise_line: string
          deck_plans_url: string | null
          decks: number | null
          description: string | null
          id: number
          image_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          cruise_line: string
          deck_plans_url?: string | null
          decks?: number | null
          description?: string | null
          id?: number
          image_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          cruise_line?: string
          deck_plans_url?: string | null
          decks?: number | null
          description?: string | null
          id?: number
          image_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      talent: {
        Row: {
          bio: string | null
          created_at: string | null
          id: number
          known_for: string | null
          name: string
          profile_image_url: string | null
          social_links: Json | null
          talent_category_id: number
          updated_at: string | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          id?: number
          known_for?: string | null
          name: string
          profile_image_url?: string | null
          social_links?: Json | null
          talent_category_id: number
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          id?: number
          known_for?: string | null
          name?: string
          profile_image_url?: string | null
          social_links?: Json | null
          talent_category_id?: number
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_talent_category_id_fkey"
            columns: ["talent_category_id"]
            isOneToOne: false
            referencedRelation: "talent_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_categories: {
        Row: {
          category: string
          created_at: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      trip_info_sections: {
        Row: {
          content: string | null
          id: number
          order_index: number
          title: string
          trip_id: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          content?: string | null
          id?: number
          order_index: number
          title: string
          trip_id: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          content?: string | null
          id?: number
          order_index?: number
          title?: string
          trip_id?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_info_sections_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_status: {
        Row: {
          created_at: string | null
          id: number
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      trip_talent: {
        Row: {
          created_at: string | null
          notes: string | null
          performance_count: number | null
          role: string | null
          talent_id: number
          trip_id: number
        }
        Insert: {
          created_at?: string | null
          notes?: string | null
          performance_count?: number | null
          role?: string | null
          talent_id: number
          trip_id: number
        }
        Update: {
          created_at?: string | null
          notes?: string | null
          performance_count?: number | null
          role?: string | null
          talent_id?: number
          trip_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "trip_talent_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_talent_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_types: {
        Row: {
          created_at: string | null
          id: number
          trip_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          trip_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          trip_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      trips: {
        Row: {
          created_at: string | null
          created_by: string | null
          cruise_line: string | null
          description: string | null
          end_date: string
          hero_image_url: string | null
          highlights: Json | null
          id: number
          includes_info: Json | null
          name: string
          pricing: Json | null
          resort_id: number | null
          ship_id: number | null
          ship_name: string
          slug: string
          start_date: string
          status: string | null
          trip_status_id: number
          trip_type_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          cruise_line?: string | null
          description?: string | null
          end_date: string
          hero_image_url?: string | null
          highlights?: Json | null
          id?: number
          includes_info?: Json | null
          name: string
          pricing?: Json | null
          resort_id?: number | null
          ship_id?: number | null
          ship_name: string
          slug: string
          start_date: string
          status?: string | null
          trip_status_id: number
          trip_type_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          cruise_line?: string | null
          description?: string | null
          end_date?: string
          hero_image_url?: string | null
          highlights?: Json | null
          id?: number
          includes_info?: Json | null
          name?: string
          pricing?: Json | null
          resort_id?: number | null
          ship_id?: number | null
          ship_name?: string
          slug?: string
          start_date?: string
          status?: string | null
          trip_status_id?: number
          trip_type_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_resort_id_fkey"
            columns: ["resort_id"]
            isOneToOne: false
            referencedRelation: "resorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_ship_id_fkey"
            columns: ["ship_id"]
            isOneToOne: false
            referencedRelation: "ships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_trip_status_id_fkey"
            columns: ["trip_status_id"]
            isOneToOne: false
            referencedRelation: "trip_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_trip_type_id_fkey"
            columns: ["trip_type_id"]
            isOneToOne: false
            referencedRelation: "trip_types"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_types: {
        Row: {
          created_at: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      venues: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          updated_at: string | null
          venue_type_id: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          updated_at?: string | null
          venue_type_id: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          updated_at?: string | null
          venue_type_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "venues_venue_type_id_fkey"
            columns: ["venue_type_id"]
            isOneToOne: false
            referencedRelation: "venue_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_dashboard_stats: {
        Row: {
          entity_type: string | null
          metric_1: number | null
          metric_2: number | null
          metric_3: number | null
          total_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cancel_invitation: {
        Args: { p_invitation_id: string }
        Returns: boolean
      }
      cleanup_expired_invitations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      consume_invitation: {
        Args: { p_invitation_id: string; p_user_id: string }
        Returns: boolean
      }
      count_profiles_estimated: {
        Args: {
          filter_active?: boolean
          filter_role?: string
          search_term?: string
        }
        Returns: number
      }
      create_user_invitation: {
        Args: {
          p_email: string
          p_first_name: string
          p_last_name: string
          p_message?: string
          p_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: {
          expires_at: string
          invitation_id: string
          token: string
        }[]
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: {
          hash: string
          salt: string
          token: string
        }[]
      }
      get_invitation_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_invitations: number
          conversion_rate: number
          expired_invitations: number
          total_invitations: number
          used_invitations: number
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_moderator: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      resend_invitation: {
        Args: { p_invitation_id: string }
        Returns: {
          expires_at: string
          token: string
        }[]
      }
      search_profiles_optimized: {
        Args: {
          filter_active?: boolean
          filter_role?: string
          page_limit?: number
          page_offset?: number
          search_term?: string
        }
        Returns: {
          account_status: string
          created_at: string
          email: string
          first_name: string
          last_name: string
          id: string
          is_active: boolean
          last_sign_in_at: string
          role: string
          search_rank: number
          updated_at: string
          username: string
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      update_user_role: {
        Args: { new_role: string; target_user_id: string }
        Returns: undefined
      }
      validate_invitation_token: {
        Args:
          | { p_email: string; p_salt: string; p_token_hash: string }
          | { p_token: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "user" | "editor"
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
      user_role: ["admin", "user", "editor"],
    },
  },
} as const

// Frontend-friendly type definitions with camelCase fields
export type Profile = Tables<'profiles'>;
export type Trip = {
  id: number;
  name: string;
  slug: string;
  shipName: string;
  cruiseLine: string | null;
  tripType?: string;
  startDate: string;
  endDate: string;
  status: string | null;
  heroImageUrl: string | null;
  description: string | null;
  highlights: string[] | null;
  createdAt: string | null;
  updatedAt: string | null;
};
export type Itinerary = Tables<'itinerary'>;
export type Event = Tables<'events'>;
export type Talent = Tables<'talent'>;
export type TalentCategory = Tables<'talent_categories'>;
export type Settings = Tables<'settings'>;