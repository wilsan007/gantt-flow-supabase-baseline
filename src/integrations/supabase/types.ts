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
      absences: {
        Row: {
          absence_type_id: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          end_date: string
          id: string
          medical_certificate: boolean | null
          reason: string | null
          rejection_reason: string | null
          start_date: string
          status: string
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
          medical_certificate?: boolean | null
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: string
          tenant_id?: string | null
          total_days?: number
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
          medical_certificate?: boolean | null
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string
          tenant_id?: string | null
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_absences_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["user_id"]
          },
        ]
      }
      alert_instance_recommendations: {
        Row: {
          alert_instance_id: string
          created_at: string
          id: string
          is_primary: boolean | null
          recommended_score: number | null
          solution_id: string
          tenant_id: string | null
        }
        Insert: {
          alert_instance_id: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          recommended_score?: number | null
          solution_id: string
          tenant_id?: string | null
        }
        Update: {
          alert_instance_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          recommended_score?: number | null
          solution_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_instance_recommendations_alert_instance_id_fkey"
            columns: ["alert_instance_id"]
            isOneToOne: false
            referencedRelation: "alert_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_instance_recommendations_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "alert_solutions"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_instances: {
        Row: {
          acknowledged_at: string | null
          alert_type_id: string
          application_domain: string
          context_data: Json | null
          created_at: string
          description: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          id: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          tenant_id: string | null
          title: string
          triggered_at: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          alert_type_id: string
          application_domain?: string
          context_data?: Json | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          status?: string
          tenant_id?: string | null
          title: string
          triggered_at?: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          alert_type_id?: string
          application_domain?: string
          context_data?: Json | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          tenant_id?: string | null
          title?: string
          triggered_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_instances_alert_type_id_fkey"
            columns: ["alert_type_id"]
            isOneToOne: false
            referencedRelation: "alert_types"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_solutions: {
        Row: {
          action_steps: Json | null
          category: string
          cost_level: string | null
          created_at: string
          description: string
          effectiveness_score: number | null
          id: string
          implementation_time: string | null
          required_roles: string[] | null
          tenant_id: string | null
          title: string
        }
        Insert: {
          action_steps?: Json | null
          category: string
          cost_level?: string | null
          created_at?: string
          description: string
          effectiveness_score?: number | null
          id?: string
          implementation_time?: string | null
          required_roles?: string[] | null
          tenant_id?: string | null
          title: string
        }
        Update: {
          action_steps?: Json | null
          category?: string
          cost_level?: string | null
          created_at?: string
          description?: string
          effectiveness_score?: number | null
          id?: string
          implementation_time?: string | null
          required_roles?: string[] | null
          tenant_id?: string | null
          title?: string
        }
        Relationships: []
      }
      alert_type_solutions: {
        Row: {
          alert_type_id: string
          context_conditions: Json | null
          id: string
          priority_order: number | null
          solution_id: string
          tenant_id: string | null
        }
        Insert: {
          alert_type_id: string
          context_conditions?: Json | null
          id?: string
          priority_order?: number | null
          solution_id: string
          tenant_id?: string | null
        }
        Update: {
          alert_type_id?: string
          context_conditions?: Json | null
          id?: string
          priority_order?: number | null
          solution_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_type_solutions_alert_type_id_fkey"
            columns: ["alert_type_id"]
            isOneToOne: false
            referencedRelation: "alert_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_type_solutions_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "alert_solutions"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_types: {
        Row: {
          application_domain: string
          auto_trigger_conditions: Json | null
          category: string
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          severity: string
          tenant_id: string | null
        }
        Insert: {
          application_domain?: string
          auto_trigger_conditions?: Json | null
          category: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          severity?: string
          tenant_id?: string | null
        }
        Update: {
          application_domain?: string
          auto_trigger_conditions?: Json | null
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          severity?: string
          tenant_id?: string | null
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
          {
            foreignKeyName: "fk_attendances_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["user_id"]
          },
        ]
      }
      candidates: {
        Row: {
          applied_date: string
          cover_letter: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          linkedin_url: string | null
          phone: string | null
          resume_url: string | null
          source: string | null
          status: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          applied_date?: string
          cover_letter?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          linkedin_url?: string | null
          phone?: string | null
          resume_url?: string | null
          source?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          applied_date?: string
          cover_letter?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          linkedin_url?: string | null
          phone?: string | null
          resume_url?: string | null
          source?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      capacity_planning: {
        Row: {
          absence_hours: number
          allocated_hours: number
          available_hours: number
          capacity_utilization: number | null
          created_at: string
          employee_id: string
          id: string
          period_end: string
          period_start: string
          project_hours: number
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          absence_hours?: number
          allocated_hours?: number
          available_hours?: number
          capacity_utilization?: number | null
          created_at?: string
          employee_id: string
          id?: string
          period_end: string
          period_start: string
          project_hours?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          absence_hours?: number
          allocated_hours?: number
          available_hours?: number
          capacity_utilization?: number | null
          created_at?: string
          employee_id?: string
          id?: string
          period_end?: string
          period_start?: string
          project_hours?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      corrective_actions: {
        Row: {
          completed_date: string | null
          created_at: string
          description: string
          due_date: string
          id: string
          incident_id: string
          responsible_person: string
          status: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          completed_date?: string | null
          created_at?: string
          description: string
          due_date: string
          id?: string
          incident_id: string
          responsible_person: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          incident_id?: string
          responsible_person?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "corrective_actions_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "safety_incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      country_policies: {
        Row: {
          compliance_rules: string | null
          country_code: string
          country_name: string
          created_at: string
          currency: string
          id: string
          language: string
          leave_policies: Json | null
          public_holidays: Json | null
          tax_rates: Json | null
          tenant_id: string | null
          updated_at: string
          working_hours_per_week: number | null
        }
        Insert: {
          compliance_rules?: string | null
          country_code: string
          country_name: string
          created_at?: string
          currency?: string
          id?: string
          language?: string
          leave_policies?: Json | null
          public_holidays?: Json | null
          tax_rates?: Json | null
          tenant_id?: string | null
          updated_at?: string
          working_hours_per_week?: number | null
        }
        Update: {
          compliance_rules?: string | null
          country_code?: string
          country_name?: string
          created_at?: string
          currency?: string
          id?: string
          language?: string
          leave_policies?: Json | null
          public_holidays?: Json | null
          tax_rates?: Json | null
          tenant_id?: string | null
          updated_at?: string
          working_hours_per_week?: number | null
        }
        Relationships: []
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
          {
            foreignKeyName: "fk_employee_documents_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["user_id"]
          },
        ]
      }
      employee_insights: {
        Row: {
          created_at: string
          data_sources: Json | null
          description: string | null
          employee_id: string
          id: string
          insight_type: string
          is_active: boolean | null
          recommendations: string | null
          risk_level: string
          score: number | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_sources?: Json | null
          description?: string | null
          employee_id: string
          id?: string
          insight_type: string
          is_active?: boolean | null
          recommendations?: string | null
          risk_level?: string
          score?: number | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_sources?: Json | null
          description?: string | null
          employee_id?: string
          id?: string
          insight_type?: string
          is_active?: boolean | null
          recommendations?: string | null
          risk_level?: string
          score?: number | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      employee_payrolls: {
        Row: {
          base_salary: number
          created_at: string
          employee_id: string
          employee_name: string
          gross_total: number
          hours_worked: number
          id: string
          net_total: number
          overtime_hours: number | null
          period_id: string
          position: string
          social_charges: number
          standard_hours: number
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          base_salary: number
          created_at?: string
          employee_id: string
          employee_name: string
          gross_total: number
          hours_worked: number
          id?: string
          net_total: number
          overtime_hours?: number | null
          period_id: string
          position: string
          social_charges: number
          standard_hours: number
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          base_salary?: number
          created_at?: string
          employee_id?: string
          employee_name?: string
          gross_total?: number
          hours_worked?: number
          id?: string
          net_total?: number
          overtime_hours?: number | null
          period_id?: string
          position?: string
          social_charges?: number
          standard_hours?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_payrolls_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employee_payrolls_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["user_id"]
          },
        ]
      }
      employees: {
        Row: {
          avatar_url: string | null
          contract_type: string | null
          created_at: string
          department_id: string | null
          email: string
          emergency_contact: Json | null
          employee_id: string
          full_name: string
          hire_date: string | null
          id: string
          job_title: string | null
          manager_id: string | null
          phone: string | null
          salary: number | null
          status: string | null
          tenant_id: string | null
          updated_at: string
          user_id: string | null
          weekly_hours: number | null
        }
        Insert: {
          avatar_url?: string | null
          contract_type?: string | null
          created_at?: string
          department_id?: string | null
          email: string
          emergency_contact?: Json | null
          employee_id: string
          full_name: string
          hire_date?: string | null
          id?: string
          job_title?: string | null
          manager_id?: string | null
          phone?: string | null
          salary?: number | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
          weekly_hours?: number | null
        }
        Update: {
          avatar_url?: string | null
          contract_type?: string | null
          created_at?: string
          department_id?: string | null
          email?: string
          emergency_contact?: Json | null
          employee_id?: string
          full_name?: string
          hire_date?: string | null
          id?: string
          job_title?: string | null
          manager_id?: string | null
          phone?: string | null
          salary?: number | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
          weekly_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      evaluation_categories: {
        Row: {
          created_at: string
          evaluation_id: string
          feedback: string | null
          id: string
          name: string
          score: number
          tenant_id: string | null
          weight: number
        }
        Insert: {
          created_at?: string
          evaluation_id: string
          feedback?: string | null
          id?: string
          name: string
          score: number
          tenant_id?: string | null
          weight: number
        }
        Update: {
          created_at?: string
          evaluation_id?: string
          feedback?: string | null
          id?: string
          name?: string
          score?: number
          tenant_id?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_categories_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          created_at: string
          employee_id: string | null
          employee_name: string
          evaluator_id: string | null
          evaluator_name: string
          id: string
          overall_score: number | null
          period: string
          status: string
          tenant_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          employee_name: string
          evaluator_id?: string | null
          evaluator_name: string
          id?: string
          overall_score?: number | null
          period: string
          status?: string
          tenant_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          employee_name?: string
          evaluator_id?: string | null
          evaluator_name?: string
          id?: string
          overall_score?: number | null
          period?: string
          status?: string
          tenant_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["user_id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          max_amount: number | null
          name: string
          requires_receipt: boolean | null
          tenant_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          max_amount?: number | null
          name: string
          requires_receipt?: boolean | null
          tenant_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          max_amount?: number | null
          name?: string
          requires_receipt?: boolean | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      expense_items: {
        Row: {
          amount: number
          category_id: string | null
          category_name: string
          created_at: string
          currency: string
          description: string
          expense_date: string
          id: string
          location: string | null
          mileage: number | null
          receipt_url: string | null
          report_id: string
          tenant_id: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          category_name: string
          created_at?: string
          currency?: string
          description: string
          expense_date: string
          id?: string
          location?: string | null
          mileage?: number | null
          receipt_url?: string | null
          report_id: string
          tenant_id?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          category_name?: string
          created_at?: string
          currency?: string
          description?: string
          expense_date?: string
          id?: string
          location?: string | null
          mileage?: number | null
          receipt_url?: string | null
          report_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_items_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "expense_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_reports: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          created_at: string
          currency: string
          employee_id: string
          employee_name: string
          id: string
          rejection_reason: string | null
          status: string
          submission_date: string | null
          tenant_id: string | null
          title: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          employee_id: string
          employee_name: string
          id?: string
          rejection_reason?: string | null
          status?: string
          submission_date?: string | null
          tenant_id?: string | null
          title: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          employee_id?: string
          employee_name?: string
          id?: string
          rejection_reason?: string | null
          status?: string
          submission_date?: string | null
          tenant_id?: string | null
          title?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      hr_analytics: {
        Row: {
          calculated_at: string
          department_id: string | null
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          period_end: string
          period_start: string
          tenant_id: string | null
        }
        Insert: {
          calculated_at?: string
          department_id?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          period_end: string
          period_start: string
          tenant_id?: string | null
        }
        Update: {
          calculated_at?: string
          department_id?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_value?: number
          period_end?: string
          period_start?: string
          tenant_id?: string | null
        }
        Relationships: []
      }
      interviews: {
        Row: {
          application_id: string
          created_at: string
          duration_minutes: number | null
          feedback: string | null
          id: string
          interviewer_id: string | null
          interviewer_name: string
          location: string | null
          recommendation: string | null
          scheduled_date: string
          scheduled_time: string | null
          score: number | null
          status: string
          tenant_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          interviewer_id?: string | null
          interviewer_name: string
          location?: string | null
          recommendation?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          score?: number | null
          status?: string
          tenant_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          interviewer_id?: string | null
          interviewer_name?: string
          location?: string | null
          recommendation?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          score?: number | null
          status?: string
          tenant_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applied_date: string
          candidate_id: string
          created_at: string
          id: string
          job_post_id: string
          notes: string | null
          score: number | null
          stage: string
          status: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          applied_date?: string
          candidate_id: string
          created_at?: string
          id?: string
          job_post_id: string
          notes?: string | null
          score?: number | null
          stage?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          applied_date?: string
          candidate_id?: string
          created_at?: string
          id?: string
          job_post_id?: string
          notes?: string | null
          score?: number | null
          stage?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      job_offers: {
        Row: {
          application_id: string
          approved_by: string | null
          benefits: string | null
          created_at: string
          created_by: string | null
          expiry_date: string | null
          id: string
          offer_date: string
          salary_offered: number
          start_date: string | null
          status: string
          tenant_id: string | null
          terms_conditions: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          approved_by?: string | null
          benefits?: string | null
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          offer_date?: string
          salary_offered: number
          start_date?: string | null
          status?: string
          tenant_id?: string | null
          terms_conditions?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          approved_by?: string | null
          benefits?: string | null
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          offer_date?: string
          salary_offered?: number
          start_date?: string | null
          status?: string
          tenant_id?: string | null
          terms_conditions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      job_posts: {
        Row: {
          closing_date: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string | null
          employment_type: string
          hiring_manager_id: string | null
          id: string
          location: string | null
          position_id: string | null
          posted_date: string | null
          requirements: string | null
          salary_max: number | null
          salary_min: number | null
          status: string
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          closing_date?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          employment_type?: string
          hiring_manager_id?: string | null
          id?: string
          location?: string | null
          position_id?: string | null
          posted_date?: string | null
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          closing_date?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          employment_type?: string
          hiring_manager_id?: string | null
          id?: string
          location?: string | null
          position_id?: string | null
          posted_date?: string | null
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      key_results: {
        Row: {
          created_at: string
          current_value: string | null
          id: string
          objective_id: string
          progress: number | null
          target: string
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: string | null
          id?: string
          objective_id: string
          progress?: number | null
          target: string
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: string | null
          id?: string
          objective_id?: string
          progress?: number | null
          target?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_results_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
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
            foreignKeyName: "fk_leave_balances_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["user_id"]
          },
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
            foreignKeyName: "fk_leave_requests_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["user_id"]
          },
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
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          enabled: boolean
          id: string
          in_app_enabled: boolean
          notification_type: string
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          notification_type: string
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          notification_type?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          priority: string
          read_at: string | null
          recipient_id: string
          sender_id: string | null
          tenant_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type: string
          priority?: string
          read_at?: string | null
          recipient_id: string
          sender_id?: string | null
          tenant_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          priority?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string | null
          tenant_id?: string | null
          title?: string
        }
        Relationships: []
      }
      objectives: {
        Row: {
          created_at: string
          department: string
          description: string | null
          due_date: string
          employee_id: string | null
          employee_name: string
          id: string
          progress: number | null
          status: string
          tenant_id: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department: string
          description?: string | null
          due_date: string
          employee_id?: string | null
          employee_name: string
          id?: string
          progress?: number | null
          status?: string
          tenant_id?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          description?: string | null
          due_date?: string
          employee_id?: string | null
          employee_name?: string
          id?: string
          progress?: number | null
          status?: string
          tenant_id?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "objectives_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["user_id"]
          },
        ]
      }
      offboarding_processes: {
        Row: {
          created_at: string
          department: string
          employee_id: string
          employee_name: string
          id: string
          last_work_day: string
          position: string
          progress: number | null
          status: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department: string
          employee_id: string
          employee_name: string
          id?: string
          last_work_day: string
          position: string
          progress?: number | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          employee_id?: string
          employee_name?: string
          id?: string
          last_work_day?: string
          position?: string
          progress?: number | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      offboarding_tasks: {
        Row: {
          category: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          process_id: string
          responsible: string
          status: string
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          process_id: string
          responsible: string
          status?: string
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          process_id?: string
          responsible?: string
          status?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offboarding_tasks_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "offboarding_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_processes: {
        Row: {
          created_at: string
          department: string
          employee_id: string
          employee_name: string
          id: string
          position: string
          progress: number | null
          start_date: string
          status: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department: string
          employee_id: string
          employee_name: string
          id?: string
          position: string
          progress?: number | null
          start_date: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          employee_id?: string
          employee_name?: string
          id?: string
          position?: string
          progress?: number | null
          start_date?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_tasks: {
        Row: {
          category: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          process_id: string
          responsible: string
          status: string
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          process_id: string
          responsible: string
          status?: string
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          process_id?: string
          responsible?: string
          status?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tasks_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "onboarding_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_components: {
        Row: {
          amount: number
          created_at: string
          id: string
          is_percentage: boolean | null
          is_taxable: boolean | null
          name: string
          payroll_id: string
          tenant_id: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          is_percentage?: boolean | null
          is_taxable?: boolean | null
          name: string
          payroll_id: string
          tenant_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          is_percentage?: boolean | null
          is_taxable?: boolean | null
          name?: string
          payroll_id?: string
          tenant_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_components_payroll_id_fkey"
            columns: ["payroll_id"]
            isOneToOne: false
            referencedRelation: "employee_payrolls"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          created_at: string
          id: string
          lock_date: string | null
          month: number
          processed_date: string | null
          status: string
          tenant_id: string | null
          total_charges: number | null
          total_employees: number | null
          total_gross: number | null
          total_net: number | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          lock_date?: string | null
          month: number
          processed_date?: string | null
          status?: string
          tenant_id?: string | null
          total_charges?: number | null
          total_employees?: number | null
          total_gross?: number | null
          total_net?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          lock_date?: string | null
          month?: number
          processed_date?: string | null
          status?: string
          tenant_id?: string | null
          total_charges?: number | null
          total_employees?: number | null
          total_gross?: number | null
          total_net?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: []
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
      safety_documents: {
        Row: {
          category: string
          created_at: string
          download_url: string | null
          expiry_date: string | null
          id: string
          published_date: string
          status: string
          tenant_id: string | null
          title: string
          type: string
          updated_at: string
          version: string
        }
        Insert: {
          category: string
          created_at?: string
          download_url?: string | null
          expiry_date?: string | null
          id?: string
          published_date?: string
          status?: string
          tenant_id?: string | null
          title: string
          type: string
          updated_at?: string
          version: string
        }
        Update: {
          category?: string
          created_at?: string
          download_url?: string | null
          expiry_date?: string | null
          id?: string
          published_date?: string
          status?: string
          tenant_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      safety_incidents: {
        Row: {
          affected_employee: string | null
          created_at: string
          description: string
          id: string
          location: string
          reported_by: string
          reported_date: string
          severity: string
          status: string
          tenant_id: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          affected_employee?: string | null
          created_at?: string
          description: string
          id?: string
          location: string
          reported_by: string
          reported_date?: string
          severity: string
          status?: string
          tenant_id?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          affected_employee?: string | null
          created_at?: string
          description?: string
          id?: string
          location?: string
          reported_by?: string
          reported_date?: string
          severity?: string
          status?: string
          tenant_id?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      skill_assessments: {
        Row: {
          assessor: string
          created_at: string
          current_level: number
          department: string
          employee_id: string
          employee_name: string
          id: string
          last_assessed: string
          position: string
          skill_id: string
          target_level: number
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          assessor: string
          created_at?: string
          current_level: number
          department: string
          employee_id: string
          employee_name: string
          id?: string
          last_assessed?: string
          position: string
          skill_id: string
          target_level: number
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          assessor?: string
          created_at?: string
          current_level?: number
          department?: string
          employee_id?: string
          employee_name?: string
          id?: string
          last_assessed?: string
          position?: string
          skill_id?: string
          target_level?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_skill_assessments_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "skill_assessments_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string | null
        }
        Relationships: []
      }
      tardiness: {
        Row: {
          actual_time: string
          created_at: string
          date: string
          delay_minutes: number
          employee_id: string
          id: string
          justification: string | null
          justified: boolean | null
          reason: string | null
          scheduled_time: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          actual_time: string
          created_at?: string
          date: string
          delay_minutes: number
          employee_id: string
          id?: string
          justification?: string | null
          justified?: boolean | null
          reason?: string | null
          scheduled_time: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          actual_time?: string
          created_at?: string
          date?: string
          delay_minutes?: number
          employee_id?: string
          id?: string
          justification?: string | null
          justified?: boolean | null
          reason?: string | null
          scheduled_time?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tardiness_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["user_id"]
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
          assigned_name: string
          assignee_id: string | null
          budget: number | null
          created_at: string
          department_id: string | null
          department_name: string
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
          project_name: string
          start_date: string
          status: string
          task_level: number | null
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          acceptance_criteria?: string | null
          assigned_name: string
          assignee_id?: string | null
          budget?: number | null
          created_at?: string
          department_id?: string | null
          department_name: string
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
          project_name: string
          start_date: string
          status?: string
          task_level?: number | null
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          acceptance_criteria?: string | null
          assigned_name?: string
          assignee_id?: string | null
          budget?: number | null
          created_at?: string
          department_id?: string | null
          department_name?: string
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
          project_name?: string
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
            referencedRelation: "employees"
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
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      training_enrollments: {
        Row: {
          certificate_url: string | null
          completion_date: string | null
          created_at: string
          employee_id: string
          employee_name: string
          enrollment_date: string
          hours_completed: number | null
          id: string
          score: number | null
          status: string
          tenant_id: string | null
          training_id: string
          updated_at: string
        }
        Insert: {
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string
          employee_id: string
          employee_name: string
          enrollment_date?: string
          hours_completed?: number | null
          id?: string
          score?: number | null
          status?: string
          tenant_id?: string | null
          training_id: string
          updated_at?: string
        }
        Update: {
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string
          employee_id?: string
          employee_name?: string
          enrollment_date?: string
          hours_completed?: number | null
          id?: string
          score?: number | null
          status?: string
          tenant_id?: string | null
          training_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_training_enrollments_employee_id"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "training_enrollments_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration_hours: number
          end_date: string | null
          format: string
          id: string
          max_participants: number | null
          participants_count: number | null
          provider: string
          rating: number | null
          start_date: string | null
          status: string
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          duration_hours: number
          end_date?: string | null
          format: string
          id?: string
          max_participants?: number | null
          participants_count?: number | null
          provider: string
          rating?: number | null
          start_date?: string | null
          status?: string
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration_hours?: number
          end_date?: string | null
          format?: string
          id?: string
          max_participants?: number | null
          participants_count?: number | null
          provider?: string
          rating?: number | null
          start_date?: string | null
          status?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      current_alerts_view: {
        Row: {
          application_domain: string | null
          category: string | null
          code: string | null
          context_data: Json | null
          description: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          id: string | null
          severity: string | null
          tenant_id: string | null
          title: string | null
          triggered_at: string | null
          type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_alert_recommendations: {
        Args: { p_alert_instance_id: string }
        Returns: undefined
      }
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
      create_smart_notification: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_message: string
          p_metadata?: Json
          p_notification_type: string
          p_priority?: string
          p_sender_id?: string
          p_title: string
        }
        Returns: undefined
      }
      distribute_equal_weights: {
        Args: { p_task_id: string }
        Returns: undefined
      }
      generate_display_order: {
        Args: { p_parent_id: string; p_task_level: number }
        Returns: string
      }
      get_employee_name: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_notification_recipients: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_metadata?: Json
          p_notification_type: string
        }
        Returns: {
          recipient_id: string
          should_notify: boolean
        }[]
      }
      get_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      mark_notifications_read: {
        Args: { notification_ids: string[] }
        Returns: undefined
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
