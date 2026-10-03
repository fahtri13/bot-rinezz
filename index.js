require('dotenv').config();
const config = require('./config');
const { startWhatsAppBot } = require('./src/whatsapp');

console.clear();
console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║     ██████╗ ██╗███╗   ██╗███████╗███████╗███████╗     ║
║     ██╔══██╗██║████╗  ██║██╔════╝╚══███╔╝╚══███╔╝     ║
║     ██████╔╝██║██╔██╗ ██║█████╗    ███╔╝   ███╔╝      ║
║     ██╔══██╗██║██║╚██╗██║██╔══╝   ███╔╝   ███╔╝       ║
║     ██║  ██║██║██║ ╚████║███████╗███████╗███████╗     ║
║     ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝╚══════╝     ║
║                                                       ║
║           WHATSAPP AI & RPG ROLEPLAY BOT              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
`);

console.log(`[rinezz] Inisialisasi Bot WhatsApp...`);
console.log(`[rinezz] Nama Bot    : ${config.botName}`);
console.log(`[rinezz] Versi       : ${config.version}`);
console.log(`[rinezz] Model AI    : ${config.router9.model} (via 9router)`);
console.log(`[rinezz] Pembuat     : ${config.ownerName}`);
console.log(`[rinezz] Login Mode  : ${config.usePairingCode ? 'Pairing Code' : 'QR Code Scan'}`);
console.log('-------------------------------------------------------');

// Tangani uncaught error agar bot tidak langsung mati
process.on('uncaughtException', (err) => {
  console.error('[rinezz] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[rinezz] Unhandled Rejection:', reason);
});

// Mulai bot
startWhatsAppBot();
