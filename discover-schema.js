import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function discoverSchema() {
  console.log('🔍 DÉCOUVERTE AUTOMATIQUE DU SCHÉMA');
  console.log('==================================');
  
  try {
    // 1. Trouver les tables candidates
    console.log('\n1️⃣ Recherche des tables candidates...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')
      .or('table_name.ilike.%invitation%,table_name.ilike.%tenant%,table_name.ilike.%profile%,table_name.ilike.%employee%,table_name.ilike.%role%,table_name.ilike.%permission%,table_name.ilike.%user_role%');
    
    if (tablesError) {
      console.error('❌ Erreur requête tables:', tablesError);
      return;
    }
    
    console.log('📋 Tables trouvées:');
    tables?.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    // 2. Mapper les tables par type
    const schemaMap = {
      invitations_table: null,
      tenants_table: null,
      profiles_table: null,
      employees_table: null,
      roles_table: null,
      permissions_table: null,
      role_permissions_table: null,
      user_roles_table: null
    };
    
    tables?.forEach(table => {
      const name = table.table_name.toLowerCase();
      
      if (name.includes('invitation')) {
        schemaMap.invitations_table = table.table_name;
      } else if (name.includes('tenant')) {
        schemaMap.tenants_table = table.table_name;
      } else if (name.includes('profile')) {
        schemaMap.profiles_table = table.table_name;
      } else if (name.includes('employee')) {
        schemaMap.employees_table = table.table_name;
      } else if (name === 'roles' || name.includes('role') && !name.includes('user') && !name.includes('permission')) {
        schemaMap.roles_table = table.table_name;
      } else if (name.includes('permission') && !name.includes('role')) {
        schemaMap.permissions_table = table.table_name;
      } else if (name.includes('role_permission') || name.includes('permission_role')) {
        schemaMap.role_permissions_table = table.table_name;
      } else if (name.includes('user_role') || name.includes('role_user')) {
        schemaMap.user_roles_table = table.table_name;
      }
    });
    
    console.log('\n2️⃣ Mapping des tables:');
    Object.entries(schemaMap).forEach(([key, value]) => {
      console.log(`   ${key}: ${value || '❌ NON TROUVÉE'}`);
    });
    
    // 3. Inspecter les colonnes des tables trouvées
    console.log('\n3️⃣ Inspection des colonnes...');
    
    const tableNames = Object.values(schemaMap).filter(Boolean);
    const columnMappings = {};
    
    for (const tableName of tableNames) {
      console.log(`\n📋 Table: ${tableName}`);
      
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');
      
      if (columnsError) {
        console.error(`❌ Erreur colonnes ${tableName}:`, columnsError);
        continue;
      }
      
      columnMappings[tableName] = {};
      columns?.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}${col.is_nullable === 'YES' ? ', nullable' : ''})`);
        columnMappings[tableName][col.column_name] = col;
      });
    }
    
    // 4. Heuristiques d'assignation des colonnes
    console.log('\n4️⃣ Mapping des colonnes par heuristiques...');
    
    const columnMap = {};
    
    // Invitations
    if (schemaMap.invitations_table) {
      const invCols = columnMappings[schemaMap.invitations_table];
      columnMap.invitations = {
        table: schemaMap.invitations_table,
        code: findColumn(invCols, ['code', 'id', 'token']),
        email: findColumn(invCols, ['email']),
        slug: findColumn(invCols, ['slug', 'tenant_slug']),
        tenant_name: findColumn(invCols, ['tenant_name', 'company_name', 'name']),
        expires_at: findColumn(invCols, ['expires_at', 'expiry', 'expired_at']),
        used_at: findColumn(invCols, ['used_at', 'consumed_at', 'accepted_at'])
      };
    }
    
    // Tenants
    if (schemaMap.tenants_table) {
      const tenantCols = columnMappings[schemaMap.tenants_table];
      columnMap.tenants = {
        table: schemaMap.tenants_table,
        id: findColumn(tenantCols, ['id']),
        slug: findColumn(tenantCols, ['slug']),
        name: findColumn(tenantCols, ['name', 'company_name', 'title'])
      };
    }
    
    // Profiles
    if (schemaMap.profiles_table) {
      const profileCols = columnMappings[schemaMap.profiles_table];
      columnMap.profiles = {
        table: schemaMap.profiles_table,
        id: findColumn(profileCols, ['id', 'user_id']),
        email: findColumn(profileCols, ['email']),
        tenant_id: findColumn(profileCols, ['tenant_id'])
      };
    }
    
    // Roles
    if (schemaMap.roles_table) {
      const roleCols = columnMappings[schemaMap.roles_table];
      columnMap.roles = {
        table: schemaMap.roles_table,
        id: findColumn(roleCols, ['id']),
        code: findColumn(roleCols, ['code', 'name', 'slug'])
      };
    }
    
    // User Roles
    if (schemaMap.user_roles_table) {
      const urCols = columnMappings[schemaMap.user_roles_table];
      columnMap.user_roles = {
        table: schemaMap.user_roles_table,
        tenant_id: findColumn(urCols, ['tenant_id']),
        user_id: findColumn(urCols, ['user_id']),
        role_id: findColumn(urCols, ['role_id'])
      };
    }
    
    // Employees (optionnel)
    if (schemaMap.employees_table) {
      const empCols = columnMappings[schemaMap.employees_table];
      columnMap.employees = {
        table: schemaMap.employees_table,
        tenant_id: findColumn(empCols, ['tenant_id']),
        user_id: findColumn(empCols, ['user_id']),
        title: findColumn(empCols, ['title', 'position', 'role', 'job_title'])
      };
    }
    
    console.log('\n5️⃣ MAPPING FINAL:');
    console.log('================');
    console.log(JSON.stringify(columnMap, null, 2));
    
    // 6. Générer le code SQL avec les vrais noms
    console.log('\n6️⃣ Génération du code SQL...');
    generateSQLFunction(columnMap);
    
    return columnMap;
    
  } catch (err) {
    console.error('💥 Erreur découverte schéma:', err);
  }
}

function findColumn(columns, candidates) {
  for (const candidate of candidates) {
    if (columns[candidate]) {
      return candidate;
    }
  }
  return candidates[0]; // fallback
}

function generateSQLFunction(columnMap) {
  const inv = columnMap.invitations;
  const tenant = columnMap.tenants;
  const profile = columnMap.profiles;
  const role = columnMap.roles;
  const userRole = columnMap.user_roles;
  const employee = columnMap.employees;
  
  console.log(`
-- FONCTION SQL GÉNÉRÉE AUTOMATIQUEMENT
CREATE OR REPLACE FUNCTION public.onboard_tenant_owner(
  p_user_id uuid,
  p_email text,
  p_slug text,
  p_tenant_name text,
  p_invite_code uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
  v_role_id uuid;
BEGIN
  -- 1) Valider l'invitation
  PERFORM 1
  FROM public.${inv?.table || 'invitations'}
  WHERE ${inv?.code || 'code'} = p_invite_code
    AND lower(${inv?.email || 'email'}) = lower(p_email)
    AND ${inv?.used_at || 'used_at'} IS NULL
    AND ${inv?.expires_at || 'expires_at'} > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_expired_invite';
  END IF;

  -- 2) Créer ou récupérer le tenant par slug
  SELECT ${tenant?.id || 'id'} INTO v_tenant_id
  FROM public.${tenant?.table || 'tenants'}
  WHERE ${tenant?.slug || 'slug'} = p_slug;

  IF v_tenant_id IS NULL THEN
    INSERT INTO public.${tenant?.table || 'tenants'} (${tenant?.slug || 'slug'}, ${tenant?.name || 'name'})
    VALUES (p_slug, p_tenant_name)
    RETURNING ${tenant?.id || 'id'} INTO v_tenant_id;
  END IF;

  -- 3) Upsert profil utilisateur
  INSERT INTO public.${profile?.table || 'profiles'} (${profile?.id || 'user_id'}, ${profile?.email || 'email'})
  VALUES (p_user_id, p_email)
  ON CONFLICT (${profile?.id || 'user_id'}) DO UPDATE
    SET ${profile?.email || 'email'} = EXCLUDED.${profile?.email || 'email'};

  -- 4) Associer le rôle tenant_admin
  SELECT ${role?.id || 'id'} INTO v_role_id
  FROM public.${role?.table || 'roles'}
  WHERE ${role?.code || 'code'} = 'tenant_admin';

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'role_tenant_admin_missing';
  END IF;

  INSERT INTO public.${userRole?.table || 'user_roles'} (${userRole?.tenant_id || 'tenant_id'}, ${userRole?.user_id || 'user_id'}, ${userRole?.role_id || 'role_id'})
  VALUES (v_tenant_id, p_user_id, v_role_id)
  ON CONFLICT (${userRole?.tenant_id || 'tenant_id'}, ${userRole?.user_id || 'user_id'}, ${userRole?.role_id || 'role_id'}) DO NOTHING;

  ${employee ? `
  -- 5) Fiche employé (optionnel)
  BEGIN
    INSERT INTO public.${employee.table} (${employee.tenant_id}, ${employee.user_id}, ${employee.title})
    VALUES (v_tenant_id, p_user_id, 'Tenant Owner')
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN undefined_table THEN
    -- Table employees n'existe pas, on ignore
  END;
  ` : '-- 5) Pas de table employees détectée'}

  -- 6) Consommer l'invitation
  UPDATE public.${inv?.table || 'invitations'}
     SET ${inv?.used_at || 'used_at'} = now()
   WHERE ${inv?.code || 'code'} = p_invite_code
     AND ${inv?.used_at || 'used_at'} IS NULL;

  RETURN json_build_object('tenant_id', v_tenant_id, 'slug', p_slug, 'status', 'ok');
END;
$$;
  `);
}

// Exécuter la découverte
discoverSchema();
