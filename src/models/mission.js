const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Mission extends Model {}

    Mission.init(
        {
            id: { // שינוי שם ל"id" כפי שדורש המבחן
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            agent: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            country: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            address: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            latitude: {
                type: DataTypes.DECIMAL(9, 6),
                allowNull: true, // עדכון ל-TRUE כי לא כל הכתובות כוללות קואורדינטות מידית
            },
            longitude: {
                type: DataTypes.DECIMAL(9, 6),
                allowNull: true,
            },
            date: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'Mission',
            tableName: 'missions',
            timestamps: false,
        }
    );

    return Mission;
};