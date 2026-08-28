const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

const MASTER_PASSWORD = "662607004";

// Conexão com o Neon
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_tqngLbaRKH42@ep-floral-king-ayk1609i-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    ssl: {
        rejectUnauthorized: false
    }
});


// ==============================
// ADMIN
// ==============================

app.post("/admin/login", (req, res) => {
    const { password } = req.body;

    if (password === MASTER_PASSWORD) {
        res.json({
            success: true
        });
    } else {
        res.json({
            success: false
        });
    }
});


// ==============================
// BANCO DE DADOS
// ==============================

async function initDB() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS biblioteca (
            id INTEGER PRIMARY KEY,
            dados JSONB NOT NULL
        )
    `);

    const result = await pool.query(
        "SELECT id FROM biblioteca WHERE id = 1"
    );

    if (result.rows.length === 0) {
        await pool.query(
            "INSERT INTO biblioteca (id, dados) VALUES (1, $1)",
            ["{}"]
        );
    }
}


// ==============================
// LER BANCO
// ==============================

async function readDB() {
    const result = await pool.query(
        "SELECT dados FROM biblioteca WHERE id = 1"
    );

    if (result.rows.length === 0) {
        return {};
    }

    return result.rows[0].dados;
}


// ==============================
// SALVAR BANCO
// ==============================

async function saveDB(data) {
    await pool.query(
        `
        INSERT INTO biblioteca (id, dados)
        VALUES (1, $1)
        ON CONFLICT (id)
        DO UPDATE SET dados = EXCLUDED.dados
        `,
        [JSON.stringify(data)]
    );
}


// ==============================
// GET /data
// ==============================

app.get("/data", async (req, res) => {
    try {
        const data = await readDB();

        res.json(data);
    } catch (error) {
        console.error("Erro ao carregar banco:", error);

        res.status(500).json({
            error: "Erro ao carregar banco de dados"
        });
    }
});


// ==============================
// POST /data
// ==============================

app.post("/data", async (req, res) => {
    try {
        await saveDB(req.body);

        res.json({
            ok: true
        });
    } catch (error) {
        console.error("Erro ao salvar banco:", error);

        res.status(500).json({
            ok: false,
            error: "Erro ao salvar banco de dados"
        });
    }
});


// ==============================
// INICIAR SERVIDOR
// ==============================

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await initDB();

        console.log("Banco de dados Neon conectado!");

        app.listen(PORT, () => {
            console.log(
                "Backend rodando na porta " + PORT
            );
        });

    } catch (error) {
        console.error(
            "Erro ao iniciar banco de dados:",
            error
        );

        process.exit(1);
    }
}

startServer();