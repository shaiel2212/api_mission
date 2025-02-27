const { Mission } = require('../models');

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

module.exports = { findMostIsolatedCountry };
