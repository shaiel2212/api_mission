const { Sequelize } = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
});

// טעינת המודלים
const Mission = require('./mission')(sequelize); // העברת החיבור ישירות

const initDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully.');
        await sequelize.sync({ alter: true });
        console.log('✅ Database synchronized.');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
    }
};

module.exports = { sequelize, Mission, initDB };
