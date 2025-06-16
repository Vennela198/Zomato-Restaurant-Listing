const express = require('express');
const multer = require('multer');
const tf = require('@tensorflow/tfjs-node');
const cocoSsd = require('@tensorflow-models/coco-ssd');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

let model;
cocoSsd.load().then(loadedModel => {
  model = loadedModel;
  console.log('Model loaded successfully');
});


const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to the database.');
});

// Fetch restaurants with pagination
app.get('/restaurants', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const sqlCount = "SELECT COUNT(*) AS total FROM restaurants";
  const sqlData = "SELECT * FROM restaurants LIMIT ? OFFSET ?";

  db.query(sqlCount, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    const totalCount = countResult[0].total;
    const totalPages = Math.ceil(totalCount / limit);

    db.query(sqlData, [limit, offset], (err, dataResult) => {
      if (err) {
        return res.status(500).json({ error: err });
      }
      res.json({ totalPages, restaurants: dataResult });
    });
  });
});

// Get restaurant by ID
app.get('/restaurants/:restaurant_id', (req, res) => {
  const restaurant_id = req.params.restaurant_id;
  const sql = "SELECT * FROM restaurants WHERE restaurant_id = ?";
  
  db.query(sql, [restaurant_id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(404).json({ message: 'Restaurant not found' });
    }
  });
});

app.get('/restaurants/cuisines/:cuisines', (req, res) => {
  const cuisines = req.params.cuisines;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const sqlCount = "SELECT COUNT(*) AS total FROM restaurants WHERE cuisines LIKE CONCAT('%', ?, '%')";
  const sqlData = "SELECT * FROM restaurants WHERE cuisines LIKE CONCAT('%', ?, '%') LIMIT ? OFFSET ?";

  db.query(sqlCount, [cuisines], (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    const totalCount = countResult[0].total;
    const totalPages = Math.ceil(totalCount / limit);

    db.query(sqlData, [cuisines, limit, offset], (err, dataResult) => {
      if (err) {
        return res.status(500).json({ error: err });
      }
      res.json({ totalPages, currentPage: page, restaurants: dataResult });
    });
  });
});

// Search restaurants by location
app.get('/restaurants/location/:lat/:lon/:radius', (req, res) => {
  const { lat, lon, radius } = req.params;

  const query = `
    SELECT *,
      (6371 * acos(
        cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?))
        + sin(radians(?)) * sin(radians(latitude))
      )) AS distance
    FROM restaurants
    HAVING distance <= ?
    ORDER BY distance
  `;

  db.query(query, [parseFloat(lat), parseFloat(lon), parseFloat(lat), parseFloat(radius)], (err, results) => {
    if (err) {
      console.error('SQL Error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'No restaurants found within the specified radius' });
    }
    res.json(results);
  });
});

// Image analysis for food detection

app.post('/restaurants/analyze-image', upload.single('foodImage'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No image uploaded.');
  }

  const image = await tf.node.decodeImage(req.file.buffer, 3);
  const predictions = await model.detect(image);
  image.dispose();

  // Assuming 'foodItems' holds an array of detected food names
  const foodItems = predictions.filter(p => p.class.includes('food')).map(p => p.class.toLowerCase());
  console.log('Detected Foods:', foodItems);

  // SQL query adjusted for better matching
  const sqlQuery = `
    SELECT DISTINCT restaurant_id, restaurant_name, cuisines
    FROM restaurants
    WHERE cuisines LIKE CONCAT('%', ?, '%');
  `;

  // Execute query for each detected food item and consolidate results
  const queryPromises = foodItems.map(food =>
    new Promise((resolve, reject) => {
      db.query(sqlQuery, [food], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    })
  );

  Promise.all(queryPromises)
    .then(results => {
      const uniqueRestaurants = new Set();
      results.flat().forEach(r => uniqueRestaurants.add(JSON.stringify(r))); // Unique by JSON stringification
      res.json(Array.from(uniqueRestaurants).map(JSON.parse));
    })
    .catch(error => {
      console.error('Error querying database:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
});



const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});