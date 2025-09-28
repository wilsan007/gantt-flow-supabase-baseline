import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Assuming an AuthContext exists
import { supabase } from '../../lib/supabaseClient'; // Assuming a supabase client is exported from here

// --- Reusable UI Components (in a real app, these would be in separate files) ---

// InvitationForm Component
const InvitationForm = ({ onInvitationSent }) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { session } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await supabase.functions.invoke('send-tenant-invitation', {
        body: { email, full_name: fullName },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.error) throw new Error(data.error);

      setSuccess('Invitation sent successfully!');
      setEmail('');
      setFullName('');
      if (onInvitationSent) onInvitationSent(); // Callback to refresh the list

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px' }}>
      <h2>Invite New Tenant Owner</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="fullName">Full Name:</label><br/>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ width: '300px', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="email">Email:</label><br/>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '300px', padding: '8px' }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '10px 20px' }}>
          {loading ? 'Sending...' : 'Send Invitation'}
        </button>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
      </form>
    </div>
  );
};

// InvitationsList Component
const InvitationsList = ({ refreshKey }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { session } = useAuth();


  useEffect(() => {
    const fetchInvitations = async () => {
      setLoading(true);
      setError('');
      try {
        // RLS policy ensures only super admin can see this.
        const { data, error } = await supabase
          .from('invitations')
          .select('id, email, full_name, status, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setInvitations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, [refreshKey]); // Refetch when the key changes

  if (loading) return <p>Loading pending invitations...</p>;
  if (error) return <p style={{ color: 'red' }}>Error fetching invitations: {error}</p>;

  return (
    <div>
      <h2>Pending Invitations</h2>
      {invitations.length === 0 ? (
        <p>No pending invitations.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Email</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Full Name</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Sent At</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map((inv) => (
              <tr key={inv.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{inv.email}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{inv.full_name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(inv.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};


// --- Main Page Component ---

const SuperAdminDashboardPage = () => {
  const { isSuperAdmin, loading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0); // State to trigger list refresh

  if (loading) {
    return <div>Loading user information...</div>;
  }

  if (!isSuperAdmin) {
    return (
      <div>
        <h1>Access Denied</h1>
        <p>You must be a Super Admin to view this page.</p>
      </div>
    );
  }

  const handleInvitationSent = () => {
    setRefreshKey(prevKey => prevKey + 1); // Increment key to trigger useEffect in list
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <h1>Super Admin Dashboard</h1>
      <InvitationForm onInvitationSent={handleInvitationSent} />
      <InvitationsList refreshKey={refreshKey} />
    </div>
  );
};

export default SuperAdminDashboardPage;