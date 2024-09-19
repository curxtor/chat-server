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
	socket.join(socket.id)
	socket.on('send-message', async ([user, room, msg]) => {
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
	socket.on('joinRoom', (room) => {
		socket.join(room)
	})
	socket.on('leaveRoom', (room) => {
		socket.leave(room)
	})
});

http.listen(port, () => {
	console.log(`Server listening on port ${port}`)
})