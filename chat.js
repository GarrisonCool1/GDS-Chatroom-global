const nameInput = prompt("Enter your name");

const chat = document.getElementById('chat');
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send');

const wss = new WebSocket(`wss://${window.location.host}`);

wss.onopen = () => {
    console.log('Connected to the WebSocket server');
};

wss.onmessage = (event) => {
    event.data.text().then(text => {
        const message = document.createElement('div');
        message.textContent = text;
        chat.appendChild(message);
        chat.scrollTop = chat.scrollHeight;
    });
};

sendButton.addEventListener('click', () => {
    let username = 'Anonymous';
    if (nameInput) username = nameInput; 
    const message = messageInput.value;
    if (message === 'clear'){
        clearServer()
    }
    wss.send(`<${username}> ${message}`);
    messageInput.value = '';
});

messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendButton.click();
    }
});