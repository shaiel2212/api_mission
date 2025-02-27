require("dotenv").config();
require("events").EventEmitter.defaultMaxListeners = 15;

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const missionRoutes = require("./routes/missionRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.use("/api", missionRoutes);

// התחברות למסד הנתונים
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ Server is running on port ${PORT}`);
    });
}).catch(error => {
    console.error("❌ Failed to initialize database:", error);
});
