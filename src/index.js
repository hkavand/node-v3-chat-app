const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')

const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const { generateMessage , generateLocation } = require('./utils/messages')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public')
app.use(express.static(publicDirectoryPath))

io.on('connection',(socket)=>{
    console.log('new websocket connection')


    socket.on('join' , ({username, room}, callback)=>{
        
        const {error, user} = addUser({id: socket.id, username, room})
        if (error){
            return callback(error)
        }

        socket.join(user.room)
        //io.to.emit        sending message to a room
        ///socket.broadcast.to.emit 
        socket.emit('message',generateMessage('Admin', 'welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`))

        io.to(user.room).emit('roomData', {
            room:user.room,
            users: getUsersInRoom(user.room)
        })
    
        callback()
    })

    socket.on('sendmessage', (msg , callback)=>{
        const user = getUser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(msg)){
            return callback('profanity is not allowed')
        }
        io.to(user.room).emit('message',generateMessage(user.username, msg))
        callback('delivered')
    })

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin', `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }


    })

    socket.on('sendlocation',(lat,long , callback)=>{
        // io.emit('message', 'https://google.com/maps?q=' + lat + ','+ long)
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocation(user.username, 'https://google.com/maps?q=' + lat + ','+ long) )
        callback('location shared')
        // console.log(obj)
    })
})



server.listen(port,()=>{
    console.log('listening on port ' + port)
})
