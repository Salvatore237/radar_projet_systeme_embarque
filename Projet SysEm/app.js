const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require("mongoose");

const radar = require('./Routes/dataRoute');

//const uri = "mongodb://fred:123456qw@cluster0-shard-00-00.l0yat.mongodb.net:27017,cluster0-shard-00-01.l0yat.mongodb.net:27017,cluster0-shard-00-02.l0yat.mongodb.net:27017/?ssl=true&replicaSet=atlas-wsotbp-shard-0&authSource=admin&appName=Cluster0";


  mongoose.connect('mongodb://fred:123456qw@cluster0-shard-00-00.l0yat.mongodb.net:27017,cluster0-shard-00-01.l0yat.mongodb.net:27017,cluster0-shard-00-02.l0yat.mongodb.net:27017/?ssl=true&replicaSet=atlas-wsotbp-shard-0&authSource=admin&appName=Cluster0',
)
  .then(() => {
    console.log('✅ Connexion à MongoDB réussie')
  })
  .catch((error) => {
    console.error('❌ Erreur de connexion à MongoDB:', error);
  });

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

app.use('/frontend', express.static(path.join(__dirname, 'frontend')));

app.use(cors());
app.use(express.json());
app.use('/historique', radar);
//app.get('/test', (req, res) => {
// res.send('✅ Serveur fonctionne');
//});

app.get('/', (req, res) => {
    res.redirect('/frontend/pages/login.html');
});

module.exports = app;