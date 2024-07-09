const ApiError=require("../error/ApiError")
const bcrypt = require('bcrypt')
const {User}=require('../models/model')
const jwt=require('jsonwebtoken')
const nodemailer = require('nodemailer');

const generateEmailConfirmationToken = (username) => {
    return jwt.sign({ username }, process.env.SECRET_KEY, { expiresIn: '1d' });
};

const sendConfirmationEmail = async (user) => {
    const token = generateEmailConfirmationToken(user.username);
    const confirmationUrl = `http://${process.env.DB_HOST}:${process.env.PORT}/api/user/confirm/${token}`;

    let transporter = nodemailer.createTransport({
        host: 'smtp.mail.ru',
        port: 465, 
        secure: true, 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

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

    async passwordReset(req,res){

    }
}

module.exports = new UserController()