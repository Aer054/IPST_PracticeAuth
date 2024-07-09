const ApiError=require("../error/ApiError")
const bcrypt = require('bcrypt')
const {User}=require('../models/model')
const jwt=require('jsonwebtoken')
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.mail.ru',
    port: 465, 
    secure: true, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});
const generateEmailConfirmationToken = (username) => {
    return jwt.sign({ username }, process.env.SECRET_KEY, { expiresIn: '30m' });
};

const sendConfirmationEmail = async (user) => {
    const token = generateEmailConfirmationToken(user.username);
    const confirmationUrl = `http://${process.env.DB_HOST}:${process.env.PORT}/api/user/confirm/${token}`;

    let mailOptions = {
        from: process.env.EMAIL_USER, 
        to: user.email,
        subject: 'Подтверждение почты',
        text: `Чтобы подтвердить свой email, перейдите по ссылке: ${confirmationUrl}`,
    };

    await transporter.sendMail(mailOptions);
};
const generateJWT = (username, email) => {
    const accessToken = jwt.sign(
        { username, email },
        process.env.SECRET_KEY,
        { expiresIn: '15m', algorithm: 'HS256' }
    );
    
    const refreshToken = jwt.sign(
        { username, email },
        process.env.REFRESH_SECRET_KEY,
        { expiresIn: '7d', algorithm: 'HS256' }
    );

    return { accessToken, refreshToken };
}


class UserController{
  async registration(req, res, next) {
        const { username, name, surname, middlename, email, password } = req.body;
        
        if (!username || !email || !password || !name || !surname) {
          return next(ApiError.badRequest('Некорректные данные'));
        }
        try {
        const candidate = await User.findOne({ where: { username } });
        if (candidate) {
          return next(ApiError.badRequest('Пользователь с таким никнеймом уже существует'));
        }
    
        const hashPassword = await bcrypt.hash(password, 5);
        const user = await User.create({
          username,
          name,
          surname,
          middlename,
          email,
          password: hashPassword,
          is_confirmed: false
        });
    
        //const tokens = generateJWT(user.username, user.email)
    
       // return res.json({ tokens });
       await sendConfirmationEmail(user);

       return res.json({ message: 'Регистрация прошла успешно. Проверьте свой email для подтверждения.' });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return next(ApiError.badRequest(error.errors.map(e => e.message).join('. ')));
        }
        return next(ApiError.internal('Ошибка регистрации'));
    }
    }

    async login(req,res,next){
        const{username,password}=req.body
        const user = await User.findOne({where:{username}})
        if(!user){
            return next(ApiError.internal('Пользователь не найден'))
        }
        const comparePaswword=bcrypt.compareSync(password,user.password)
        if(!comparePaswword){
            return next(ApiError.internal('Указан не верный пароль'))
        }
        if(!user.is_confirmed){
            return next(ApiError.badRequest('Пожалуйста, подтвердите свою почту перед авторизацией'))
        }
        const tokens =generateJWT(user.username, user.email)
        return res.json({ tokens });
    }

    async check(req,res){
        const tokens = generateJWT(req.user.username, req.user.email)
        return res.json({ tokens });
    }

    async confirmEmail(req, res, next) {
        const { token } = req.params;
        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            const user = await User.findOne({ where: { username: decoded.username } });

            if (!user) {
                return next(ApiError.badRequest('Некорректный токен'));
            }

            user.is_confirmed = true;
            await user.save();

            return res.json({ message: 'Email успешно подтвержден' });
        } catch (error) {
            return next(ApiError.internal('Ошибка подтверждения email'));
        }
    }

    async requestPasswordReset (req,res){
        try {
            const user = req.user;
            if (!user) {
                return next(ApiError.badRequest('Некорректный токен'));
            }
    
            const token = generateEmailConfirmationToken(user.username);
            const confirmationUrl = `http://${process.env.DB_HOST}:${process.env.PORT}/api/user/reset-password/${token}`;
            let mailOptions = {
            from: process.env.EMAIL_USER, 
            to: user.email,
            subject: 'Смена пороля',
            text: `Для смены пароля перейдите по ссылке: ${confirmationUrl}`,
            };
    
            await transporter.sendMail(mailOptions);
    
            return res.json({ message: 'Инструкции по сбросу пароля отправлены на вашу почту' });
        } catch (error) {
            return next(ApiError.internal('Ошибка запроса на сброс пароля'));
        }

        
       
    }
    async confirmPasswordReset(req, res, next) {
        const { token } = req.params;

        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            const user = await User.findOne({ where: { username: decoded.username } });

            if (!user) {
                return next(ApiError.badRequest('Некорректный токен'));
            }

            const { currentPassword, newPassword } = req.body;

            const comparePassword = await bcrypt.compare(currentPassword, user.password);
            if (!comparePassword) {
                return next(ApiError.badRequest('Текущий пароль неверен'));
            }

            const hashPassword = await bcrypt.hash(newPassword, 5);
            user.password = hashPassword;
            await user.save();

            return res.json({ message: 'Пароль успешно изменен' });
        } catch (error) {
            return next(ApiError.internal('Ошибка подтверждения сброса пароля'));
        }
    }
    
    
}

module.exports = new UserController()