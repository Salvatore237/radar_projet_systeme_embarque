const mongoose = require('mongoose');

const infractionSchema = new mongoose.Schema({
    vitesse: { 
        type: Number, 
        required: true 
    },
    
    inf_id :{
        type: String,
        required: true
    },

    imagePath: { 
        type: String, 
        required: true 
    },

    date: { 
        type: Date, 
        default: Date.now 
    },

    RadarId: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Infraction', infractionSchema);