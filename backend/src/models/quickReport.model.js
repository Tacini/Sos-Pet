const pool = require('../config/database');

class QuickReportModel {
  static async create(data) {
    const {
      location_text,
      latitude,
      longitude,
      city,
      neighborhood,
      photo_url,
      reporter_name,
      reporter_phone,
      accepts_contact,
      contact_methods,
      wants_updates,
      reporter_email,
      animal_type,
      animal_color,
      description,
    } = data;

    const { rows } = await pool.query(
      `INSERT INTO quick_reports (
        location_text, latitude, longitude, city, neighborhood, photo_url,
        reporter_name, reporter_phone, accepts_contact, contact_methods,
        wants_updates, reporter_email, animal_type, animal_color, description
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        location_text,
        latitude || null,
        longitude || null,
        city || null,
        neighborhood || null,
        photo_url,
        reporter_name || null,
        reporter_phone || null,
        accepts_contact || false,
        JSON.stringify(contact_methods || []),
        wants_updates || false,
        reporter_email || null,
        animal_type || null,
        animal_color || null,
        description || null,
      ]
    );
    return rows[0];
  }

  static async findAll({ limit = 20, offset = 0, animal_type, city, status = 'active' } = {}) {
    const conditions = ['status = $1'];
    const values = [status];
    let idx = 2;

    if (animal_type) { conditions.push(`animal_type = $${idx++}`); values.push(animal_type); }
    if (city)        { conditions.push(`city ILIKE $${idx++}`);    values.push(`%${city}%`); }

    values.push(limit, offset);

    const { rows } = await pool.query(
      `SELECT *
       FROM quick_reports
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );
    return rows;
  }

  static async findByStructuredAddress({ cidade, bairro, cor, limit = 20, offset = 0 } = {}) {
    const conditions = ["status = 'active'"];
    const values = [];
    let idx = 1;

    if (cidade) { conditions.push(`city ILIKE $${idx++}`); values.push(`%${cidade}%`); }
    if (bairro) { conditions.push(`neighborhood ILIKE $${idx++}`); values.push(`%${bairro}%`); }
    if (cor)    { conditions.push(`animal_color ILIKE $${idx++}`); values.push(`%${cor}%`); }

    values.push(limit, offset);

    const { rows } = await pool.query(
      `SELECT *
       FROM quick_reports
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );
    return rows;
  }

  static async findByRadius({ lat, lng, radiusKm = 5, animal_type, city, limit = 20, offset = 0 }) {
    const conditions = [
      "status = 'active'",
      'latitude IS NOT NULL',
      'longitude IS NOT NULL',
      `earth_distance(
        ll_to_earth($1, $2),
        ll_to_earth(latitude, longitude)
      ) / 1000 <= $3`,
    ];
    const values = [lat, lng, radiusKm];
    let idx = 4;

    if (animal_type) { conditions.push(`animal_type = $${idx++}`); values.push(animal_type); }
    if (city)        { conditions.push(`city ILIKE $${idx++}`);    values.push(`%${city}%`); }

    values.push(limit, offset);

    const { rows } = await pool.query(
      `SELECT *,
        ROUND((earth_distance(
          ll_to_earth($1, $2),
          ll_to_earth(latitude, longitude)
        ) / 1000)::numeric, 2) AS distance_km
       FROM quick_reports
       WHERE ${conditions.join(' AND ')}
       ORDER BY distance_km ASC, created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );
    return rows;
  }

  static async findById(id) {
    const { rows } = await pool.query(
      `SELECT * FROM quick_reports WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  static async countAll({ animal_type, city, status = 'active' } = {}) {
    const conditions = ['status = $1'];
    const values = [status];
    let idx = 2;

    if (animal_type) { conditions.push(`animal_type = $${idx++}`); values.push(animal_type); }
    if (city)        { conditions.push(`city ILIKE $${idx++}`);    values.push(`%${city}%`); }

    const { rows } = await pool.query(
      `SELECT COUNT(*) as total FROM quick_reports WHERE ${conditions.join(' AND ')}`,
      values
    );
    return parseInt(rows[0].total, 10);
  }
}

module.exports = QuickReportModel;
