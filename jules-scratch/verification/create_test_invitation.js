import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';
const supabase = createClient(supabaseUrl, supabaseKey);

function generateSecureToken(length = 40) {
  return crypto.randomBytes(length).toString('hex');
}

async function createTestInvitation() {
  // FIX: Use a valid domain for test emails
  const testEmail = `test-user-${Date.now()}@test-company.com`;
  const testFullName = 'Test User';
  const invitationToken = generateSecureToken();
  const futureTenantId = crypto.randomUUID();

  try {
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        token: invitationToken,
        email: testEmail,
        full_name: testFullName,
        tenant_id: futureTenantId,
        invitation_type: 'tenant_owner',
        expires_at: new Date(Date.now() + 1 * 3600 * 1000).toISOString(), // Expires in 1 hour
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(JSON.stringify({
      success: true,
      token: data.token,
      email: data.email,
      fullName: data.full_name,
      message: 'Test invitation created successfully.'
    }));

  } catch (error) {
    console.error(JSON.stringify({ success: false, error: error.message }));
  }
}

createTestInvitation();