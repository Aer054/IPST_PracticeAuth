const jwt = require('jsonwebtoken');
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
            req.user = userData; // сохраняем данные пользователя в запрос для дальнейшего использования
            return next(); // access токен валиден, продолжаем обработку запроса
        } catch (err) {
            if (err.name !== 'TokenExpiredError') {
                return res.status(401).json({ message: "Не авторизован" });
            }
        }

        // access токен истек, проверяем refresh токен
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

        const user = await User.findOne({ where: { username: refreshUserData.username } });
        if (!user) {
            return res.status(401).json({ message: "Не авторизован" });
        }

        // генерируем новый access токен
        const newAccessToken = jwt.sign(
            { username: user.username, email: user.email },
            process.env.SECRET_KEY,
            { expiresIn: '15m', algorithm: 'HS256' }
        );

        res.setHeader('Authorization', `Bearer ${newAccessToken}`);
        req.user = { username: user.username, email: user.email }; // сохраняем данные пользователя в запрос для дальнейшего использования

        next();
    } catch (err) {
        console.error("Ошибка в middleware для обновления токенов:", err);
        return res.status(401).json({ message: "Ошибка при обновлении токена" });
    }
};
