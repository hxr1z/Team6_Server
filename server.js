const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();
const port = 3000;

const dbConfig= {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
};

const app = express();
app.use(express.json());
app.get('/', (req, res) => {
    res.send('Server is running! Try /recyclables to see the data.');
});

app.get('/recyclables', async (req,res) => {
    let connection; 
    try {
        connection = await mysql.createConnection(dbConfig); // Create connection
        const [rows] = await connection.execute('SELECT * FROM defaultdb.recyclables');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error'});
    } finally {
        if (connection) await connection.end(); 
    }
});

// CREATE: Add a new recyclable item
app.post('/additem', async (req, res) => {
    const { name, type, quantity, date } = req.body;
    let connection; // 1. Declare outside
    try {
        connection = await mysql.createConnection(dbConfig);
        const query = 'INSERT INTO recyclables (name, type, quantity, date) VALUES (?, ?, ?, ?)';

        await connection.execute(query, [name, type, quantity, date]);
        // await connection.end();  <-- REMOVE THIS from here

        res.status(201).json({ message: `${name} added successfully to recyclables` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error adding item' });
    } finally {
        if(connection) await connection.end(); // 2. Close in finally
    }
});

// UPDATE: Modify an existing item by ID
app.put('/updateitem/:id', async (req, res) => {
    const { id } = req.params;
    const { name, type, quantity, date } = req.body;
    let connection; // 1. Declare outside
    try {
        connection = await mysql.createConnection(dbConfig);
        const query = 'UPDATE recyclables SET name = ?, type = ?, quantity = ?, date = ? WHERE id = ?';

        await connection.execute(query, [name, type, quantity, date, id]);
        
        res.json({ message: 'Recyclable item updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating item' });
    } finally {
        if(connection) await connection.end(); // 2. Close in finally
    }
});

// DELETE: Remove an item by ID
app.delete('/deleteitem/:id', async (req, res) => {
    const { id } = req.params;
    let connection; // 1. Declare outside
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM recyclables WHERE id = ?', [id]);
        
        res.json({ message: `Item with ID ${id} deleted successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error deleting item' });
    } finally {
        if(connection) await connection.end(); // 2. Close in finally
    }
});

app.listen(port, () => console.log(`Server started on port ${port}`));
