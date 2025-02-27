const { Mission } = require('../models');
const { getCoordinates } = require('../services/googleMapsService');
const { findMostIsolatedCountry } = require('../services/missionService');
const { findClosestMission } = require('../services/distanceService');

/**
 * הוספת משימה חדשה
 */
const addMission = async (req, res) => {
    try {
        const { agent, country, address, date } = req.body;

        if (!agent || !country || !address || !date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { latitude, longitude } = await getCoordinates(address);

        const mission = await Mission.create({
            agent,
            country,
            address,
            latitude,
            longitude,
            date
        });

        res.status(201).json({ message: 'Mission added successfully', mission });
    } catch (error) {
        console.error('Error adding mission:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * מציאת המדינה עם הכי הרבה סוכנים בודדים
 */
const getMostIsolatedCountry = async (req, res) => {
    try {
        const result = await findMostIsolatedCountry();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error finding isolated country:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * מציאת המשימה הקרובה ביותר לכתובת נתונה
 */
const findClosestMissionController = async (req, res) => {
    try {
        const { targetLocation } = req.body;

        if (!targetLocation) {
            return res.status(400).json({ error: 'Missing targetLocation' });
        }

        try {
            const { latitude, longitude } = await getCoordinates(targetLocation);
            if (!latitude || !longitude) {
                return res.status(404).json({ error: 'Invalid address or location not found' });
            }

            const closestMission = await findClosestMission(latitude, longitude);
            if (!closestMission) {
                return res.status(404).json({ error: 'No missions found nearby' });
            }

            res.status(200).json({ closestMission });
        } catch (geoError) {
            console.error('Geolocation error:', geoError.message);
            return res.status(500).json({ error: 'Failed to retrieve geolocation data' });
        }
    } catch (error) {
        console.error('Error finding closest mission:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const updateMissionCoordinates = async () => {
    const missions = await Mission.findAll({
        where: {
            latitude: null,
            longitude: null
        }
    });

    for (const mission of missions) {
        const { latitude, longitude } = await getCoordinates(mission.address);
        mission.latitude = latitude;
        mission.longitude = longitude;
        await mission.save();
    }
    console.log("✅ All missing coordinates updated!");
};

updateMissionCoordinates();

module.exports = { addMission, getMostIsolatedCountry, findClosestMission: findClosestMissionController };
