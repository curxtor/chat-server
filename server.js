const express = require('express')
const app = express()
const http = require('http').Server(app)
const port = 3000
const db = require('./base/base.js')
const cors = require('cors')
app.use(cors())
app.use(express.json())

const io = require('socket.io')(http, {
  cors: {
    origins: ['https://localhost:8080']
  }
})

app.post('/get-messages', async (req,res) => {
	let t = req.body.room
	await db.all(`SELECT * FROM messages WHERE room='${t}';`, (err,rows) => {
		if (rows === undefined) {
				res.statusCode = 401
				res.json()
		}
		else {
				res.status = 200
				res.json(rows)
		}
	})
})

io.on('connection', (socket) => {
	socket.on('send-message', async ([user, room, msg]) => {
		console.log(io.sockets.adapter.rooms)
		socket.to(room).emit('message', ([user,msg]))
		const now = new Date();
		const year = now.getFullYear();
		const month = ("0" + (now.getMonth() + 1)).slice(-2);
		const day = ("0" + now.getDate()).slice(-2);
		const hour = ("0" + now.getHours()).slice(-2);
		const minute = ("0" + now.getMinutes()).slice(-2);
		const second = ("0" + now.getSeconds()).slice(-2);
		const formatted = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
		await db.exec(`INSERT INTO messages (user, room, msg, date) VALUES ("${user}", "${room}", "${msg}", "${formatted}")`)
  });
	socket.on('joinRoom', async ([room, user]) => {
		socket.username = user
		socket.join(room)
		let users = Array.from(await io.in(`${room}`).fetchSockets())
		let newUsers = []
		for (let i=0; i< users.length; i++) newUsers.push(users[i].username)
		io.in(`${room}`).emit('newConnect', (newUsers))
	})
	socket.on('leaveRoom', async (room) => {
		socket.leave(room)
		let users = Array.from(await io.in(`${room}`).fetchSockets())
		let newUsers = []
		for (let i=0; i< users.length; i++) newUsers.push(users[i].username)
		io.in(`${room}`).emit('deleteConnect', (newUsers))
	})
});

http.listen(3000, () => {
        console.log(`Server started at port ${port}`);
    });