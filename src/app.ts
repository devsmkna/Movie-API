import express from "express";
import path from "path";
import mongoose from "mongoose";

import movie from "./routes/movies";
import actor from "./routes/actors";
import auth from "./routes/auth";

const app = express();
app.use(express.json());

require("dotenv").config({ path: path.join(__dirname, `../.env.${process.env.NODE_ENV?.trim()}`) });

// importo gli endpoint di companies
app.use("/movies", movie);
app.use("/actors", actor);
app.use("/auth", auth);

const run = async () => {
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.DB_URL as string)
        .then(() => console.log("Connected to MongoDB Atlas"))
        .catch((err) => console.log(`Could not connect to MongoDB Atlas: ${err}`));
    
    // Start server
    app.listen(process.env.PORT, () => console.log(`Server started on port ${process.env.PORT}`));
}

run();

export default app;