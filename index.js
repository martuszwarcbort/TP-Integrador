import express from "express"; // npm i express
import cors from "cors";       // npm i cors
import config from "./src/configs/db-config.js";
import pkg from "pg";          // npm i pg
import fs from "fs";

const { Client } = pkg;
const app = express();
const PORT = 3000;

let eventosArray = [];


app.use(cors());

app.get('/api/event', async (req, res) => {
    const client = new Client(config)
    try {
        console.log("Entro al try")
        await client.connect()
        let sql = `SELECT * FROM "events"`
        let eventos = await client.query(sql);
        eventosArray = eventos;
        res.status(200).send(eventos.rows);

    }

    catch (error) {
        res.status(500).send(error);
        console.log(error)
    }

    finally {
        await client.end()
    }

});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
