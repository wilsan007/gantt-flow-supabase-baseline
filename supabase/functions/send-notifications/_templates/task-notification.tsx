import React from 'npm:react@18.3.1';
import { Body, Container, Head, Heading, Html, Preview, Text, Section, Button, Hr } from 'npm:@react-email/components@0.0.22';
export const TaskNotificationEmail = ({ recipientName, taskTitle, notificationType, message, taskUrl, priority, dueDate, projectName })=>{
  const getNotificationTitle = ()=>{
    switch(notificationType){
      case 'assigned':
        return '📝 Nouvelle tâche assignée';
      case 'updated':
        return '✏️ Tâche mise à jour';
      case 'comment_added':
        return '💬 Nouveau commentaire';
      case 'deadline_approaching':
        return '⏰ Échéance proche';
      default:
        return '📢 Notification de tâche';
    }
  };
  const getPriorityColor = ()=>{
    switch(priority){
      case 'urgent':
        return '#dc2626';
      case 'high':
        return '#ea580c';
      case 'medium':
        return '#2563eb';
      case 'low':
        return '#16a34a';
      default:
        return '#6b7280';
    }
  };
  const getPriorityLabel = ()=>{
    switch(priority){
      case 'urgent':
        return 'Urgent';
      case 'high':
        return 'Haute';
      case 'medium':
        return 'Moyenne';
      case 'low':
        return 'Faible';
      default:
        return 'Normale';
    }
  };
  return /*#__PURE__*/ React.createElement(Html, null, /*#__PURE__*/ React.createElement(Head, null), /*#__PURE__*/ React.createElement(Preview, null, getNotificationTitle(), " - ", taskTitle), /*#__PURE__*/ React.createElement(Body, {
    style: main
  }, /*#__PURE__*/ React.createElement(Container, {
    style: container
  }, /*#__PURE__*/ React.createElement(Heading, {
    style: h1
  }, getNotificationTitle()), /*#__PURE__*/ React.createElement(Text, {
    style: greeting
  }, "Bonjour ", recipientName, ","), /*#__PURE__*/ React.createElement(Section, {
    style: messageSection
  }, /*#__PURE__*/ React.createElement(Text, {
    style: message
  }, message)), /*#__PURE__*/ React.createElement(Section, {
    style: taskDetailsSection
  }, /*#__PURE__*/ React.createElement(Text, {
    style: taskTitle
  }, "📋 Tâche : ", /*#__PURE__*/ React.createElement("strong", null, taskTitle)), projectName && /*#__PURE__*/ React.createElement(Text, {
    style: projectInfo
  }, "🎯 Projet : ", projectName), /*#__PURE__*/ React.createElement(Text, {
    style: priorityInfo
  }, "🔥 Priorité :", /*#__PURE__*/ React.createElement("span", {
    style: {
      ...priorityBadge,
      backgroundColor: getPriorityColor()
    }
  }, getPriorityLabel())), dueDate && /*#__PURE__*/ React.createElement(Text, {
    style: dueDateInfo
  }, "📅 Échéance : ", new Date(dueDate).toLocaleDateString('fr-FR'))), taskUrl && /*#__PURE__*/ React.createElement(Section, {
    style: buttonSection
  }, /*#__PURE__*/ React.createElement(Button, {
    style: button,
    href: taskUrl
  }, "Voir la tâche")), /*#__PURE__*/ React.createElement(Hr, {
    style: hr
  }), /*#__PURE__*/ React.createElement(Text, {
    style: footer
  }, "Cette notification a été générée automatiquement par votre système de gestion de projet.", /*#__PURE__*/ React.createElement("br", null), "Si vous ne souhaitez plus recevoir ces notifications, vous pouvez les désactiver dans vos préférences."))));
};
export default TaskNotificationEmail;
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif'
};
const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px'
};
const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  lineHeight: '32px'
};
const greeting = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 20px'
};
const messageSection = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0'
};
const message = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0'
};
const taskDetailsSection = {
  margin: '24px 0'
};
const taskTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '0 0 12px'
};
const projectInfo = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px'
};
const priorityInfo = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px'
};
const priorityBadge = {
  color: '#ffffff',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '600',
  marginLeft: '8px'
};
const dueDateInfo = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0'
};
const buttonSection = {
  textAlign: 'center',
  margin: '32px 0'
};
const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '12px 24px'
};
const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0'
};
const footer = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center'
};
