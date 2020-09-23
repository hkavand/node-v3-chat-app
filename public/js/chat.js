const socket = io()

//elements
const $form = document.querySelector('#message-form')
const $input = $form.querySelector('input')
const $button = $form.querySelector('button')
const $location = document.querySelector('#send_location')
const $messages = document.querySelector('#messages')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-message').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const {username, room} = Qs.parse(location.search,{ignoreQueryPrefix : true})

const autoscroll = ()=>{
    //new message element
    const $newMessage = $messages.lastElementChild

    //getting the height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //height of messages container 
    const containerHeight = $messages.scrollHeight

    //how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on('locationMessage',(ldata)=>{
    const html = Mustache.render(locationTemplate,{
        username: ldata.username,
        url : ldata.url ,
        createdAt : moment(ldata.createdAt).format('h:mm a')
    }) 
    $messages.insertAdjacentHTML('beforeend',html)   
    autoscroll()  
})

socket.on('roomData', ({room, users})=>{
    const html = Mustache.render(sidebarTemplate,{room, users})
    document.querySelector('#sidebar').innerHTML = html
})


socket.on('message',(message)=>{
    // console.log(message)
    const html = Mustache.render(messageTemplate , {
        username: message.username,
        message : message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

$form.addEventListener('submit',(e)=>{
    e.preventDefault()
    //disable form
    $button.setAttribute('disabled','disabled')

    const messageData = e.target.elements.msg.value
    socket.emit('sendmessage',messageData, (error)=>{

        //enable form
        $button.removeAttribute('disabled')
        $input.value = ''
        $input.focus()
        if(error){
            return console.log(error)
        }
        console.log('msg delivered')
    })
})

$location.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('geolocation is not suppported by you browser')
    }
    $location.setAttribute('disabled' , 'disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendlocation' , position.coords.latitude,position.coords.longitude, (error)=>{
            console.log(error)
            $location.removeAttribute('disabled')
        })
    })
})

socket.emit('join', {username , room}, (error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})
