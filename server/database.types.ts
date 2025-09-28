/**
 * Database Types for Supabase
 *
 * These types match the Supabase database schema
 * Used by the Supabase client for type safety
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          email: string
          name: string | null
          role: 'admin' | 'content_manager' | 'viewer'
          is_active: boolean
          account_status: 'active' | 'suspended' | 'pending_verification'
          created_at: string
          updated_at: string
          last_sign_in_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          email: string
          name?: string | null
          role?: 'admin' | 'content_manager' | 'viewer'
          is_active?: boolean
          account_status?: 'active' | 'suspended' | 'pending_verification'
          created_at?: string
          updated_at?: string
          last_sign_in_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          email?: string
          name?: string | null
          role?: 'admin' | 'content_manager' | 'viewer'
          is_active?: boolean
          account_status?: 'active' | 'suspended' | 'pending_verification'
          created_at?: string
          updated_at?: string
          last_sign_in_at?: string | null
        }
      }
      ports: {
        Row: {
          id: string
          name: string
          country: string
          coordinates: string | null
          description: string | null
          image_url: string | null
          port_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          country: string
          coordinates?: string | null
          description?: string | null
          image_url?: string | null
          port_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          country?: string
          coordinates?: string | null
          description?: string | null
          image_url?: string | null
          port_type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ships: {
        Row: {
          id: string
          name: string
          cruise_line: string
          capacity: number | null
          year_built: number | null
          tonnage: number | null
          length: number | null
          beam: number | null
          decks: number | null
          crew: number | null
          description: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          cruise_line: string
          capacity?: number | null
          year_built?: number | null
          tonnage?: number | null
          length?: number | null
          beam?: number | null
          decks?: number | null
          crew?: number | null
          description?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          cruise_line?: string
          capacity?: number | null
          year_built?: number | null
          tonnage?: number | null
          length?: number | null
          beam?: number | null
          decks?: number | null
          crew?: number | null
          description?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      parties: {
        Row: {
          id: string
          name: string
          day: number
          start_time: string
          end_time: string
          location: string
          description: string | null
          hero_image: string | null
          deck_level: string | null
          is_poolside: boolean
          capacity: number | null
          created_at: string
          updated_at: string
          theme_id: string | null
        }
        Insert: {
          id?: string
          name: string
          day: number
          start_time: string
          end_time: string
          location: string
          description?: string | null
          hero_image?: string | null
          deck_level?: string | null
          is_poolside?: boolean
          capacity?: number | null
          created_at?: string
          updated_at?: string
          theme_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          day?: number
          start_time?: string
          end_time?: string
          location?: string
          description?: string | null
          hero_image?: string | null
          deck_level?: string | null
          is_poolside?: boolean
          capacity?: number | null
          created_at?: string
          updated_at?: string
          theme_id?: string | null
        }
      }
      party_themes: {
        Row: {
          id: string
          name: string
          description: string | null
          color_scheme: string | null
          icon: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color_scheme?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color_scheme?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cruises: {
        Row: {
          id: string
          name: string
          description: string | null
          duration: number
          price: number
          available_spots: number
          status: 'draft' | 'published' | 'archived'
          departure_port_id: string | null
          arrival_port_id: string | null
          ship_id: string | null
          hero_image: string | null
          created_at: string
          updated_at: string
          start_date: string
          end_date: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          duration: number
          price: number
          available_spots: number
          status?: 'draft' | 'published' | 'archived'
          departure_port_id?: string | null
          arrival_port_id?: string | null
          ship_id?: string | null
          hero_image?: string | null
          created_at?: string
          updated_at?: string
          start_date: string
          end_date: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          duration?: number
          price?: number
          available_spots?: number
          status?: 'draft' | 'published' | 'archived'
          departure_port_id?: string | null
          arrival_port_id?: string | null
          ship_id?: string | null
          hero_image?: string | null
          created_at?: string
          updated_at?: string
          start_date?: string
          end_date?: string
        }
      }
    }
  }
}