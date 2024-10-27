// Load environment variables
require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const moment = require('moment-timezone');
const BASE_URL = process.env.BASE_URL

const app = express();
const PORT = process.env.PORT || 5000; // Use PORT from .env

// Middleware
app.use(cors({
    origin: "BASE_URL", // or wherever your frontend is hosted
    methods: ["GET", "POST", "DELETE"],
    credentials: true
}));

app.use(bodyParser.json());

// MySQL connection using environment variables
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.PORT || 5000,
    connectTimeout: 50000,
    ssl: {rejectUnauthorized: false}
});

// Connect to MySQL
db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to the database.');
});

// Add this route at the top of your existing routes
// Endpoint to book a car
app.post('/api/bookCar', (req, res) => {
    const { car, fromDate, toDate } = req.body;
    
    // Convert to your timezone
    const from = moment(fromDate).tz('Asia/Kolkata').format(); 
    const to = moment(toDate).tz('Asia/Kolkata').format();

    const query = 'INSERT INTO bookings (car, from_date, to_date) VALUES (?, ?, ?)';
    db.query(query, [car, from, to], (error, results) => {
        if (error) {
            console.error('Error inserting booking:', error);
            return res.status(500).json({ message: 'Error booking the car.' });
        }
        res.json({ message: 'Booking successful!' });
    });
});

// Endpoint to get all bookings
app.get('/api/bookings', (req, res) => {
    const query = 'SELECT * FROM bookings';
    db.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching bookings:', error);
            return res.status(500).json({ message: 'Error fetching bookings.' });
        }

        // Convert to local timezone for display
        const bookings = results.map(booking => ({
            id: booking.id,
            car: booking.car,
            from_date: moment(booking.from_date).tz('Asia/Kolkata').format('YYYY-MM-DD'),
            to_date: moment(booking.to_date).tz('Asia/Kolkata').format('YYYY-MM-DD')
        }));

        res.json(bookings);
    });
});

// Endpoint to delete a booking
app.delete('/api/bookings/:id', (req, res) => {
    const bookingId = req.params.id;
    const query = 'DELETE FROM bookings WHERE id = ?';
    db.query(query, [bookingId], (error, results) => {
        if (error) {
            console.error('Error deleting booking:', error);
            return res.status(500).json({ message: 'Error deleting booking.' });
        }
        res.json({ message: 'Booking deleted successfully!' });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
