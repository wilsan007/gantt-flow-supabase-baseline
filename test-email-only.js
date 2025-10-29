/**
 * 🧪 TEST ENVOI EMAIL UNIQUEMENT
 * 
 * Test pour vérifier si l'envoi d'email fonctionne
 */

import { config } from 'dotenv';

config();

async function testEmailOnly() {
  console.log('🧪 ===== TEST ENVOI EMAIL RESEND =====');
  console.log('🎯 Test direct de l\'API Resend');
  console.log('');

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY manquante dans .env');
    return;
  }

  console.log('✅ RESEND_API_KEY trouvée:', RESEND_API_KEY.substring(0, 10) + '...');

  try {
    const timestamp = Date.now();
    const testEmail = 'osman.awaleh.adn@gmail.com';
    
    const emailData = {
      from: 'Wadashaqeen <onboarding@resend.dev>',
      to: [testEmail],
      subject: `[TEST DIRECT] Email Test ${timestamp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #007bff; color: white; padding: 20px; text-align: center;">
            <h1>🧪 Test Email Direct</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd;">
            <p>Ceci est un test direct de l'API Resend.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Test ID:</strong> ${timestamp}</p>
          </div>
        </div>
      `
    };

    console.log('📧 Données email:');
    console.log('   - From:', emailData.from);
    console.log('   - To:', emailData.to);
    console.log('   - Subject:', emailData.subject);

    console.log('');
    console.log('📤 Envoi via API Resend...');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    console.log('📊 Réponse Resend:');
    console.log('   - Status:', response.status);
    console.log('   - Status Text:', response.statusText);

    const responseText = await response.text();

    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('');
        console.log('✅ EMAIL ENVOYÉ AVEC SUCCÈS !');
        console.log('   - ID Email:', result.id);
        console.log('   - Destinataire:', testEmail);
        console.log('   - Sujet:', emailData.subject);
        console.log('');
        console.log('📬 Vérifiez votre boîte email:', testEmail);
      } catch (parseError) {
        console.log('✅ Email envoyé (réponse texte):', responseText);
      }
    } else {
      console.log('');
      console.log('❌ ERREUR ENVOI EMAIL:');
      console.log('Status:', response.status);
      console.log('Response:', responseText);
      
      if (response.status === 401) {
        console.log('💡 Problème d\'authentification - Vérifiez RESEND_API_KEY');
      } else if (response.status === 422) {
        console.log('💡 Problème de validation - Vérifiez les données email');
      }
    }

  } catch (error) {
    console.error('💥 Erreur:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('');
  console.log('🏁 Test email terminé');
}

testEmailOnly().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
