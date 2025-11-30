import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Politique de Confidentialité</CardTitle>
          <p className="text-muted-foreground">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="mb-2 text-xl font-semibold">1. Introduction</h2>
            <p>
              Bienvenue sur Wadashaqayn.org. Nous nous engageons à protéger votre vie privée et vos
              données personnelles. Cette politique de confidentialité explique comment nous
              collectons, utilisons, divulguons et protégeons vos informations lorsque vous utilisez
              notre plateforme SaaS de gestion RH et de projets.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">2. Collecte des Informations</h2>
            <p>Nous collectons les informations suivantes :</p>
            <ul className="list-disc pl-6">
              <li>Informations d'identification (nom, adresse email, numéro de téléphone).</li>
              <li>Informations professionnelles (poste, département, historique de l'emploi).</li>
              <li>Données d'utilisation de la plateforme (logs, activités).</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">3. Utilisation des Informations</h2>
            <p>Nous utilisons vos informations pour :</p>
            <ul className="list-disc pl-6">
              <li>Fournir et maintenir nos services.</li>
              <li>Gérer votre compte et vos accès.</li>
              <li>Améliorer nos fonctionnalités et l'expérience utilisateur.</li>
              <li>Communiquer avec vous concernant les mises à jour et le support.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">4. Protection des Données</h2>
            <p>
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles
              appropriées pour protéger vos données contre l'accès non autorisé, la modification, la
              divulgation ou la destruction.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">5. Vos Droits</h2>
            <p>
              Conformément à la réglementation en vigueur, vous disposez d'un droit d'accès, de
              rectification, de suppression et de portabilité de vos données. Pour exercer ces
              droits, veuillez nous contacter.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">6. Contact</h2>
            <p>
              Pour toute question concernant cette politique de confidentialité, veuillez nous
              contacter à : contact@wadashaqayn.org
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
