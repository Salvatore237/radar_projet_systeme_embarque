#include <WiFi.h>
#include <PubSubClient.h>
#include <math.h>

// ======================================================
// CONFIGURATION WIFI
// ======================================================
const char* ssid = "Fred's Galaxy S20 FE 5G";
const char* password = "qqqqqqqq";

// ======================================================
// CONFIGURATION MQTT
// ======================================================
const char* mqtt_server = "10.249.98.140";   // IP du serveur Mosquitto
const int mqtt_port = 1883;
const char* mqtt_topic = "esp32/Radar";

WiFiClient espClient;
PubSubClient client(espClient);

// ======================================================
// CONFIGURATION HC-SR04 & LEDS
// ======================================================
#define TRIG_PIN 23
#define ECHO_PIN 18

#define LED_FONCTIONNEMENT_PIN 2
#define LED_INFRACTION_PIN 4

const float VITESSE_SON = 343.0;

// Période réelle entre 2 mesures
const float DELTA_T = 0.1;          // 100 ms

// Seuil de vitesse en cm/s
const float SEUIL_VITESSE = 80.0;

// Variation minimale ignorée pour éviter le bruit
const float ZONE_MORTE = 5.0;       // cm

// Nombre de mesures moyennées
const int NB_MESURES = 5;

// ======================================================
// VARIABLES RADAR & ETATS
// ======================================================
float distancePrecedente = 0;
float vitesseFiltree = 0;
float vitessVehicule = 0;

bool vehiculeDetecte = false;
unsigned long timerReset = 0;
const unsigned long DELAI_RESET = 3000; // 3 secondes

int compteurDetection = 0;

// ======================================================
// CONNEXION WIFI
// ======================================================
void setupWiFi() {
  Serial.print("Connexion au WiFi");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connecte");
  Serial.print("Adresse IP : ");
  Serial.println(WiFi.localIP());
}

// ======================================================
// RECONNEXION MQTT
// ======================================================
void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Connexion MQTT...");

    String clientId = "ESP32Radar-" + String(random(0xffff), HEX);

    if (client.connect(clientId.c_str())) {
      Serial.println("connecte");
    } else {
      Serial.print("echec, rc=");
      Serial.println(client.state());
      delay(2000);
    }
  }
}

// ======================================================
// MESURE DE DISTANCE MOYENNE
// ======================================================
float mesurerDistance() {
  float somme = 0;
  int mesuresValid = 0;

  for (int i = 0; i < NB_MESURES; i++) {
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);

    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);

    digitalWrite(TRIG_PIN, LOW);

    long duree = pulseIn(ECHO_PIN, HIGH, 20000);

    if (duree == 0) {
      delay(10);
      continue;
    }

    float distance = (duree * VITESSE_SON * 100.0) / 2000000.0;

    if (distance >= 2 && distance <= 400) {
      somme += distance;
      mesuresValid++;
    }

    delay(10);
  }

  if (mesuresValid == 0) return -1;

  return somme / mesuresValid;
}

// ======================================================
// PUBLICATION MQTT
// ======================================================
void publierDonnees(float vitesse) {
  String payload = "{";
  payload += "\"vitesse\":" + String((int)round(vitesse)) + ",";
  payload += "\"RadarId\":\"MOSQUITTO_CLI\"";
  payload += "}";

  client.publish(mqtt_topic, payload.c_str());

  Serial.println("Message MQTT publie :");
  Serial.println(payload);
}

// ======================================================
// SETUP
// ======================================================
void setup() {
  Serial.begin(115200);

  pinMode(LED_FONCTIONNEMENT_PIN, OUTPUT);
  pinMode(LED_INFRACTION_PIN, OUTPUT);

  digitalWrite(LED_FONCTIONNEMENT_PIN, HIGH);
  digitalWrite(LED_INFRACTION_PIN, LOW);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);

  setupWiFi();
  client.setServer(mqtt_server, mqtt_port);

  Serial.println("=== RADAR MQTT ACTIF ===");
}

// ======================================================
// LOOP
// ======================================================
void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  float distance = mesurerDistance();

  if (distance > 0) {
    if (distancePrecedente == 0) {
      distancePrecedente = distance;
    }

    // Variation de distance
    float variation = distancePrecedente - distance;
    distancePrecedente = distance;

    // Ignorer les petites variations dues au bruit
    if (fabs(variation) < ZONE_MORTE) {
      variation = 0;
    }

    // Calcul de la vitesse
    float vitesse = variation / DELTA_T;

    // Filtrage exponentiel
    vitesseFiltree = 0.7 * vitesseFiltree + 0.3 * vitesse;

    // Ignorer les vitesses négatives
    if (vitesseFiltree < 0) {
      vitesseFiltree = 0;
    }

    // Détection du véhicule
    if (vitesseFiltree > SEUIL_VITESSE) {
      compteurDetection++;

      if (vitesseFiltree > vitessVehicule) {
        vitessVehicule = vitesseFiltree;
      }

      // Il faut plusieurs détections consécutives
      if (!vehiculeDetecte && compteurDetection >= 3) {
        vehiculeDetecte = true;
        timerReset = millis();
        digitalWrite(LED_INFRACTION_PIN, HIGH);

        Serial.print(">>> VEHICULE DETECTE | Vitesse : ");
        Serial.print(vitesseFiltree, 2);
        Serial.println(" cm/s");
      }

      if (vehiculeDetecte) {
        timerReset = millis();
      }
    } else {
      compteurDetection = 0;
    }
  }

  // Si plus aucune détection depuis DELAI_RESET ms
  if (vehiculeDetecte && millis() - timerReset > DELAI_RESET) {
    Serial.println();
    Serial.print("Vitesse maximale du vehicule : ");
    Serial.print(vitessVehicule, 2);
    Serial.println(" cm/s");

    publierDonnees(vitessVehicule);

    digitalWrite(LED_INFRACTION_PIN, LOW);

    vehiculeDetecte = false;
    vitessVehicule = 0;
    compteurDetection = 0;
    vitesseFiltree = 0;
    distancePrecedente = 0;
  }

  delay(100);
}