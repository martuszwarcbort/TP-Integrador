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
/*
app.get('/api/event', async (req, res) => {
    const client = new Client(config)
    try {
        console.log("Entro al try")
        await client.connect()
        let sql = ` SELECT 
        e.id,
        e.name,
        e.description,
        e.start_date,
        e.duration_in_minutes,
        e.price,
        e.enabled_for_enrollment,
        e.max_assistance,
        l.name AS location_name
        FROM "events" e
        INNER JOIN "locations" l ON e.id_event_location = l.id`
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
*/



app.get('/api/event', async (req, res) => {
    const client = new Client(config);
    const { name, startdate, tag } = req.query;

    try {
        console.log("Entro al try");
        await client.connect();

        let sql = `
            SELECT 
                e.id,
                e.name,
                e.description,
                e.start_date,
                e.duration_in_minutes,
                e.price,
                e.enabled_for_enrollment,
                e.max_assistance,
                e.id_event_category,
                l.id AS location_id,
                l.name AS location_name,
                l.latitude,
                l.longitude
            FROM events e
            INNER JOIN locations l ON e.id_event_location = l.id
            WHERE (e.name ILIKE $1) 
            AND (e.start_date ILIKE $2)
            AND (e.id_event_category ILIKE $3)
        `;

        /*
         WHERE 
                ($1 IS NULL OR e.name ILIKE CONCAT('%', $1, '%') )
            AND
                ($2 IS NULL OR  e.start_date = $2)
            AND
                ($3 IS NULL OR e.id_event_category::text = $3)
        `;
        */
        
        let values = [
            '%'+name+'%',
            '%'+startdate+'%',
            '%'+tag+'%'
        ];
        console.log('sql', sql);
        console.log('values', values);
        let eventos = await client.query(sql, values);

        eventosArray = eventos;
        res.status(200).send(eventos.rows);
    }

    catch (error) {
        console.log('mich')
        res.status(500).send(error);
        console.log(error);
    }

    finally {
        await client.end();
    }
});
 
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
