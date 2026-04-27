const LostPetModel = require('../models/lostPet.model');

class LostPetController {
  static async create(req, res, next) {
    try {
      const photos = req.files
        ? req.files.map((f) => `/uploads/${f.filename}`)
        : [];

      const petData = {
        userId: req.user.id,
        name: req.body.name,
        type: req.body.type,
        breed: req.body.breed,
        color: req.body.color,
        approximateAge: req.body.approximate_age,
        lastSeenLocation: req.body.last_seen_location,
        lastSeenLatitude: req.body.last_seen_latitude
          ? parseFloat(req.body.last_seen_latitude)
          : null,
        lastSeenLongitude: req.body.last_seen_longitude
          ? parseFloat(req.body.last_seen_longitude)
          : null,
        city: req.body.city,
        neighborhood: req.body.neighborhood,
        description: req.body.description,
        contactPhone: req.body.contact_phone,
        contactEmail: req.body.contact_email || req.user.email,
        rewardInfo: req.body.reward_info,
        photos,
      };

      const pet = await LostPetModel.create(petData);

      res.status(201).json({
        success: true,
        message: 'Anúncio criado com sucesso. Esperamos encontrá-lo logo! 🐾',
        data: { pet },
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const { limit = 20, page = 1, type, color, breed, city } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const pets = await LostPetModel.findAll({
        limit: parseInt(limit),
        offset,
        type,
        color,
        breed,
        city,
      });

      res.json({ success: true, data: { pets } });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const pet = await LostPetModel.findById(req.params.id);
      if (!pet) {
        return res.status(404).json({ success: false, message: 'Animal não encontrado.' });
      }
      res.json({ success: true, data: { pet } });
    } catch (error) {
      next(error);
    }
  }

  static async myPets(req, res, next) {
    try {
      const pets = await LostPetModel.findByUserId(req.user.id);
      res.json({ success: true, data: { pets } });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const allowed = ['lost', 'found', 'closed'];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status inválido. Use: ${allowed.join(', ')}`,
        });
      }

      const pet = await LostPetModel.updateStatus(req.params.id, req.user.id, status);
      if (!pet) {
        return res.status(404).json({
          success: false,
          message: 'Animal não encontrado ou sem permissão.',
        });
      }

      res.json({
        success: true,
        message: 'Status atualizado com sucesso!',
        data: { pet },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LostPetController;
