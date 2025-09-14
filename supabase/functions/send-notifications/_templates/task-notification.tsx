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

interface TaskNotificationEmailProps {
  recipientName: string;
  taskTitle: string;
  notificationType: 'assigned' | 'updated' | 'comment_added' | 'deadline_approaching';
  message: string;
  taskUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  projectName?: string;
}

export const TaskNotificationEmail = ({
  recipientName,
  taskTitle,
  notificationType,
  message,
  taskUrl,
  priority,
  dueDate,
  projectName
}: TaskNotificationEmailProps) => {
  const getNotificationTitle = () => {
    switch (notificationType) {
      case 'assigned': return '📝 Nouvelle tâche assignée';
      case 'updated': return '✏️ Tâche mise à jour';
      case 'comment_added': return '💬 Nouveau commentaire';
      case 'deadline_approaching': return '⏰ Échéance proche';
      default: return '📢 Notification de tâche';
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'urgent': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#2563eb';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getPriorityLabel = () => {
    switch (priority) {
      case 'urgent': return 'Urgent';
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Faible';
      default: return 'Normale';
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{getNotificationTitle()} - {taskTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{getNotificationTitle()}</Heading>
          
          <Text style={greeting}>Bonjour {recipientName},</Text>
          
          <Section style={messageSection}>
            <Text style={message}>{message}</Text>
          </Section>

          <Section style={taskDetailsSection}>
            <Text style={taskTitle}>📋 Tâche : <strong>{taskTitle}</strong></Text>
            
            {projectName && (
              <Text style={projectInfo}>🎯 Projet : {projectName}</Text>
            )}
            
            <Text style={priorityInfo}>
              🔥 Priorité : 
              <span style={{
                ...priorityBadge,
                backgroundColor: getPriorityColor()
              }}>
                {getPriorityLabel()}
              </span>
            </Text>
            
            {dueDate && (
              <Text style={dueDateInfo}>📅 Échéance : {new Date(dueDate).toLocaleDateString('fr-FR')}</Text>
            )}
          </Section>

          {taskUrl && (
            <Section style={buttonSection}>
              <Button style={button} href={taskUrl}>
                Voir la tâche
              </Button>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            Cette notification a été générée automatiquement par votre système de gestion de projet.
            <br />
            Si vous ne souhaitez plus recevoir ces notifications, vous pouvez les désactiver dans vos préférences.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default TaskNotificationEmail;

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
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
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

const taskDetailsSection = {
  margin: '24px 0',
};

const taskTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '0 0 12px',
};

const projectInfo = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px',
};

const priorityInfo = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px',
};

const priorityBadge = {
  color: '#ffffff',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '600',
  marginLeft: '8px',
};

const dueDateInfo = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2563eb',
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