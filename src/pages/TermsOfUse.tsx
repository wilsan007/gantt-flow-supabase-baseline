import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfUse = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Conditions d'Utilisation</CardTitle>
          <p className="text-muted-foreground">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="mb-2 text-xl font-semibold">1. Acceptation des Conditions</h2>
            <p>
              En accédant et en utilisant la plateforme Wadashaqayn.org, vous acceptez d'être lié
              par les présentes Conditions d'Utilisation. Si vous n'acceptez pas ces conditions,
              veuillez ne pas utiliser nos services.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">2. Description du Service</h2>
            <p>
              Wadashaqayn est une plateforme SaaS fournissant des outils de gestion des ressources
              humaines, de gestion de projets et de collaboration pour les entreprises et
              organisations.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">3. Compte Utilisateur</h2>
            <p>
              Vous êtes responsable de maintenir la confidentialité de votre compte et de votre mot
              de passe. Vous acceptez d'accepter la responsabilité de toutes les activités qui se
              produisent sous votre compte.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">4. Utilisation Acceptable</h2>
            <p>Vous acceptez de ne pas utiliser le service pour :</p>
            <ul className="list-disc pl-6">
              <li>Violer des lois ou réglementations.</li>
              <li>Transmettre du contenu illégal ou nuisible.</li>
              <li>Tenter d'accéder sans autorisation à nos systèmes.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">5. Propriété Intellectuelle</h2>
            <p>
              Le service et son contenu original, ses fonctionnalités et sa conception sont et
              resteront la propriété exclusive de Wadashaqayn et de ses concédants de licence.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">6. Limitation de Responsabilité</h2>
            <p>
              Wadashaqayn ne sera pas responsable des dommages indirects, accessoires, spéciaux,
              consécutifs ou punitifs résultant de votre accès ou de votre utilisation du service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">7. Modification des Conditions</h2>
            <p>
              Nous nous réservons le droit de modifier ces conditions à tout moment. Les
              modifications entreront en vigueur dès leur publication sur la plateforme.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsOfUse;
