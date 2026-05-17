const fs = require('fs');
const path = require('path');
// Importation de ton modèle
const Infraction = require('../models/dataModels'); 

/**
 * Fonction métier pour traiter une infraction (sauvegarde image + BDD + WebSocket)
 * @param {Number} vitesse - La vitesse mesurée
 * @param {String} inf_id - L'identifiant de l'infraction
 * @param {String} imageBase64 - L'image encodée (optionnel)
 * @param {String} RadarId - L'identifiant du radar
 * @param {Object} io - Instance Socket.io pour notifications WebSocket
 */
const traiterNouvelleInfraction = async (vitesse, inf_id, imageBase64, RadarId, io) => {
  try {
    // 1. Préparation du dossier de destination
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 2. Création éventuelle des chemins et sauvegarde physique de l'image
    let cheminRelatif = '';
    if (imageBase64) {
      const nomFichier = `radar-${Date.now()}.jpg`;
      const cheminAbsolu = path.join(uploadDir, nomFichier);
      cheminRelatif = path.join('uploads', nomFichier);

      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(cheminAbsolu, base64Data, 'base64');
      console.log(`📸 Image sauvegardée : ${nomFichier}`);
    } else {
      console.log('ℹ️ Aucune image reçue via MQTT, enregistrement sans image.');
    }

    // 3. Sauvegarde dans MongoDB via le Modèle
    const infractionId = inf_id || `INF-${Date.now()}`;

    const nouvelleInfraction = new Infraction({
      vitesse,
      inf_id: infractionId,
      imagePath : '', // Utilisation d'une image par défaut
      RadarId
    });

    await nouvelleInfraction.save();
    console.log(`💾 Infraction enregistrée en base de données (${vitesse} cm/s)`);

    // 4. Diffusion de l'alerte en temps réel via WebSocket
    if (io) {
      io.emit('nouvelle_alerte', nouvelleInfraction);
      console.log('🚀 Alerte diffusée via WebSocket à l’application web/mobile.');
    }

  } catch (e) {
    console.error("❌ Erreur dans le contrôleur lors du traitement :", e.message);
    throw e;
  }
};

module.exports = { traiterNouvelleInfraction };
