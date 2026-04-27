const pool = require('../config/database');

class LostPetModel {
  static async create(data) {
    const {
      userId, name, type, breed, color, approximateAge,
      lastSeenLocation, lastSeenLatitude, lastSeenLongitude,
      city, neighborhood, description, contactPhone, contactEmail,
      rewardInfo, photos,
    } = data;

    const { rows } = await pool.query(
      `INSERT INTO lost_pets (
        user_id, name, type, breed, color, approximate_age,
        last_seen_location, last_seen_latitude, last_seen_longitude,
        city, neighborhood, description, contact_phone, contact_email,
        reward_info, photos
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`,
      [
        userId, name, type, breed || null, color, approximateAge || null,
        lastSeenLocation, lastSeenLatitude || null, lastSeenLongitude || null,
        city || null, neighborhood || null, description || null,
        contactPhone || null, contactEmail || null,
        rewardInfo || null, JSON.stringify(photos || []),
      ]
    );
    return rows[0];
  }

  static async findAll({ limit = 20, offset = 0, type, color, breed, city, status = 'lost' } = {}) {
    const conditions = ['lp.status = $1'];
    const values = [status];
    let idx = 2;

    if (type)  { conditions.push(`lp.type = $${idx++}`);          values.push(type); }
    if (color) { conditions.push(`lp.color ILIKE $${idx++}`);     values.push(`%${color}%`); }
    if (breed) { conditions.push(`lp.breed ILIKE $${idx++}`);     values.push(`%${breed}%`); }
    if (city)  { conditions.push(`lp.city ILIKE $${idx++}`);      values.push(`%${city}%`); }

    values.push(limit, offset);

    const { rows } = await pool.query(
      `SELECT lp.*, u.name AS owner_name
       FROM lost_pets lp
       LEFT JOIN users u ON lp.user_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY lp.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );
    return rows;
  }

  // Busca por distância geográfica usando earthdistance
  static async findByRadius({ lat, lng, radiusKm = 5, type, color, breed, limit = 20, offset = 0 }) {
    const conditions = [
      "lp.status = 'lost'",
      'lp.last_seen_latitude IS NOT NULL',
      'lp.last_seen_longitude IS NOT NULL',
      `earth_distance(
        ll_to_earth($1, $2),
        ll_to_earth(lp.last_seen_latitude, lp.last_seen_longitude)
      ) / 1000 <= $3`,
    ];
    const values = [lat, lng, radiusKm];
    let idx = 4;

    if (type)  { conditions.push(`lp.type = $${idx++}`);      values.push(type); }
    if (color) { conditions.push(`lp.color ILIKE $${idx++}`); values.push(`%${color}%`); }
    if (breed) { conditions.push(`lp.breed ILIKE $${idx++}`); values.push(`%${breed}%`); }

    values.push(limit, offset);

    const { rows } = await pool.query(
      `SELECT lp.*, u.name AS owner_name,
        ROUND((earth_distance(
          ll_to_earth($1, $2),
          ll_to_earth(lp.last_seen_latitude, lp.last_seen_longitude)
        ) / 1000)::numeric, 2) AS distance_km
       FROM lost_pets lp
       LEFT JOIN users u ON lp.user_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY distance_km ASC, lp.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );
    return rows;
  }

  static async findById(id) {
    const { rows } = await pool.query(
      `SELECT lp.*, u.name AS owner_name, u.email AS owner_email
       FROM lost_pets lp
       LEFT JOIN users u ON lp.user_id = u.id
       WHERE lp.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByUserId(userId, { limit = 20, offset = 0 } = {}) {
    const { rows } = await pool.query(
      `SELECT * FROM lost_pets WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return rows;
  }

  static async updateStatus(id, userId, status) {
    const { rows } = await pool.query(
      `UPDATE lost_pets SET status = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [status, id, userId]
    );
    return rows[0] || null;
  }
}

module.exports = LostPetModel;
