const pool = require('../config/database');

class UserModel {
  static async create({ name, email, passwordHash, phone }) {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, phone, created_at`,
      [name, email, passwordHash, phone || null]
    );
    return rows[0];
  }

  static async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, name, email, phone, avatar_url, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  static async update(id, fields) {
    const allowed = ['name', 'phone', 'avatar_url'];
    const updates = [];
    const values = [];
    let idx = 1;

    for (const [key, val] of Object.entries(fields)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }

    if (!updates.length) return null;

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}
       RETURNING id, name, email, phone, avatar_url, created_at`,
      values
    );
    return rows[0];
  }
}

module.exports = UserModel;
