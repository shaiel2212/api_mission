const { Mission } = require('../config/db');

async function findMostIsolatedCountry() {
    const missions = await Mission.findAll();
    const agentMissions = {};
    const countryIsolation = {};

    missions.forEach(({ agent, country }) => {
        agentMissions[agent] = (agentMissions[agent] || 0) + 1;
    });

    missions.forEach(({ agent, country }) => {
        if (agentMissions[agent] === 1) {
            countryIsolation[country] = (countryIsolation[country] || 0) + 1;
        }
    });

    let mostIsolatedCountry = null;
    let maxIsolation = 0;

    Object.entries(countryIsolation).forEach(([country, count]) => {
        if (count > maxIsolation) {
            mostIsolatedCountry = country;
            maxIsolation = count;
        }
    });

    return { country: mostIsolatedCountry, isolationDegree: maxIsolation };
}

const { getCoordinates } = require('../services/googleMapsService');

async function updateMissionCoordinates() {
    try {
        const missions = await Mission.findAll({
            where: {
                latitude: null,
                longitude: null
            }
        });

        for (const mission of missions) {
            try {
                const { latitude, longitude } = await getCoordinates(mission.address);
                if (latitude && longitude) {
                    mission.latitude = latitude;
                    mission.longitude = longitude;
                    await mission.save();
                    console.log(` Updated coordinates for mission ID ${mission.id}`);
                } else {
                    console.warn(`Could not fetch coordinates for mission ID ${mission.id}`);
                }
            } catch (geoError) {
                console.error(` Error  fetching coordinates for mission ID ${mission.id}:`, geoError.message);
            }
        }
    } catch (error) {
        console.error(" Error updating mission coordinates:", error);
    }
}

updateMissionCoordinates();

module.exports = { updateMissionCoordinates };



module.exports = { findMostIsolatedCountry };
