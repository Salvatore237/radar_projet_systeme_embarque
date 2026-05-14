//const radarCrtl = require('../Controller/dataController');
const historiquecrtl = require ('../Controller/historiqeController');
const express = require('express');
const router = express.Router();

router.get('/Historique', historiquecrtl.InfactionHistory);


module.exports = router;