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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ball_by_ball: {
        Row: {
          ball_number: number
          batter_id: string | null
          bowler_id: string | null
          created_at: string
          dismissal_type: Database["public"]["Enums"]["dismissal_type"] | null
          dismissed_player_id: string | null
          fielder_id: string | null
          id: string
          innings_id: string
          is_bye: boolean
          is_leg_bye: boolean
          is_no_ball: boolean
          is_wicket: boolean
          is_wide: boolean
          over_number: number
          runs_scored: number
        }
        Insert: {
          ball_number: number
          batter_id?: string | null
          bowler_id?: string | null
          created_at?: string
          dismissal_type?: Database["public"]["Enums"]["dismissal_type"] | null
          dismissed_player_id?: string | null
          fielder_id?: string | null
          id?: string
          innings_id: string
          is_bye?: boolean
          is_leg_bye?: boolean
          is_no_ball?: boolean
          is_wicket?: boolean
          is_wide?: boolean
          over_number: number
          runs_scored?: number
        }
        Update: {
          ball_number?: number
          batter_id?: string | null
          bowler_id?: string | null
          created_at?: string
          dismissal_type?: Database["public"]["Enums"]["dismissal_type"] | null
          dismissed_player_id?: string | null
          fielder_id?: string | null
          id?: string
          innings_id?: string
          is_bye?: boolean
          is_leg_bye?: boolean
          is_no_ball?: boolean
          is_wicket?: boolean
          is_wide?: boolean
          over_number?: number
          runs_scored?: number
        }
        Relationships: [
          {
            foreignKeyName: "ball_by_ball_batter_id_fkey"
            columns: ["batter_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ball_by_ball_batter_id_fkey"
            columns: ["batter_id"]
            isOneToOne: false
            referencedRelation: "team_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ball_by_ball_bowler_id_fkey"
            columns: ["bowler_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ball_by_ball_bowler_id_fkey"
            columns: ["bowler_id"]
            isOneToOne: false
            referencedRelation: "team_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ball_by_ball_dismissed_player_id_fkey"
            columns: ["dismissed_player_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ball_by_ball_dismissed_player_id_fkey"
            columns: ["dismissed_player_id"]
            isOneToOne: false
            referencedRelation: "team_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ball_by_ball_fielder_id_fkey"
            columns: ["fielder_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ball_by_ball_fielder_id_fkey"
            columns: ["fielder_id"]
            isOneToOne: false
            referencedRelation: "team_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ball_by_ball_innings_id_fkey"
            columns: ["innings_id"]
            isOneToOne: false
            referencedRelation: "innings"
            referencedColumns: ["id"]
          },
        ]
      }
      batting_stats: {
        Row: {
          balls_faced: number
          batting_position: number | null
          bowler_id: string | null
          created_at: string
          dismissal_type: Database["public"]["Enums"]["dismissal_type"] | null
          fielder_id: string | null
          fours: number
          id: string
          innings_id: string
          is_out: boolean
          player_id: string
          runs: number
          sixes: number
          updated_at: string
        }
        Insert: {
          balls_faced?: number
          batting_position?: number | null
          bowler_id?: string | null
          created_at?: string
          dismissal_type?: Database["public"]["Enums"]["dismissal_type"] | null
          fielder_id?: string | null
          fours?: number
          id?: string
          innings_id: string
          is_out?: boolean
          player_id: string
          runs?: number
          sixes?: number
          updated_at?: string
        }
        Update: {
          balls_faced?: number
          batting_position?: number | null
          bowler_id?: string | null
          created_at?: string
          dismissal_type?: Database["public"]["Enums"]["dismissal_type"] | null
          fielder_id?: string | null
          fours?: number
          id?: string
          innings_id?: string
          is_out?: boolean
          player_id?: string
          runs?: number
          sixes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batting_stats_bowler_id_fkey"
            columns: ["bowler_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batting_stats_bowler_id_fkey"
            columns: ["bowler_id"]
            isOneToOne: false
            referencedRelation: "team_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batting_stats_fielder_id_fkey"
            columns: ["fielder_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batting_stats_fielder_id_fkey"
            columns: ["fielder_id"]
            isOneToOne: false
            referencedRelation: "team_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batting_stats_innings_id_fkey"
            columns: ["innings_id"]
            isOneToOne: false
            referencedRelation: "innings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batting_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batting_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      bowling_stats: {
        Row: {
          created_at: string
          id: string
          innings_id: string
          maidens: number
          no_balls: number
          overs: number
          player_id: string
          runs_conceded: number
          updated_at: string
          wickets: number
          wides: number
        }
        Insert: {
          created_at?: string
          id?: string
          innings_id: string
          maidens?: number
          no_balls?: number
          overs?: number
          player_id: string
          runs_conceded?: number
          updated_at?: string
          wickets?: number
          wides?: number
        }
        Update: {
          created_at?: string
          id?: string
          innings_id?: string
          maidens?: number
          no_balls?: number
          overs?: number
          player_id?: string
          runs_conceded?: number
          updated_at?: string
          wickets?: number
          wides?: number
        }
        Relationships: [
          {
            foreignKeyName: "bowling_stats_innings_id_fkey"
            columns: ["innings_id"]
            isOneToOne: false
            referencedRelation: "innings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bowling_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bowling_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      innings: {
        Row: {
          batting_team_id: string | null
          bowling_team_id: string | null
          created_at: string
          extras_byes: number
          extras_leg_byes: number
          extras_no_balls: number
          extras_wides: number
          id: string
          innings_number: number
          is_completed: boolean
          match_id: string
          total_overs: number
          total_runs: number
          total_wickets: number
          updated_at: string
        }
        Insert: {
          batting_team_id?: string | null
          bowling_team_id?: string | null
          created_at?: string
          extras_byes?: number
          extras_leg_byes?: number
          extras_no_balls?: number
          extras_wides?: number
          id?: string
          innings_number?: number
          is_completed?: boolean
          match_id: string
          total_overs?: number
          total_runs?: number
          total_wickets?: number
          updated_at?: string
        }
        Update: {
          batting_team_id?: string | null
          bowling_team_id?: string | null
          created_at?: string
          extras_byes?: number
          extras_leg_byes?: number
          extras_no_balls?: number
          extras_wides?: number
          id?: string
          innings_number?: number
          is_completed?: boolean
          match_id?: string
          total_overs?: number
          total_runs?: number
          total_wickets?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "innings_batting_team_id_fkey"
            columns: ["batting_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "innings_bowling_team_id_fkey"
            columns: ["bowling_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "innings_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_awards: {
        Row: {
          award_type: string
          created_at: string
          id: string
          match_id: string
          player_id: string
        }
        Insert: {
          award_type: string
          created_at?: string
          id?: string
          match_id: string
          player_id: string
        }
        Update: {
          award_type?: string
          created_at?: string
          id?: string
          match_id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_awards_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_awards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_awards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          match_date: string
          name: string
          overs: number
          result_summary: string | null
          scorer_id: string | null
          status: Database["public"]["Enums"]["match_status"]
          team_a_id: string | null
          team_b_id: string | null
          toss_decision: string | null
          toss_winner_id: string | null
          tournament_id: string | null
          updated_at: string
          venue: string | null
          winner_team_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          match_date: string
          name: string
          overs?: number
          result_summary?: string | null
          scorer_id?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          team_a_id?: string | null
          team_b_id?: string | null
          toss_decision?: string | null
          toss_winner_id?: string | null
          tournament_id?: string | null
          updated_at?: string
          venue?: string | null
          winner_team_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          match_date?: string
          name?: string
          overs?: number
          result_summary?: string | null
          scorer_id?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          team_a_id?: string | null
          team_b_id?: string | null
          toss_decision?: string | null
          toss_winner_id?: string | null
          tournament_id?: string | null
          updated_at?: string
          venue?: string | null
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_team_a_id_fkey"
            columns: ["team_a_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_b_id_fkey"
            columns: ["team_b_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_toss_winner_id_fkey"
            columns: ["toss_winner_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          batting_style: string | null
          bowling_style: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          playing_role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          batting_style?: string | null
          bowling_style?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          playing_role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          batting_style?: string | null
          bowling_style?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          playing_role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          subject: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          subject: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      team_admins: {
        Row: {
          created_at: string
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_admins_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          batting_style: string | null
          bowling_style: string | null
          created_at: string
          id: string
          is_captain: boolean | null
          is_vice_captain: boolean | null
          is_wicket_keeper: boolean | null
          player_name: string
          playing_role: string | null
          team_id: string
          user_id: string | null
        }
        Insert: {
          batting_style?: string | null
          bowling_style?: string | null
          created_at?: string
          id?: string
          is_captain?: boolean | null
          is_vice_captain?: boolean | null
          is_wicket_keeper?: boolean | null
          player_name: string
          playing_role?: string | null
          team_id: string
          user_id?: string | null
        }
        Update: {
          batting_style?: string | null
          bowling_style?: string | null
          created_at?: string
          id?: string
          is_captain?: boolean | null
          is_vice_captain?: boolean | null
          is_wicket_keeper?: boolean | null
          player_name?: string
          playing_role?: string | null
          team_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournament_awards: {
        Row: {
          award_type: string
          created_at: string
          id: string
          player_id: string
          tournament_id: string
        }
        Insert: {
          award_type: string
          created_at?: string
          id?: string
          player_id: string
          tournament_id: string
        }
        Update: {
          award_type?: string
          created_at?: string
          id?: string
          player_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_awards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_awards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_awards_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_teams: {
        Row: {
          created_at: string
          id: string
          team_id: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          team_id: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          id?: string
          team_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_teams_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string | null
          format: string | null
          id: string
          name: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          format?: string | null
          id?: string
          name: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          format?: string | null
          id?: string
          name?: string
          start_date?: string | null
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
      team_members_public: {
        Row: {
          created_at: string | null
          id: string | null
          is_captain: boolean | null
          is_wicket_keeper: boolean | null
          player_name: string | null
          team_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_captain?: boolean | null
          is_wicket_keeper?: boolean | null
          player_name?: string | null
          team_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_captain?: boolean | null
          is_wicket_keeper?: boolean | null
          player_name?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      find_user_by_phone: {
        Args: { _phone: string }
        Returns: {
          full_name: string
          user_id: string
        }[]
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
      app_role: "player" | "organizer" | "scorer" | "admin"
      dismissal_type:
        | "bowled"
        | "caught"
        | "lbw"
        | "run_out"
        | "stumped"
        | "hit_wicket"
        | "retired"
        | "obstructing"
      match_status: "upcoming" | "live" | "completed" | "cancelled"
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
      app_role: ["player", "organizer", "scorer", "admin"],
      dismissal_type: [
        "bowled",
        "caught",
        "lbw",
        "run_out",
        "stumped",
        "hit_wicket",
        "retired",
        "obstructing",
      ],
      match_status: ["upcoming", "live", "completed", "cancelled"],
    },
  },
} as const
