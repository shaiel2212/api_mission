const { sequelize } = require('../config/db');

async function findClosestMission(targetLat, targetLon) {
    const [mission] = await sequelize.query(
        `SELECT *, (6371 * ACOS(
            COS(RADIANS(:lat)) * COS(RADIANS(latitude)) *
            COS(RADIANS(longitude) - RADIANS(:lon)) +
            SIN(RADIANS(:lat)) * SIN(RADIANS(latitude))
        )) AS distance
        FROM missions
        ORDER BY distance ASC
        LIMIT 1;`,
        { replacements: { lat: targetLat, lon: targetLon }, type: sequelize.QueryTypes.SELECT }
    );

    return mission;
}

module.exports = { findClosestMission };
