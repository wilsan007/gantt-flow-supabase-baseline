import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Auth } from '@/components/Auth';

export default function InvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<"idle"|"auth"|"calling"|"error">("idle");
  const [error, setError] = useState<string>("");
  
  const code = searchParams.get('code') ?? "";

  useEffect(() => {
    (async () => {
      if (!code) { 
        setError("Lien invalide"); 
        setStatus("error"); 
        return; 
      }

      setStatus("auth");
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        setError("Veuillez vous connecter pour poursuivre.");
        setStatus("error");
        return;
      }

      try {
        setStatus("calling");
        const token = sessionData.session.access_token;
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboard-tenant-owner`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }),
          }
        );

        if (!resp.ok) throw new Error(await resp.text());

        const data = await resp.json() as { tenant_id: string; slug: string; status: string };
        navigate(`/dashboard`, { replace: true }); // Simplifier la redirection pour l'instant
      } catch (e: any) {
        setError(e?.message || "Erreur serveur");
        setStatus("error");
      }
    })();
  }, [code, navigate]);

  if (status === "auth" || status === "calling") {
    return <div className="p-6">Validation de l'invitation…</div>;
  }

  if (status === "error") {
    return (
      <div className="max-w-md mx-auto p-6 space-y-3">
        <h1 className="text-xl font-semibold">Invitation</h1>
        <p className="text-red-600">{error}</p>
        {error.includes("connecter") && (
          <Auth onAuthStateChange={() => window.location.reload()} />
        )}
      </div>
    );
  }

  return null;
}
