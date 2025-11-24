#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <DHT.h>

const char* ssid = "OPPO A76";
const char* password = "11111111";
const char* mqttServer = "cf17049d693d486886f1901ac8ced9d7.s1.eu.hivemq.cloud";
const int mqttPort = 8883;
const char* mqttUser = "Vovantien2508";
const char* mqttPass = "Tien01687537817";
const char* mqttTopic = "data/sensor/dht22";
const char* DEVICE_ID = "ESP01_DHT22";

#define DHTPIN 2
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);
WiFiClientSecure espClient;
PubSubClient client(espClient);

void setup_wifi() {
  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED){ delay(500); Serial.print("."); }
  Serial.println("WiFi connected!");
}

void reconnect() {
  while(!client.connected()) {
    if(client.connect(DEVICE_ID, mqttUser, mqttPass)){ Serial.println("MQTT connected"); }
    else { delay(3000); }
  }
}

void setup() {
  Serial.begin(9600);
  dht.begin();
  setup_wifi();
  espClient.setInsecure();
  client.setServer(mqttServer, mqttPort);
}

void loop() {
  if(!client.connected()) reconnect();
  client.loop();
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if(!isnan(h) && !isnan(t)){
    String payload = "{\"deviceId\":\""+String(DEVICE_ID)+"\",\"temperature\":"+String(t)+",\"humidity\":"+String(h)+"}";
    client.publish(mqttTopic, payload.c_str());
    Serial.println(payload);
  }
  delay(15000);
}
