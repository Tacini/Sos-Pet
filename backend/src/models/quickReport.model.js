const pool = require('../config/database');

class QuickReportModel {
  static async create(data) {
    const {
      locationText, latitude, longitude, city, neighborhood,
      photoUrl, reporterName, reporterPhone, acceptsContact,
      contactMethods, wantsUpdates, reporterEmail,
      animalType, animalColor, description,
    } = data;

    const { rows } = await pool.query(
      `INSERT INTO quick_reports (
        location_text, latitude, longitude, city, neighborhood,
        photo_url, reporter_name, reporter_phone, accepts_contact,
        contact_methods, wants_updates, reporter_email,
        animal_type, animal_color, description
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        locationText, latitude || null, longitude || null, city || null, neighborhood || null,
        photoUrl, reporterName || null, reporterPhone || null, acceptsContact || false,
        JSON.stringify(contactMethods || []), wantsUpdates || false, reporterEmail || null,
        animalType || null, animalColor || null, description || null,
      ]
    );
    return rows[0];
  }

  static async findAll({ limit = 20, offset = 0, animalType, city, status = 'active' } = {}) {
    const conditions = ['status = $1'];
    const values = [status];
    let idx = 2;

    if (animalType) {
      conditions.push(`animal_type = $${idx++}`);
      values.push(animalType);
    }
    if (city) {
      conditions.push(`city ILIKE $${idx++}`);
      values.push(`%${city}%`);
    }

    values.push(limit, offset);

    const { rows } = await pool.query(
      `SELECT * FROM quick_reports
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );
    return rows;
  }

  static async findById(id) {
    const { rows } = await pool.query('SELECT * FROM quick_reports WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async countAll({ animalType, city, status = 'active' } = {}) {
    const conditions = ['status = $1'];
    const values = [status];
    let idx = 2;

    if (animalType) { conditions.push(`animal_type = $${idx++}`); values.push(animalType); }
    if (city) { conditions.push(`city ILIKE $${idx++}`); values.push(`%${city}%`); }

    const { rows } = await pool.query(
      `SELECT COUNT(*) FROM quick_reports WHERE ${conditions.join(' AND ')}`,
      values
    );
    return parseInt(rows[0].count, 10);
  }
}

module.exports = QuickReportModel;
