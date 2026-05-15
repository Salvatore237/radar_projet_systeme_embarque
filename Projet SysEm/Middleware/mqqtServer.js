// services/mqttService.js

const mqtt = require('mqtt');

// 1. On importe la fonction de notre contrôleur (notre logique métier)
const { traiterNouvelleInfraction } = require('../Controller/dataController');

/**
 * Fonction pour initialiser la connexion MQTT et écouter le radar
 * @param {Object} io - L'instance Socket.io pour la communication WebSocket
 */
function connectMqttClient(io) {
  const client = mqtt.connect('mqtt://127.0.0.1:1883');

  client.on('connect', () => {
    console.log('✅ MQTT client connected to the Broker');

    client.subscribe('esp32/Radar', (err) => {
      if (err) {
        console.error('❌ Failed to subscribe to topic:', err);
      } else {
        console.log('📥 Subscribed to topic: esp32/Radar');
      }
    });
  });

  client.on('message', async (topic, message) => {
    if (topic !== 'esp32/Radar') {
      return; // On ignore les messages qui ne viennent pas de notre radar
    }

    const payload = message.toString();
    let rawData;

    try {
      rawData = JSON.parse(payload);
    } catch (error) {
      console.error("Erreur de parsing JSON depuis MQTT. Verifie le format envoye par l'ESP32 :", error.message);
      console.error('Message recu depuis MQTT :', payload);
      return;
    }

    try {
      // 2. On extrait UNIQUEMENT ce que l'ESP envoie (vitesse, image, RadarId)
      // On ne demande pas l'inf_id, car c'est le contrôleur qui le créera.
      const { vitesse, inf_id, imageBase64, RadarId } = rawData;

      // 3. Vérification que les données essentielles sont là
      if (vitesse == null || !RadarId) {
        console.error("⚠️ Données incomplètes venant de l'ESP32.");
        return;
      }

      // 4. On passe les données à notre contrôleur pour qu'il fasse le travail
      await traiterNouvelleInfraction(vitesse, inf_id, imageBase64, RadarId, io);

    } catch (error) {
      console.error("Erreur lors du traitement du message MQTT :", error.message);
    }
  });
}

module.exports = { connectMqttClient };