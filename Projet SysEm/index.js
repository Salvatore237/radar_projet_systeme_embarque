const http = require('http');
const app = require('./app');
//const socketHandler = require('./socket/socketHandler');
const { Server } = require('socket.io');
const { connectMqttClient } = require('./Middleware/mqqtServer');


const normalizePort = (val) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};

const port = normalizePort(process.env.PORT || '3000');

const errorHandler = (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + address.port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const server = http.createServer(app);

// initialisation websocket
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST'], // Allow specific HTTP methods
     pingTimeout: 20000,
    pingInterval: 25000
    //allowedHeaders: ['Content-Type'], // Allow specific headers
  },
}); 

//Gestion des connexion Websocket
//io.on('connection', (socket) => {
//  console.log('A user connected:', socket.id);
//  socketHandler(socket, io); // Pass the socket and io to the handler
//}
//);

// Connect MQTT client
app.set('io', io); // Store io in app for later use
connectMqttClient(io);

  


server.on('error', errorHandler);
server.on('listening', () => {
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + address.port;
  console.log('Listening on ' + bind);
});

server.listen(port);

module.exports = server; // Export the server for testing or other purposes