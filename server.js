const path = require('path');
const http = require('http'); //create a HTTP server that listens to server ports and gives a response back to the client.
const express = require('express'); //import express module
const socketio = require('socket.io'); //to get the package
const formatMessage = require('./utils/messages');
const {
	userJoin,
	getCurrentUser,
	userLeave,
	getRoomUsers,
} = require('./utils/users');

const app = express(); //assign the module to our app
const server = http.createServer(app);
const io = socketio(server);

//set static folder to access our frontend
app.use(express.static(path.join(__dirname, 'public'))); //serve static files such as images, CSS files, and JavaScript files from public folder

const botName = 'Chat Bot';

//run when client connects
io.on('connection', (socket) => {
	socket.on('joinRoom', ({ username, room }) => {
		const user = userJoin(socket.id, username, room);
		socket.join(user.room);

		//welcome current user
		socket.emit('message', formatMessage(botName, 'Welcome to USIU Chat')); //this is used to send an event and second parameter is what we send

		//broadcast when user connects
		socket.broadcast
			.to(user.room)
			.emit(
				'message',
				formatMessage(botName, `${user.username} has joined the chat`)
			);

		//send users and room info
		io.to(user.room).emit('roomUsers', {
			room: user.room,
			users: getRoomUsers(user.room),
		});
	});

	//listen for chat message
	socket.on('chatMessage', (msg) => {
		const user = getCurrentUser(socket.id);

		io.to(user.room).emit('message', formatMessage(user.username, msg));
	});

	//runs when client disconnects
	socket.on('disconnect', () => {
		const user = userLeave(socket.id);
		if (user) {
			io
				.to(user.room)
				.emit(
					'message',
					formatMessage(botName, `${user.username} has left the chat`)
				);

			//send users and room info
			io.to(user.room).emit('roomUsers', {
				room: user.room,
				users: getRoomUsers(user.room),
			});
		}
	});
});

const PORT = process.env.PORT || 3000; //to check if we have environment variable port and use that

server.listen(PORT, () => console.log(`Server runs on port ${PORT}`)); //to listen to our port where application runs
