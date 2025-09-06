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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      departments: {
        Row: {
          budget: number | null
          created_at: string
          description: string | null
          id: string
          manager_id: string | null
          name: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          role: string | null
          tenant_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          role?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          role?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          created_at: string
          department_id: string | null
          description: string | null
          end_date: string | null
          id: string
          manager_id: string | null
          name: string
          priority: string
          start_date: string | null
          status: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          manager_id?: string | null
          name: string
          priority?: string
          start_date?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          priority?: string
          start_date?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      task_actions: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          is_done: boolean | null
          notes: string | null
          owner_id: string | null
          position: number | null
          task_id: string
          tenant_id: string | null
          title: string
          updated_at: string
          weight_percentage: number
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          is_done?: boolean | null
          notes?: string | null
          owner_id?: string | null
          position?: number | null
          task_id: string
          tenant_id?: string | null
          title: string
          updated_at?: string
          weight_percentage?: number
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          is_done?: boolean | null
          notes?: string | null
          owner_id?: string | null
          position?: number | null
          task_id?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string
          weight_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_actions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string | null
          comment_type: string | null
          content: string
          created_at: string
          id: string
          task_id: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          comment_type?: string | null
          content: string
          created_at?: string
          id?: string
          task_id: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          comment_type?: string | null
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          dependency_type: string
          depends_on_task_id: string
          id: string
          task_id: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          dependency_type?: string
          depends_on_task_id: string
          id?: string
          task_id: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          dependency_type?: string
          depends_on_task_id?: string
          id?: string
          task_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      task_documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          project_id: string | null
          subtask_id: string | null
          task_id: string
          tenant_id: string | null
          updated_at: string
          uploader_id: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          project_id?: string | null
          subtask_id?: string | null
          task_id: string
          tenant_id?: string | null
          updated_at?: string
          uploader_id?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          project_id?: string | null
          subtask_id?: string | null
          task_id?: string
          tenant_id?: string | null
          updated_at?: string
          uploader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_documents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      task_risks: {
        Row: {
          created_at: string
          id: string
          impact: string
          mitigation_plan: string | null
          probability: string
          risk_description: string
          status: string
          task_id: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          impact?: string
          mitigation_plan?: string | null
          probability?: string
          risk_description: string
          status?: string
          task_id: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          impact?: string
          mitigation_plan?: string | null
          probability?: string
          risk_description?: string
          status?: string
          task_id?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_risks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_risks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          acceptance_criteria: string | null
          assignee: string
          assignee_id: string | null
          budget: number | null
          created_at: string
          department_id: string | null
          description: string | null
          display_order: string | null
          due_date: string
          effort_estimate_h: number | null
          effort_spent_h: number | null
          id: string
          linked_action_id: string | null
          parent_id: string | null
          priority: string
          progress: number | null
          project_id: string | null
          start_date: string
          status: string
          task_level: number | null
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          acceptance_criteria?: string | null
          assignee: string
          assignee_id?: string | null
          budget?: number | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          display_order?: string | null
          due_date: string
          effort_estimate_h?: number | null
          effort_spent_h?: number | null
          id?: string
          linked_action_id?: string | null
          parent_id?: string | null
          priority: string
          progress?: number | null
          project_id?: string | null
          start_date: string
          status?: string
          task_level?: number | null
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          acceptance_criteria?: string | null
          assignee?: string
          assignee_id?: string | null
          budget?: number | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          display_order?: string | null
          due_date?: string
          effort_estimate_h?: number | null
          effort_spent_h?: number | null
          id?: string
          linked_action_id?: string | null
          parent_id?: string | null
          priority?: string
          progress?: number | null
          project_id?: string | null
          start_date?: string
          status?: string
          task_level?: number | null
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_linked_action_id_fkey"
            columns: ["linked_action_id"]
            isOneToOne: false
            referencedRelation: "task_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          permissions: Json | null
          role: string
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          status?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          description: string | null
          domain: string | null
          id: string
          logo_url: string | null
          max_projects: number | null
          max_users: number | null
          name: string
          settings: Json | null
          slug: string
          status: string
          subscription_expires_at: string | null
          subscription_plan: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          max_projects?: number | null
          max_users?: number | null
          name: string
          settings?: Json | null
          slug: string
          status?: string
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          max_projects?: number | null
          max_users?: number | null
          name?: string
          settings?: Json | null
          slug?: string
          status?: string
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      compute_task_progress: {
        Args: { p_task_id: string }
        Returns: number
      }
      compute_task_status: {
        Args: { p_task_id: string }
        Returns: string
      }
      distribute_equal_weights: {
        Args: { p_task_id: string }
        Returns: undefined
      }
      generate_display_order: {
        Args: { p_parent_id: string; p_task_level: number }
        Returns: string
      }
      get_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
