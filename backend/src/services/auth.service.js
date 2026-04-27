const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

const SALT_ROUNDS = 12;

class AuthService {
  static async register({ name, email, password, phone }) {
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      const err = new Error('E-mail já cadastrado.');
      err.status = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await UserModel.create({ name, email, passwordHash, phone });

    const token = this._generateToken(user.id);
    return { user, token };
  }

  static async login({ email, password }) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      const err = new Error('Credenciais inválidas.');
      err.status = 401;
      throw err;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      const err = new Error('Credenciais inválidas.');
      err.status = 401;
      throw err;
    }

    const { password_hash, ...safeUser } = user;
    const token = this._generateToken(user.id);
    return { user: safeUser, token };
  }

  static _generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }
}

module.exports = AuthService;
