const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        dialect: "mysql",
        logging: false,
    }
);
const Mission = require("../models/mission")(sequelize);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database connected successfully.");
        await sequelize.sync();
        console.log(" Database synchronized.");

        const missionCount = await Mission.count();
        if (missionCount === 0) {
            await Mission.bulkCreate([
                { agent: "007", country: "Brazil", address: "Avenida Vieira Souto 168 Ipanema, Rio de Janeiro", latitude: -22.983, longitude: -43.204, date: "1995-12-17 21:45:17" },
                { agent: "005", country: "Poland", address: "Rynek Glowny 12, Krakow", latitude: 50.061, longitude: 19.937, date: "2011-04-05 17:05:12" },
                { agent: "007", country: "Morocco", address: "27 Derb Lferrane, Marrakech", latitude: 31.629, longitude: -7.981, date: "2001-01-01 00:00:00" },
                { agent: "005", country: "Brazil", address: "Rua Roberto Simonsen 122, Sao Paulo", latitude: -23.550, longitude: -46.633, date: "1986-05-05 08:40:23" },
                { agent: "011", country: "Poland", address: "swietego Tomasza 35, Krakow", latitude: 50.061, longitude: 19.937, date: "1997-09-07 19:12:53" }
            ]);
            console.log("✅ Sample data inserted into the database.");
        }
    } catch (error) {
        console.error(" Database connection failed:", error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB,Mission };

