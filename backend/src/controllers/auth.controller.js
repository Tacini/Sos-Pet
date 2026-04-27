const AuthService = require('../services/auth.service');

class AuthController {
  static async register(req, res, next) {
    try {
      const { name, email, password, phone } = req.body;
      const { user, token } = await AuthService.register({ name, email, password, phone });

      res.status(201).json({
        success: true,
        message: 'Usuário cadastrado com sucesso!',
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, token } = await AuthService.login({ email, password });

      res.json({
        success: true,
        message: 'Login realizado com sucesso!',
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req, res) {
    res.json({
      success: true,
      data: { user: req.user },
    });
  }
}

module.exports = AuthController;
