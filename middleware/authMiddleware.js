const jwt = require('jsonwebtoken');
const ApiError = require('../error/ApiError');
const { User } = require('../models/model');

module.exports = async function (req, res, next) {
    if (req.method === "OPTIONS") {
        next();
    }
    
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Не авторизован" });
        }
        
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: "Не авторизован" });
        }
        
        let userData;
        try {
            userData = jwt.verify(token, process.env.SECRET_KEY);
        } catch (e) {
            return res.status(401).json({ message: "Не авторизован" });
        }
        
        const user = await User.findOne({ where: { username: userData.username } });
        if (!user) {
            return res.status(401).json({ message: "Не авторизован" });
        }
        
        const refreshToken = req.body.refreshToken || req.query.refreshToken || req.headers['x-refresh-token'];
        if (!refreshToken) {
            return res.status(401).json({ message: "Требуется refresh токен" });
        }
        
        let refreshUserData;
        try {
            refreshUserData = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);
        } catch (e) {
            return res.status(401).json({ message: "Недействительный refresh токен" });
        }
        
        if (refreshUserData.username !== userData.username) {
            return res.status(401).json({ message: "Недействительный refresh токен для этого пользователя" });
        }
        
        const newAccessToken = jwt.sign(
            { username: userData.username, email: userData.email },
            process.env.SECRET_KEY,
            { expiresIn: '15m', algorithm: 'HS256' }
        );
        
        res.setHeader('Authorization', `Bearer ${newAccessToken}`);
        next();
    } catch (err) {
        console.error("Ошибка в middleware для обновления токенов:", err);
        return res.status(401).json({ message: "Ошибка при обновлении токена" });
    }
};
