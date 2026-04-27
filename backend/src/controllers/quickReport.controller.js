const QuickReportModel = require('../models/quickReport.model');
const path = require('path');

class QuickReportController {
  static async create(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Foto do animal é obrigatória.',
        });
      }

      const photoUrl = `/uploads/${req.file.filename}`;

      const reportData = {
        locationText: req.body.location_text,
        latitude: req.body.latitude ? parseFloat(req.body.latitude) : null,
        longitude: req.body.longitude ? parseFloat(req.body.longitude) : null,
        city: req.body.city,
        neighborhood: req.body.neighborhood,
        photoUrl,
        reporterName: req.body.reporter_name,
        reporterPhone: req.body.reporter_phone,
        acceptsContact: req.body.accepts_contact === 'true',
        contactMethods: req.body.contact_methods
          ? JSON.parse(req.body.contact_methods)
          : [],
        wantsUpdates: req.body.wants_updates === 'true',
        reporterEmail: req.body.reporter_email,
        animalType: req.body.animal_type,
        animalColor: req.body.animal_color,
        description: req.body.description,
      };

      const report = await QuickReportModel.create(reportData);

      res.status(201).json({
        success: true,
        message: 'Relato enviado com sucesso! Obrigado por ajudar! 🐾',
        data: { report },
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const { limit = 20, page = 1, animal_type, city } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const [reports, total] = await Promise.all([
        QuickReportModel.findAll({
          limit: parseInt(limit),
          offset,
          animalType: animal_type,
          city,
        }),
        QuickReportModel.countAll({ animalType: animal_type, city }),
      ]);

      res.json({
        success: true,
        data: {
          reports,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const report = await QuickReportModel.findById(req.params.id);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Relato não encontrado.' });
      }
      res.json({ success: true, data: { report } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = QuickReportController;
