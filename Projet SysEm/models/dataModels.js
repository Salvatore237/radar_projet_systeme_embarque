const mongoose = require('mongoose');

const infractionSchema = new mongoose.Schema({
    vitesse: { 
        type: Number, 
        required: true 
    },
    status: {
        type: String,
        required: false,
        default: 'non traité'
    }, 
    
    inf_id :{
        type: String,
        required: true
    },

    imagePath: {
        type: String,
        required: false,
        default: '/uploads/if002.jpg' // Chemin vers une image par défaut si aucune n'est fournie
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