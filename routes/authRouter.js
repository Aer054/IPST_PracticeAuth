const Router = require('express');
const router = new Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: APIs for user authentication and password management
 */

/**
 * @swagger
 * /api/user/registration:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               name:
 *                 type: string
 *               surname:
 *                 type: string
 *               middlename:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Registration successful. Check email for confirmation.
 *       '400':
 *         description: Bad request or user with the same username already exists.
 *       '500':
 *         description: Internal server error.
 */
router.post('/registration', userController.registration);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Log in to the application
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Login successful. Returns access and refresh tokens.
 *       '400':
 *         description: Bad request or invalid credentials.
 *       '500':
 *         description: Internal server error.
 */
router.post('/login', userController.login);

/**
 * @swagger
 * /api/user/auth:
 *   get:
 *     summary: Check user authentication status
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: User is authenticated. Returns new access and refresh tokens.
 *       '401':
 *         description: Unauthorized or token expired.
 */
router.get('/auth', authMiddleware, userController.check);

/**
 * @swagger
 * /api/user/confirm/{token}:
 *   get:
 *     summary: Confirm user email with token
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Email confirmed successfully.
 *       '400':
 *         description: Bad request or invalid token.
 *       '500':
 *         description: Internal server error.
 */
router.get('/confirm/:token', userController.confirmEmail);

/**
 * @swagger
 * /api/user/requestPasswordReset:
 *   get:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Password reset instructions sent to email.
 *       '401':
 *         description: Unauthorized or token expired.
 *       '500':
 *         description: Internal server error.
 */
router.get('/requestPasswordReset', authMiddleware, userController.requestPasswordReset);

/**
 * @swagger
 * /api/user/reset-password/{token}:
 *   post:
 *     summary: Reset user password with token
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Password reset successful.
 *       '400':
 *         description: Bad request, invalid token, or incorrect current password.
 *       '500':
 *         description: Internal server error.
 */
router.post('/reset-password/:token', userController.confirmPasswordReset);

module.exports = router;
