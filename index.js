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
    const client = new Client(config);
    try {
        console.log("Entro al try");
        await client.connect();
        
        // Obtener parámetros de query
        const { name, startdate, tag } = req.query;
        
        // Query base con JOIN para obtener información completa
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
                u.first_name AS creator_first_name,
                u.last_name AS creator_last_name,
                u.username AS creator_username,
                l.id AS location_id,
                l.name AS location_name,
                l.full_address AS location_address,
                l.latitude AS location_latitude,
                l.longitude AS location_longitude
            FROM "events" e
            INNER JOIN "locations" l ON e.id_event_location = l.id
            INNER JOIN "users" u ON e.id_creator_user = u.id
        `;
        
        // Arrays para condiciones WHERE y parámetros
        let whereConditions = [];
        let queryParams = [];
        let paramCounter = 1;
        
        // Agregar condiciones de búsqueda si existen parámetros
        if (name) {
            whereConditions.push(`e.name ILIKE $${paramCounter}`);
            queryParams.push(`%${name}%`);
            paramCounter++;
        }
        
        if (startdate) {
            whereConditions.push(`DATE(e.start_date) = $${paramCounter}`);
            queryParams.push(startdate);
            paramCounter++;
        }
        
        if (tag) {
            // Asumiendo que existe una tabla de tags relacionada con eventos
            sql = `
                SELECT DISTINCT
                    e.id,
                    e.name,
                    e.description,
                    e.start_date,
                    e.duration_in_minutes,
                    e.price,
                    e.enabled_for_enrollment,
                    e.max_assistance,
                    u.first_name AS creator_first_name,
                    u.last_name AS creator_last_name,
                    u.username AS creator_username,
                    l.id AS location_id,
                    l.name AS location_name,
                    l.full_address AS location_address,
                    l.latitude AS location_latitude,
                    l.longitude AS location_longitude
                FROM "events" e
                INNER JOIN "locations" l ON e.id_event_location = l.id
                INNER JOIN "users" u ON e.id_creator_user = u.id
                INNER JOIN "event_tags" et ON e.id = et.id_event
                INNER JOIN "tags" t ON et.id_tag = t.id
            `;
            whereConditions.push(`t.name ILIKE $${paramCounter}`);
            queryParams.push(`%${tag}%`);
            paramCounter++;
        }
        
        // Agregar cláusula WHERE si hay condiciones
        if (whereConditions.length > 0) {
            sql += ` WHERE ${whereConditions.join(' AND ')}`;
        }
        
        // Ordenar por fecha de inicio
        sql += ` ORDER BY e.start_date ASC`;
        
        console.log("SQL Query:", sql);
        console.log("Parameters:", queryParams);
        
        let eventos;
        if (queryParams.length > 0) {
            eventos = await client.query(sql, queryParams);
        } else {
            eventos = await client.query(sql);
        }
        
        // Formatear la respuesta para incluir objetos anidados
        const formattedEvents = eventos.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            start_date: row.start_date,
            duration_in_minutes: row.duration_in_minutes,
            price: row.price,
            enabled_for_enrollment: row.enabled_for_enrollment,
            max_assistance: row.max_assistance,
            creator: {
                first_name: row.creator_first_name,
                last_name: row.creator_last_name,
                username: row.creator_username
            },
            location: {
                id: row.location_id,
                name: row.location_name,
                full_address: row.location_address,
                latitude: row.location_latitude,
                longitude: row.location_longitude
            }
        }));
        
        eventosArray = eventos;
        res.status(200).json({
            success: true,
            data: formattedEvents,
            count: formattedEvents.length,
            filters_applied: {
                name: name || null,
                startdate: startdate || null,
                tag: tag || null
            }
        });

    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({
            success: false,
            error: "Error interno del servidor",
            message: error.message
        });
    } finally {
        await client.end();
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
