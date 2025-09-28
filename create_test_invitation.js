import fs from 'fs/promises';
import pg from 'pg';
import crypto from 'crypto';

const { Client } = pg;

// This script creates a test invitation directly in the database
// and outputs the token needed for frontend testing.
async function createTestInvitation() {
  console.log('Starting test invitation creation script...');

  const client = new Client({
    connectionString: JSON.parse(await fs.readFile('db-config.json', 'utf-8')).database.connection_string,
  });

  try {
    await client.connect();
    console.log('Database connection successful.');

    // Generate data for the new invitation
    const testEmail = `test-user-${crypto.randomBytes(4).toString('hex')}@example.com`;
    const testFullName = 'Test User';
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const tenantId = crypto.randomUUID();

    // Insert the new invitation record
    const query = `
      INSERT INTO public.invitations
        (email, full_name, token, tenant_id, invitation_type, status, expires_at)
      VALUES
        ($1, $2, $3, $4, 'tenant_owner', 'pending', now() + interval '1 day')
      RETURNING token;
    `;
    const values = [testEmail, testFullName, invitationToken, tenantId];

    const result = await client.query(query, values);
    const createdToken = result.rows[0].token;

    console.log('\n--- Test Invitation Created ---');
    console.log(`Email: ${testEmail}`);
    console.log(`Token: ${createdToken}`);
    console.log('---------------------------------');
    console.log('\nUse this token to test the signup page.');

  } catch (error) {
    // Check for a specific error related to missing functions from migrations not being applied
    if (error.message.includes('relation "invitations" does not exist')) {
        console.error('\nFATAL ERROR: The "invitations" table was not found.');
        console.error('This likely means the database migrations have not been applied.');
        console.error('Please run the equivalent of "supabase db push" or "supabase migration up" to apply the schema changes before testing.');
    } else {
        console.error('An error occurred:', error);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

createTestInvitation();