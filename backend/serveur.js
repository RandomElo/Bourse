import e from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import routeurUtilisateur from "./routeurs/utilisateur.js";

import { accesibliteBDD } from "./middlewares/accessibiliteBDD.js";

import bdd from "./bdd/bdd.js";
import { verificationCookie } from "./middlewares/verificationCookie.js";
import routeurBourse from "./routeurs/bourse.js";

dotenv.config();

const { IP_FRONTEND, PORT_EXPRESS, MODE } = process.env;

const app = e();

app.use(
    cors({
        // origin: MODE === "developpement" ? "*" : IP_FRONTEND,
        origin: IP_FRONTEND,
        methods: ["GET", "POST", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
);

app.use(e.json());
app.use(cookieParser());
app.use(accesibliteBDD(bdd));

app.use(verificationCookie);

app.use("/utilisateur", routeurUtilisateur);
app.use("/bourse", routeurBourse);

app.listen(PORT_EXPRESS, () => console.log("Serveur démarré => port " + PORT_EXPRESS));
