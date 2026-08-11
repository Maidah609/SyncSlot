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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_user_connections: {
        Row: {
          connection_key_ciphertext: string
          connector_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_key_ciphertext: string
          connector_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_key_ciphertext?: string
          connector_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      booking_answers: {
        Row: {
          answer: string | null
          booking_id: string
          id: string
          question_id: string
        }
        Insert: {
          answer?: string | null
          booking_id: string
          id?: string
          question_id: string
        }
        Update: {
          answer?: string | null
          booking_id?: string
          id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_answers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "booking_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_questions: {
        Row: {
          event_type_id: string
          id: string
          label: string
          options: Json | null
          position: number
          required: boolean
          type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          event_type_id: string
          id?: string
          label: string
          options?: Json | null
          position?: number
          required?: boolean
          type?: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          event_type_id?: string
          id?: string
          label?: string
          options?: Json | null
          position?: number
          required?: boolean
          type?: Database["public"]["Enums"]["question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "booking_questions_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          cancellation_reason: string | null
          created_at: string
          end_at: string
          event_type_id: string
          google_event_id: string | null
          host_user_id: string
          id: string
          invitee_email: string
          invitee_name: string
          invitee_timezone: string
          meeting_url: string | null
          notes: string | null
          reschedule_token: string
          start_at: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          created_at?: string
          end_at: string
          event_type_id: string
          google_event_id?: string | null
          host_user_id: string
          id?: string
          invitee_email: string
          invitee_name: string
          invitee_timezone?: string
          meeting_url?: string | null
          notes?: string | null
          reschedule_token?: string
          start_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          created_at?: string
          end_at?: string
          event_type_id?: string
          google_event_id?: string | null
          host_user_id?: string
          id?: string
          invitee_email?: string
          invitee_name?: string
          invitee_timezone?: string
          meeting_url?: string | null
          notes?: string | null
          reschedule_token?: string
          start_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_accounts: {
        Row: {
          access_token: string | null
          account_email: string
          created_at: string
          expires_at: string | null
          id: string
          provider: string
          refresh_token: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_email: string
          created_at?: string
          expires_at?: string | null
          id?: string
          provider?: string
          refresh_token?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_email?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          provider?: string
          refresh_token?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      date_overrides: {
        Row: {
          date: string
          end_minute: number | null
          id: string
          is_blocked: boolean
          schedule_id: string
          start_minute: number | null
        }
        Insert: {
          date: string
          end_minute?: number | null
          id?: string
          is_blocked?: boolean
          schedule_id: string
          start_minute?: number | null
        }
        Update: {
          date?: string
          end_minute?: number | null
          id?: string
          is_blocked?: boolean
          schedule_id?: string
          start_minute?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "date_overrides_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      event_types: {
        Row: {
          buffer_after: number
          buffer_before: number
          color: string | null
          created_at: string
          daily_limit: number | null
          description: string | null
          duration_minutes: number
          event_date: string | null
          event_timezone: string | null
          id: string
          is_active: boolean
          location_type: Database["public"]["Enums"]["location_type"]
          location_value: string | null
          max_future_days: number
          min_notice_mins: number
          schedule_id: string | null
          slug: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          buffer_after?: number
          buffer_before?: number
          color?: string | null
          created_at?: string
          daily_limit?: number | null
          description?: string | null
          duration_minutes?: number
          event_date?: string | null
          event_timezone?: string | null
          id?: string
          is_active?: boolean
          location_type?: Database["public"]["Enums"]["location_type"]
          location_value?: string | null
          max_future_days?: number
          min_notice_mins?: number
          schedule_id?: string | null
          slug: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          buffer_after?: number
          buffer_before?: number
          color?: string | null
          created_at?: string
          daily_limit?: number | null
          description?: string | null
          duration_minutes?: number
          event_date?: string | null
          event_timezone?: string | null
          id?: string
          is_active?: boolean
          location_type?: Database["public"]["Enums"]["location_type"]
          location_value?: string | null
          max_future_days?: number
          min_notice_mins?: number
          schedule_id?: string | null
          slug?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_types_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_types_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          brand_color: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          onboarded: boolean
          plan: Database["public"]["Enums"]["plan"]
          timezone: string
          updated_at: string
          username: string | null
          welcome_message: string | null
        }
        Insert: {
          avatar_url?: string | null
          brand_color?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string
          onboarded?: boolean
          plan?: Database["public"]["Enums"]["plan"]
          timezone?: string
          updated_at?: string
          username?: string | null
          welcome_message?: string | null
        }
        Update: {
          avatar_url?: string | null
          brand_color?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          onboarded?: boolean
          plan?: Database["public"]["Enums"]["plan"]
          timezone?: string
          updated_at?: string
          username?: string | null
          welcome_message?: string | null
        }
        Relationships: []
      }
      schedule_rules: {
        Row: {
          day: Database["public"]["Enums"]["day_of_week"]
          end_minute: number
          id: string
          schedule_id: string
          start_minute: number
        }
        Insert: {
          day: Database["public"]["Enums"]["day_of_week"]
          end_minute: number
          id?: string
          schedule_id: string
          start_minute: number
        }
        Update: {
          day?: Database["public"]["Enums"]["day_of_week"]
          end_minute?: number
          id?: string
          schedule_id?: string
          start_minute?: number
        }
        Relationships: [
          {
            foreignKeyName: "schedule_rules_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          inviter_id: string
          role: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          inviter_id: string
          role?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          inviter_id?: string
          role?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          email: string
          id: string
          member_id: string
          name: string | null
          owner_id: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          member_id: string
          name?: string | null
          owner_id: string
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          member_id?: string
          name?: string | null
          owner_id?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_team_invite: { Args: { _token: string }; Returns: Json }
      attach_public_booking_event: {
        Args: { p_event_id: string; p_id: string; p_token: string }
        Returns: undefined
      }
      cancel_public_booking: {
        Args: { p_id: string; p_reason: string; p_token: string }
        Returns: undefined
      }
      create_public_booking: {
        Args: {
          p_end_at: string
          p_event_type_id: string
          p_invitee_email: string
          p_invitee_name: string
          p_invitee_timezone: string
          p_notes: string
          p_start_at: string
        }
        Returns: {
          id: string
          reschedule_token: string
        }[]
      }
      get_host_busy_times: {
        Args: { p_from: string; p_host: string; p_to: string }
        Returns: {
          end_at: string
          start_at: string
        }[]
      }
      get_public_booking: {
        Args: { p_id: string; p_token: string }
        Returns: {
          cancellation_reason: string
          end_at: string
          event_type_id: string
          google_event_id: string
          host_user_id: string
          id: string
          invitee_email: string
          invitee_name: string
          invitee_timezone: string
          notes: string
          start_at: string
          status: Database["public"]["Enums"]["booking_status"]
        }[]
      }
      reschedule_public_booking: {
        Args: { p_end: string; p_id: string; p_start: string; p_token: string }
        Returns: undefined
      }
      save_booking_answers: {
        Args: { p_answers: Json; p_booking_id: string; p_token: string }
        Returns: undefined
      }
    }
    Enums: {
      booking_status: "CONFIRMED" | "CANCELLED" | "RESCHEDULED"
      day_of_week: "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT"
      location_type: "GOOGLE_MEET" | "ZOOM" | "PHONE" | "IN_PERSON" | "CUSTOM"
      plan: "FREE" | "PRO" | "TEAM"
      question_type: "TEXT" | "MULTI_CHOICE" | "YES_NO"
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
      booking_status: ["CONFIRMED", "CANCELLED", "RESCHEDULED"],
      day_of_week: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
      location_type: ["GOOGLE_MEET", "ZOOM", "PHONE", "IN_PERSON", "CUSTOM"],
      plan: ["FREE", "PRO", "TEAM"],
      question_type: ["TEXT", "MULTI_CHOICE", "YES_NO"],
    },
  },
} as const
