const express = require("express");
const { addMission, getMostIsolatedCountry, findClosestMission } = require("../controllers/missionController");
const router = express.Router();

router.post("/mission", addMission);
router.get("/countries-by-isolation", getMostIsolatedCountry);
router.post("/find-closest", findClosestMission);


module.exports = router;
