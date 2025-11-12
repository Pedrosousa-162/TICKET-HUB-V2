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
      users: {
        Row: {
          id: string
          email: string
          username: string
          full_name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          full_name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          full_name?: string
          avatar_url?: string | null
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          slug: string
          description: string
          event_date: string
          event_time: string
          location: string
          category: string
          base_price: number
          image_url: string | null
          organizer_id: string
          association_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description: string
          event_date: string
          event_time: string
          location: string
          category: string
          base_price: number
          image_url?: string | null
          organizer_id: string
          association_code: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          slug?: string
          description?: string
          event_date?: string
          event_time?: string
          location?: string
          category?: string
          base_price?: number
          image_url?: string | null
          updated_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          event_id: string
          name: string
          description: string | null
          price: number
          stock: number
          sold: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          description?: string | null
          price: number
          stock: number
          sold?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          price?: number
          stock?: number
          sold?: number
          updated_at?: string
        }
      }
      event_users: {
        Row: {
          id: string
          event_id: string
          user_id: string
          role: 'organizer' | 'collaborator' | 'team_member' | 'volunteer'
          unique_link: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          role: 'organizer' | 'collaborator' | 'team_member' | 'volunteer'
          unique_link?: string | null
          joined_at?: string
        }
        Update: {
          role?: 'organizer' | 'collaborator' | 'team_member' | 'volunteer'
        }
      }
      event_user_stats: {
        Row: {
          id: string
          event_id: string
          user_id: string
          views: number
          sales: number
          revenue: number
          conversion_rate: number
          last_sale_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          views?: number
          sales?: number
          revenue?: number
          conversion_rate?: number
          last_sale_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          views?: number
          sales?: number
          revenue?: number
          conversion_rate?: number
          last_sale_at?: string | null
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          event_id: string
          ticket_id: string
          buyer_email: string
          buyer_name: string
          quantity: number
          total_amount: number
          seller_id: string | null
          unique_link: string | null
          status: 'completed' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          ticket_id: string
          buyer_email: string
          buyer_name: string
          quantity: number
          total_amount: number
          seller_id?: string | null
          unique_link?: string | null
          status?: 'completed' | 'cancelled'
          created_at?: string
        }
        Update: {
          status?: 'completed' | 'cancelled'
        }
      }
    }
  }
}
