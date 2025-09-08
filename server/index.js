require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// --- HTTP and Socket.IO Setup ---
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5174", // The address of the frontend client
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json

// Make io instance available to routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

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
app.use('/api/likes', require('./routes/likes'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/invitations', require('./routes/invitations'));


app.get('/', (req, res) => {
  res.send('API is running...');
});

// --- Socket.IO Connection Logic ---
io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  socket.on('leave_room', (room) => {
    socket.leave(room);
    console.log(`User ${socket.id} left room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});


const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
