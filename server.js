const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Connect to SQLite database stored in a file
const db = new sqlite3.Database('./chatroom.db');

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT)");

    // Serve static files from the root directory
    app.use(express.static(path.join(__dirname, '.')));

    // Serve index.html for the root path
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    wss.on('connection', (ws) => {
        // Send existing messages to the new client
        db.each("SELECT content FROM messages", (err, row) => {
            if (err) {
                console.error(err.message);
            } else {
                ws.send(row.content);
            }
        });

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                if (data.action === 'clear') {
                    clearServer(ws);
                }
            } catch {
                // Insert new message into the database
                const stmt = db.prepare("INSERT INTO messages (content) VALUES (?)");
                stmt.run(message, (err) => {
                    if (err) {
                        console.error(err.message);
                    } else {
                        // Broadcast the new message to all connected clients
                        wss.clients.forEach((client) => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(message);
                            }
                        });
                    }
                });
                stmt.finalize();
            }
        });
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Server is listening on port ${PORT}`);
    });
});

function clearServer(ws) {
    db.run("DELETE FROM messages", (err) => {
        if (err) {
            console.error(err.message);
        } else {
            ws.send('Server cleared');
            console.log('Server cleared');
        }
    });
}
