const Infraction = require('../models/dataModels');

exports.InfactionHistory = async (req, res) => {
    try{
        const {
            vitesse, inf_id, imagePath, date, RadarId
        } = req.query;

    
        const historique = await Infraction.find({}, {
      vitesse: 1, 
      status: 1,
      inf_id: 1, 
      imagePath: 1, 
      date: 1, 
      RadarId: 1
    }).sort({ date: -1 });

        res.status(200).json(historique);
    }
    catch(error){
        res.status(500).json();
        console.error("erreur");
    }
};

