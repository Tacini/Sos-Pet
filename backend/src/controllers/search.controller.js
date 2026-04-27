const LostPetModel = require('../models/lostPet.model');
const QuickReportModel = require('../models/quickReport.model');

class SearchController {
  static async search(req, res, next) {
    try {
      const {
        lat, lng, radius = 5,
        type, color, breed, city,
        limit = 20, page = 1,
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      let pets;

      // Busca por coordenadas se lat/lng fornecidos
      if (lat && lng) {
        pets = await LostPetModel.findByRadius({
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          radiusKm: parseFloat(radius),
          type,
          color,
          breed,
          limit: parseInt(limit),
          offset,
        });
      } else {
        pets = await LostPetModel.findAll({
          type, color, breed, city,
          limit: parseInt(limit),
          offset,
        });
      }

      res.json({
        success: true,
        data: {
          pets,
          filters: { lat, lng, radius, type, color, breed, city },
          pagination: { page: parseInt(page), limit: parseInt(limit) },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Feed da home: últimos relatos + últimos perdidos
  static async feed(req, res, next) {
    try {
      const [recentReports, recentLost] = await Promise.all([
        QuickReportModel.findAll({ limit: 8 }),
        LostPetModel.findAll({ limit: 8 }),
      ]);

      res.json({
        success: true,
        data: { recentReports, recentLost },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SearchController;
