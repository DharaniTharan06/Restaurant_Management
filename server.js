// --- Dependencies ---
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config(); // To load environment variables from .env file

// --- Express App Setup ---
const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Database Connection ---
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// --- Role Permissions ---
// Managers can perform structural changes
const managerPermissions = new Set(['CREATE', 'ALTER', 'DROP']);
// Staff can manage data
const staffPermissions = new Set(['SELECT', 'INSERT', 'UPDATE', 'DELETE']);


// --- API Routes ---

/**
 * @route   POST /api/login
 * @desc    Authenticate a user and return their role
 * @access  Public
 */
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    // WARNING: Storing and comparing plaintext passwords is NOT SECURE.
    // In a real application, use a library like bcrypt to hash passwords.
    const query = 'SELECT username, role FROM users WHERE username = $1 AND password = $2';
    
    try {
        const result = await pool.query(query, [username, password]);
        if (result.rows.length > 0) {
            res.status(200).json({
                message: 'Login successful.',
                user: result.rows[0]
            });
        } else {
            res.status(401).json({ error: 'Invalid username or password.' });
        }
    } catch (err) {
        console.error('Error during login', err.stack);
        res.status(500).json({ error: 'An error occurred during login.' });
    }
});

/**
 * @route   POST /api/users
 * @desc    Fetch all users (Manager Only)
 * @access  Manager
 */
app.post('/api/users', async (req, res) => {
    const { role } = req.body;

    if (role !== 'manager') {
        return res.status(403).json({ error: 'Permission Denied. Only managers can view user data.' });
    }

    try {
        const result = await pool.query('SELECT username, role FROM users ORDER BY role, username');
         res.status(200).json({
            message: 'User data fetched successfully.',
            command: 'SELECT',
            rowCount: result.rowCount,
            rows: result.rows,
        });
    } catch (err) {
        console.error('Error fetching users', err.stack);
        res.status(500).json({ error: 'Failed to fetch user data.' });
    }
});


/**
 * @route   POST /api/query
 * @desc    Execute a SQL query with role-based access control
 * @access  Authenticated Users
 */
app.post('/api/query', async (req, res) => {
    const { query, params, role } = req.body;

    // --- Validation ---
    if (!query) return res.status(400).json({ error: 'Query cannot be empty.' });
    if (!role) return res.status(400).json({ error: 'User role must be provided.' });
    
    // --- Permission Check ---
    const command = query.trim().toUpperCase().split(' ')[0];

    if (role === 'manager' && !managerPermissions.has(command)) {
        return res.status(403).json({
            error: 'Permission Denied.',
            details: `Managers can only perform CREATE, ALTER, and DROP operations. You attempted a ${command} operation.`
        });
    }

    if (role === 'staff' && !staffPermissions.has(command)) {
         return res.status(403).json({
            error: 'Permission Denied.',
            details: `Staff can only perform SELECT, INSERT, UPDATE, and DELETE operations. You attempted a ${command} operation.`
        });
    }
    
    if (role !== 'manager' && role !== 'staff') {
        return res.status(400).json({ error: 'Invalid role specified.' });
    }

    // --- Database Execution ---
    let client;
    try {
        client = await pool.connect();
        const result = await client.query(query, params);
        res.status(200).json({
            message: 'Query executed successfully.',
            command: result.command,
            rowCount: result.rowCount,
            rows: result.rows,
        });
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).json({ error: 'Failed to execute query.', details: err.message, query });
    } finally {
        if (client) client.release();
    }
});


// --- Server Initialization ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

