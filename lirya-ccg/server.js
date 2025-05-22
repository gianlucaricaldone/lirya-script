// server.js - Server locale per Lirya CCG

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// MIME types per i file
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Funzione per servire file statici
function serveFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File non trovato
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                        <head><title>404 - Pagina non trovata</title></head>
                        <body>
                            <h1>404 - Pagina non trovata</h1>
                            <p>Il file richiesto non è stato trovato: ${filePath}</p>
                            <a href="/">Torna alla home</a>
                        </body>
                    </html>
                `);
            } else {
                // Errore del server
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                        <head><title>500 - Errore del server</title></head>
                        <body>
                            <h1>500 - Errore interno del server</h1>
                            <p>Si è verificato un errore: ${err.message}</p>
                        </body>
                    </html>
                `);
            }
            return;
        }
        
        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(data);
    });
}

// Creazione del server
const server = http.createServer((req, res) => {
    // Aggiungi headers CORS per sviluppo
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Parse dell'URL
    let filePath = req.url;
    
    // Rimuovi query parameters
    const queryIndex = filePath.indexOf('?');
    if (queryIndex !== -1) {
        filePath = filePath.substring(0, queryIndex);
    }
    
    // Redirect root alla index.html
    if (filePath === '/' || filePath === '') {
        filePath = '/index.html';
    }
    
    // Costruisci il path completo del file
    const fullPath = path.join(__dirname, filePath);
    
    // Controlla che il file sia nella directory corrente (sicurezza)
    const relativePath = path.relative(__dirname, fullPath);
    if (relativePath.startsWith('..')) {
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end(`
            <html>
                <head><title>403 - Accesso negato</title></head>
                <body>
                    <h1>403 - Accesso negato</h1>
                    <p>Non hai i permessi per accedere a questo file.</p>
                </body>
            </html>
        `);
        return;
    }
    
    // Log della richiesta
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} -> ${fullPath}`);
    
    // Servi il file
    serveFile(fullPath, res);
});

// Gestione errori del server
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Porta ${PORT} già in uso. Prova con un'altra porta.`);
        console.log(`💡 Prova: node server.js`);
        console.log(`💡 O cambia PORT: PORT=3001 node server.js`);
    } else {
        console.error('❌ Errore del server:', err);
    }
});

// Avvio del server
server.listen(PORT, () => {
    console.log('🎮 ===================================');
    console.log('🎮     LIRYA CCG - SERVER LOCALE');
    console.log('🎮 ===================================');
    console.log(`🚀 Server avviato su porta ${PORT}`);
    console.log(`🌐 Apri il browser su: http://localhost:${PORT}`);
    console.log(`📁 Servendo file da: ${__dirname}`);
    console.log('🎮 ===================================');
    console.log('');
    console.log('📝 Comandi utili:');
    console.log('   • Ctrl+C per fermare il server');
    console.log('   • F5 per ricaricare la pagina');
    console.log('   • F12 per aprire Developer Tools');
    console.log('');
    
    // Prova ad aprire automaticamente il browser (solo su sistemi supportati)
    const open = (url) => {
        const { exec } = require('child_process');
        const platform = process.platform;
        
        let command;
        if (platform === 'win32') {
            command = `start ${url}`;
        } else if (platform === 'darwin') {
            command = `open ${url}`;
        } else if (platform === 'linux') {
            command = `xdg-open ${url}`;
        }
        
        if (command) {
            exec(command, (err) => {
                if (err) {
                    console.log(`💡 Apri manualmente: http://localhost:${PORT}`);
                } else {
                    console.log('🌐 Browser aperto automaticamente');
                }
            });
        }
    };
    
    // Aspetta un secondo prima di aprire il browser
    setTimeout(() => open(`http://localhost:${PORT}`), 1000);
});

// Gestione chiusura graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Chiusura server...');
    server.close(() => {
        console.log('✅ Server chiuso correttamente');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Terminazione server...');
    server.close(() => {
        console.log('✅ Server terminato correttamente');
        process.exit(0);
    });
});