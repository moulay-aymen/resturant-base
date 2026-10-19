import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const DB_FILE = process.env.DB_FILE || './database.json';

// Helper function to read data from local file
const readData = () => {
  if (!fs.existsSync(DB_FILE)) {
    // If file doesn't exist yet, create it with empty data
    const initialData = { reservations: [], orders: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  const data = fs.readFileSync(DB_FILE, 'utf8');
  return JSON.parse(data);
};

// Helper function to write data to local file
const writeData = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// ==========================================
//           RESERVATIONS ENDPOINTS
// ==========================================
app.get('/api/reservations', (req, res) => {
  const db = readData();
  res.json(db.reservations);
});

app.post('/api/reservations', (req, res) => {
  const db = readData();
  const { name, email, phone, date, time, guests } = req.body;
  const newReservation = {
    id: `RES-${Date.now().toString().slice(-4)}`,
    name,
    email,
    phone: phone || 'N/A',
    date,
    time,
    guests,
    status: 'Pending',
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  db.reservations.unshift(newReservation);
  writeData(db);
  res.status(201).json(newReservation);
});

app.patch('/api/reservations/:id', (req, res) => {
  const db = readData();
  const { id } = req.params;
  const { status } = req.body;
  db.reservations = db.reservations.map(r => r.id === id ? { ...r, status } : r);
  writeData(db);
  res.json({ success: true });
});

app.delete('/api/reservations/:id', (req, res) => {
  const db = readData();
  const { id } = req.params;
  db.reservations = db.reservations.filter(r => r.id !== id);
  writeData(db);
  res.json({ success: true });
});

// ==========================================
//               ORDERS ENDPOINTS
// ==========================================
app.get('/api/orders', (req, res) => {
  const db = readData();
  res.json(db.orders);
});

app.post('/api/orders', (req, res) => {
  const db = readData();
  const { customer, items, total, type } = req.body;
  const newOrder = {
    id: `ORD-${Date.now().toString().slice(-4)}`,
    customer: customer || 'Online Guest',
    items,
    total,
    status: 'Pending',
    type: type || 'Online Order',
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  db.orders.unshift(newOrder);
  writeData(db);
  res.status(201).json(newOrder);
});

app.patch('/api/orders/:id', (req, res) => {
  const db = readData();
  const { id } = req.params;
  const { status } = req.body;
  db.orders = db.orders.map(o => o.id === id ? { ...o, status } : o);
  writeData(db);
  res.json({ success: true });
});

app.delete('/api/orders/:id', (req, res) => {
  const db = readData();
  const { id } = req.params;
  db.orders = db.orders.filter(o => o.id !== id);
  writeData(db);
  res.json({ success: true });
});

// Start Local Server
app.listen(PORT, () => {
  console.log(`✅ Local Restaurant Backend is running at: http://localhost:${PORT}`);
  console.log(`📂 Data is being saved permanently to local 'database.json' file.`);
});
