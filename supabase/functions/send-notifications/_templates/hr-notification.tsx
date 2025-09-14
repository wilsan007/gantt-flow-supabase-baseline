import React from 'npm:react@18.3.1';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Button,
  Hr
} from 'npm:@react-email/components@0.0.22';

interface HRNotificationEmailProps {
  recipientName: string;
  notificationType: 'leave_request' | 'expense_report' | 'hr_alert';
  status?: 'submitted' | 'approved' | 'rejected';
  entityTitle: string;
  message: string;
  entityUrl?: string;
  submitterName?: string;
  amount?: number;
  startDate?: string;
  endDate?: string;
}

export const HRNotificationEmail = ({
  recipientName,
  notificationType,
  status,
  entityTitle,
  message,
  entityUrl,
  submitterName,
  amount,
  startDate,
  endDate
}: HRNotificationEmailProps) => {
  const getNotificationTitle = () => {
    switch (notificationType) {
      case 'leave_request':
        if (status === 'submitted') return '🏖️ Nouvelle demande de congé';
        if (status === 'approved') return '✅ Demande de congé approuvée';
        if (status === 'rejected') return '❌ Demande de congé refusée';
        return '📅 Notification de congé';
      case 'expense_report':
        if (status === 'submitted') return '💰 Nouvelle note de frais';
        if (status === 'approved') return '✅ Note de frais approuvée';
        if (status === 'rejected') return '❌ Note de frais refusée';
        return '💳 Notification de frais';
      case 'hr_alert':
        return '⚠️ Alerte RH';
      default:
        return '📢 Notification RH';
    }
  };

  const getIcon = () => {
    switch (notificationType) {
      case 'leave_request': return '🏖️';
      case 'expense_report': return '💰';
      case 'hr_alert': return '⚠️';
      default: return '📢';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'approved': return '#16a34a';
      case 'rejected': return '#dc2626';
      case 'submitted': return '#2563eb';
      default: return '#6b7280';
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{getNotificationTitle()} - {entityTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {getIcon()} {getNotificationTitle()}
          </Heading>
          
          <Text style={greeting}>Bonjour {recipientName},</Text>
          
          <Section style={messageSection}>
            <Text style={message}>{message}</Text>
          </Section>

          <Section style={detailsSection}>
            <Text style={entityTitle}>📋 Objet : <strong>{entityTitle}</strong></Text>
            
            {submitterName && (
              <Text style={detailInfo}>👤 Demandeur : {submitterName}</Text>
            )}
            
            {status && (
              <Text style={detailInfo}>
                📊 Statut : 
                <span style={{
                  ...statusBadge,
                  backgroundColor: getStatusColor()
                }}>
                  {status === 'submitted' && 'Soumis'}
                  {status === 'approved' && 'Approuvé'}
                  {status === 'rejected' && 'Refusé'}
                </span>
              </Text>
            )}
            
            {amount && (
              <Text style={detailInfo}>💶 Montant : {amount}€</Text>
            )}
            
            {startDate && endDate && (
              <Text style={detailInfo}>
                📅 Période : du {new Date(startDate).toLocaleDateString('fr-FR')} au {new Date(endDate).toLocaleDateString('fr-FR')}
              </Text>
            )}
          </Section>

          {entityUrl && (
            <Section style={buttonSection}>
              <Button style={button} href={entityUrl}>
                Voir les détails
              </Button>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            Cette notification RH a été générée automatiquement.
            <br />
            Pour toute question, contactez le service des ressources humaines.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default HRNotificationEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  lineHeight: '32px',
};

const greeting = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 20px',
};

const messageSection = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #0ea5e9',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const message = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
};

const detailsSection = {
  margin: '24px 0',
};

const entityTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '0 0 12px',
};

const detailInfo = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px',
};

const statusBadge = {
  color: '#ffffff',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '600',
  marginLeft: '8px',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#0ea5e9',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const footer = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
};