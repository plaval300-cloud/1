require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/goals', require('./routes/goals'));

const taskRoutes = require('./routes/tasks');
app.use('/api/goals/:goalId/tasks', taskRoutes.nested);
app.use('/api/tasks', taskRoutes.direct);

const noteRoutes = require('./routes/notes');
app.use('/api/goals/:goalId/notes', noteRoutes.nested);
app.use('/api/notes', noteRoutes.direct);

app.use('/api/articles', require('./routes/articles'));
app.use('/api/profile', require('./routes/profile'));


app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5001; // Using a different port just in case, 5001 for server

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
