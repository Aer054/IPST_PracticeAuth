const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING(15),
    allowNull: false,
    primaryKey: true,
    validate: {
      len: {
        args: [1, 15],
        msg: 'Никнейм должен быть от 1 до 15 символов'
      }
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Имя не должно быть пустым'
      }
    }
  },
  surname: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Фамилия не должна быть пустой'
      }
    }
  },
  middlename: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: {
      msg: 'Этот email уже используется'
    },
    validate: {
      isEmail: {
        msg: 'Некорректный email'
      }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: {
        args: [8, 255],
        msg: 'Пароль должен быть не менее 8 символов'
      }
    }
  },
  is_confirmed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'User',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['username']
    }
  ]
});

module.exports = {
  User
};
