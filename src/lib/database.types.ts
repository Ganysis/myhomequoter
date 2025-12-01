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
      niches: {
        Row: {
          id: string
          slug: string
          name: string
          price_per_lead: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          price_per_lead: number
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          price_per_lead?: number
          created_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          niche_id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          address: string | null
          city: string
          state: string
          zip_code: string
          project_type: string
          timeline: string
          budget_range: string | null
          property_type: string
          additional_info: string | null
          source_url: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          ip_address: string | null
          user_agent: string | null
          status: 'available' | 'claimed' | 'sold' | 'invalid'
          quality_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          niche_id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          address?: string | null
          city: string
          state: string
          zip_code: string
          project_type: string
          timeline: string
          budget_range?: string | null
          property_type: string
          additional_info?: string | null
          source_url?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          ip_address?: string | null
          user_agent?: string | null
          status?: 'available' | 'claimed' | 'sold' | 'invalid'
          quality_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          niche_id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          address?: string | null
          city?: string
          state?: string
          zip_code?: string
          project_type?: string
          timeline?: string
          budget_range?: string | null
          property_type?: string
          additional_info?: string | null
          source_url?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          ip_address?: string | null
          user_agent?: string | null
          status?: 'available' | 'claimed' | 'sold' | 'invalid'
          quality_score?: number | null
          created_at?: string
        }
      }
      buyers: {
        Row: {
          id: string
          user_id: string
          company_name: string
          contact_name: string
          email: string
          phone: string | null
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
          target_niches: string[]
          target_states: string[]
          target_cities: string[] | null
          max_leads_per_day: number | null
          status: 'pending' | 'active' | 'paused' | 'suspended'
          verified_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          contact_name: string
          email: string
          phone?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          target_niches?: string[]
          target_states?: string[]
          target_cities?: string[] | null
          max_leads_per_day?: number | null
          status?: 'pending' | 'active' | 'paused' | 'suspended'
          verified_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          contact_name?: string
          email?: string
          phone?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          target_niches?: string[]
          target_states?: string[]
          target_cities?: string[] | null
          max_leads_per_day?: number | null
          status?: 'pending' | 'active' | 'paused' | 'suspended'
          verified_at?: string | null
          created_at?: string
        }
      }
      lead_claims: {
        Row: {
          id: string
          lead_id: string
          buyer_id: string
          price: number
          invoice_id: string | null
          billed_at: string | null
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          buyer_id: string
          price: number
          invoice_id?: string | null
          billed_at?: string | null
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          buyer_id?: string
          price?: number
          invoice_id?: string | null
          billed_at?: string | null
          paid_at?: string | null
          created_at?: string
        }
      }
      articles: {
        Row: {
          id: string
          niche_id: string
          slug: string
          title: string
          meta_description: string | null
          content: string
          target_keywords: string[]
          target_city: string | null
          target_state: string | null
          status: 'draft' | 'review' | 'published' | 'archived'
          published_at: string | null
          ai_generated: boolean
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          niche_id: string
          slug: string
          title: string
          meta_description?: string | null
          content: string
          target_keywords?: string[]
          target_city?: string | null
          target_state?: string | null
          status?: 'draft' | 'review' | 'published' | 'archived'
          published_at?: string | null
          ai_generated?: boolean
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          niche_id?: string
          slug?: string
          title?: string
          meta_description?: string | null
          content?: string
          target_keywords?: string[]
          target_city?: string | null
          target_state?: string | null
          status?: 'draft' | 'review' | 'published' | 'archived'
          published_at?: string | null
          ai_generated?: boolean
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      us_cities: {
        Row: {
          id: number
          city: string
          state: string
          state_code: string
          population: number
          latitude: number
          longitude: number
        }
        Insert: {
          id?: number
          city: string
          state: string
          state_code: string
          population: number
          latitude: number
          longitude: number
        }
        Update: {
          id?: number
          city?: string
          state?: string
          state_code?: string
          population?: number
          latitude?: number
          longitude?: number
        }
      }
    }
  }
}
