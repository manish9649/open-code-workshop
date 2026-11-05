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
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          cause: string
          created_at: string
          donor_name: string
          email: string
          id: string
          notes: string
          payment_method: string
          phone: string
          status: Database["public"]["Enums"]["donation_status"]
          transaction_ref: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          cause?: string
          created_at?: string
          donor_name: string
          email?: string
          id?: string
          notes?: string
          payment_method?: string
          phone?: string
          status?: Database["public"]["Enums"]["donation_status"]
          transaction_ref?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          cause?: string
          created_at?: string
          donor_name?: string
          email?: string
          id?: string
          notes?: string
          payment_method?: string
          phone?: string
          status?: Database["public"]["Enums"]["donation_status"]
          transaction_ref?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      gallery_albums: {
        Row: {
          category_id: string | null
          cover_photo_id: string | null
          created_at: string
          description: string
          event_date: string | null
          featured: boolean
          id: string
          location: string
          published: boolean
          title: string
        }
        Insert: {
          category_id?: string | null
          cover_photo_id?: string | null
          created_at?: string
          description?: string
          event_date?: string | null
          featured?: boolean
          id?: string
          location?: string
          published?: boolean
          title?: string
        }
        Update: {
          category_id?: string | null
          cover_photo_id?: string | null
          created_at?: string
          description?: string
          event_date?: string | null
          featured?: boolean
          id?: string
          location?: string
          published?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_albums_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gallery_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_albums_cover_fkey"
            columns: ["cover_photo_id"]
            isOneToOne: false
            referencedRelation: "gallery_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_categories: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      gallery_photos: {
        Row: {
          album_id: string
          caption: string
          created_at: string
          height: number | null
          id: string
          sort_order: number
          storage_path: string
          width: number | null
        }
        Insert: {
          album_id: string
          caption?: string
          created_at?: string
          height?: number | null
          id?: string
          sort_order?: number
          storage_path: string
          width?: number | null
        }
        Update: {
          album_id?: string
          caption?: string
          created_at?: string
          height?: number | null
          id?: string
          sort_order?: number
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "gallery_albums"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: string
          certificate_design_version: number
          certificate_number: string
          certificate_path: string
          created_at: string
          created_by: string
          date_of_birth: string
          email: string
          father_name: string
          full_name: string
          id: string
          joining_date: string
          membership_type: string
          mobile: string
          notes: string
          photo_path: string
          signatory_name: string
          signature_path: string
          status: string
          updated_at: string
        }
        Insert: {
          address: string
          certificate_design_version?: number
          certificate_number?: string
          certificate_path?: string
          created_at?: string
          created_by?: string
          date_of_birth: string
          email: string
          father_name: string
          full_name: string
          id?: string
          joining_date: string
          membership_type?: string
          mobile: string
          notes?: string
          photo_path: string
          signatory_name: string
          signature_path: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string
          certificate_design_version?: number
          certificate_number?: string
          certificate_path?: string
          created_at?: string
          created_by?: string
          date_of_birth?: string
          email?: string
          father_name?: string
          full_name?: string
          id?: string
          joining_date?: string
          membership_type?: string
          mobile?: string
          notes?: string
          photo_path?: string
          signatory_name?: string
          signature_path?: string
          status?: string
          updated_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      verify_membership_certificate: {
        Args: { certificate: string }
        Returns: {
          certificate_number: string
          full_name: string
          issue_date: string
          joining_date: string
          status: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      donation_status: "pending" | "verified" | "failed" | "refunded"
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
      app_role: ["admin", "moderator", "user"],
      donation_status: ["pending", "verified", "failed", "refunded"],
    },
  },
} as const
