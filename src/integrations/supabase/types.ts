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
      absence_types: {
        Row: {
          code: string
          color: string | null
          created_at: string
          deducts_from_balance: boolean | null
          id: string
          max_days_per_year: number | null
          name: string
          requires_approval: boolean | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string
          deducts_from_balance?: boolean | null
          id?: string
          max_days_per_year?: number | null
          name: string
          requires_approval?: boolean | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string
          deducts_from_balance?: boolean | null
          id?: string
          max_days_per_year?: number | null
          name?: string
          requires_approval?: boolean | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      attendances: {
        Row: {
          break_duration: number | null
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          status: string | null
          tenant_id: string | null
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          break_duration?: number | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          notes?: string | null
          status?: string | null
          tenant_id?: string | null
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          break_duration?: number | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          status?: string | null
          tenant_id?: string | null
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      employee_documents: {
        Row: {
          created_at: string
          document_type: string
          employee_id: string
          expires_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_confidential: boolean | null
          mime_type: string | null
          tenant_id: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          employee_id: string
          expires_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_confidential?: boolean | null
          mime_type?: string | null
          tenant_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          employee_id?: string
          expires_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_confidential?: boolean | null
          mime_type?: string | null
          tenant_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          absence_type_id: string
          created_at: string
          employee_id: string
          id: string
          remaining_days: number | null
          tenant_id: string | null
          total_days: number | null
          updated_at: string
          used_days: number | null
          year: number
        }
        Insert: {
          absence_type_id: string
          created_at?: string
          employee_id: string
          id?: string
          remaining_days?: number | null
          tenant_id?: string | null
          total_days?: number | null
          updated_at?: string
          used_days?: number | null
          year: number
        }
        Update: {
          absence_type_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          remaining_days?: number | null
          tenant_id?: string | null
          total_days?: number | null
          updated_at?: string
          used_days?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_absence_type_id_fkey"
            columns: ["absence_type_id"]
            isOneToOne: false
            referencedRelation: "absence_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          absence_type_id: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          end_date: string
          id: string
          reason: string | null
          rejection_reason: string | null
          start_date: string
          status: string | null
          tenant_id: string | null
          total_days: number
          updated_at: string
        }
        Insert: {
          absence_type_id: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: string | null
          tenant_id?: string | null
          total_days: number
          updated_at?: string
        }
        Update: {
          absence_type_id?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string | null
          tenant_id?: string | null
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_absence_type_id_fkey"
            columns: ["absence_type_id"]
            isOneToOne: false
            referencedRelation: "absence_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          requirements: string | null
          salary_range_max: number | null
          salary_range_min: number | null
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          requirements?: string | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          requirements?: string | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          contract_type: string | null
          created_at: string
          emergency_contact: Json | null
          employee_id: string | null
          full_name: string
          hire_date: string | null
          id: string
          job_title: string | null
          manager_id: string | null
          phone: string | null
          role: string | null
          salary: number | null
          tenant_id: string | null
          updated_at: string
          user_id: string | null
          weekly_hours: number | null
        }
        Insert: {
          avatar_url?: string | null
          contract_type?: string | null
          created_at?: string
          emergency_contact?: Json | null
          employee_id?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          job_title?: string | null
          manager_id?: string | null
          phone?: string | null
          role?: string | null
          salary?: number | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
          weekly_hours?: number | null
        }
        Update: {
          avatar_url?: string | null
          contract_type?: string | null
          created_at?: string
          emergency_contact?: Json | null
          employee_id?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          job_title?: string | null
          manager_id?: string | null
          phone?: string | null
          role?: string | null
          salary?: number | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
          weekly_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      task_audit_logs: {
        Row: {
          action_type: string
          created_at: string
          description: string
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          task_id: string
          tenant_id: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          description: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          task_id: string
          tenant_id?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          task_id?: string
          tenant_id?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
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
      timesheets: {
        Row: {
          approved: boolean | null
          approved_by: string | null
          billable: boolean | null
          created_at: string
          date: string
          description: string | null
          employee_id: string
          hours: number
          id: string
          project_id: string | null
          task_id: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          approved?: boolean | null
          approved_by?: string | null
          billable?: boolean | null
          created_at?: string
          date: string
          description?: string | null
          employee_id: string
          hours?: number
          id?: string
          project_id?: string | null
          task_id?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          approved?: boolean | null
          approved_by?: string | null
          billable?: boolean | null
          created_at?: string
          date?: string
          description?: string | null
          employee_id?: string
          hours?: number
          id?: string
          project_id?: string | null
          task_id?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_working_days: {
        Args: { end_date: string; start_date: string }
        Returns: number
      }
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
