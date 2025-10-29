/**
 * Types Deno pour les Edge Functions Supabase
 * Ce fichier aide l'IDE à comprendre l'environnement Deno
 */

// Types globaux Deno (si nécessaire pour l'IDE)
declare global {
  namespace Deno {
    interface Env {
      get(key: string): string | undefined;
    }
    
    const env: Env;
  }
}

// Types pour les Edge Functions
export interface EdgeFunctionRequest extends Request {}

export interface EdgeFunctionContext {
  req: EdgeFunctionRequest;
}

// Types pour les réponses d'erreur standardisées
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, any>;
  timestamp?: string;
}

// Types pour les réponses de succès
export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
  timestamp?: string;
}

// Type union pour toutes les réponses
export type EdgeFunctionResponse<T = any> = ErrorResponse | SuccessResponse<T>;

// Types spécifiques aux invitations
export interface InvitationValidationElements {
  full_name: string;
  invitation_type: 'tenant_owner';
  temp_user: boolean;
  temp_password: string;
  tenant_id: string;
  invitation_id: string;
  validation_code: string;
  created_timestamp: string;
  invited_by_type: 'super_admin';
  company_name: string;
}

export interface InvitationMetadata {
  supabase_user_id: string;
  confirmation_url: string;
  temp_password: string;
  validation_elements: InvitationValidationElements;
  security_info: {
    ip_address: string;
    user_agent: string;
    invitation_source: string;
    security_level: string;
  };
  config: {
    locale: string;
    timezone: string;
    expected_role: string;
    auto_confirm: boolean;
  };
}

export {};
