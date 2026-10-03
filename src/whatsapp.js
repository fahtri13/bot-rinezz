const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const ai = require('./ai');
const { handleCommand } = require('./commands');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Set untuk mencatat pesan yang dikirim oleh bot sendiri agar tidak terjadi looping
const sentMessageIds = new Set();
function markSentMessage(id) {
  if (!id) return;
  sentMessageIds.add(id);
  if (sentMessageIds.size > 2000) {
    const firstKey = sentMessageIds.values().next().value;
    sentMessageIds.delete(firstKey);
  }
}

// Ekstrak teks pesan dari berbagai jenis pesan WhatsApp
function extractMessageText(msg) {
  if (!msg.message) return '';
  const message = msg.message;
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.documentMessage?.caption ||
    ''
  );
}

// Cek apakah pesan mengutip (reply) pesan bot
function isReplyingToBot(msg, botJid) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
  if (!quoted) return false;
  const botNumber = botJid.split(':')[0].split('@')[0];
  const quotedNumber = quoted.split(':')[0].split('@')[0];
  return botNumber === quotedNumber;
}

// Cek apakah pesan menyebut (mention) nomor bot
function isMentioningBot(msg, botJid) {
  const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const botNumber = botJid.split(':')[0].split('@')[0];
  return mentions.some(jid => jid.split(':')[0].split('@')[0] === botNumber);
}

async function startWhatsAppBot() {
  const sessionDir = path.resolve(config.sessionDir);
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  console.log(`[rinezz] Menggunakan Baileys versi ${version.join('.')} (Latest: ${isLatest})`);

  const logger = pino({ level: 'silent' });

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: !config.usePairingCode,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    generateHighQualityLinkPreview: true,
    browser: ['Ubuntu', 'Chrome', '20.0.04']
  });

  // Intercept sendMessage agar semua pesan yang dikirim oleh script bot tercatat ID-nya (mencegah loop)
  const rawSendMessage = sock.sendMessage.bind(sock);
  sock.sendMessage = async (...args) => {
    const result = await rawSendMessage(...args);
    if (result?.key?.id) {
      markSentMessage(result.key.id);
    }
    return result;
  };

  // Metode Pairing Code (jika diaktifkan)
  if (config.usePairingCode && !sock.authState.creds.registered) {
    let phoneNumber = config.pairingNumber;
    if (!phoneNumber) {
      console.log('\n======================================================');
      console.log('            METODE LOGIN PAIRING CODE                 ');
      console.log('======================================================');
      phoneNumber = await question('Masukkan nomor WhatsApp Anda (contoh 6281234567890): ');
    }

    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    console.log(`[rinezz] Meminta kode pairing untuk nomor: ${phoneNumber}...`);

    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;
        console.log('\n======================================================');
        console.log(`🔥 KODE PAIRING ANDA: ${formattedCode}`);
        console.log('Buka WhatsApp di HP -> Perangkat Tertaut -> Tautkan dengan nomor telepon');
        console.log('Masukkan 8 digit kode di atas!');
        console.log('======================================================\n');
      } catch (err) {
        console.error('[rinezz] Gagal meminta kode pairing:', err.message);
      }
    }, 3000);
  }

  // Update Status Koneksi
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && !config.usePairingCode) {
      console.log('\n[rinezz] Scan QR Code di bawah ini untuk menghubungkan bot WhatsApp:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`[rinezz] Koneksi terputus. Status code: ${statusCode}. Reconnecting: ${shouldReconnect}`);

      if (shouldReconnect) {
        setTimeout(() => startWhatsAppBot(), 5000);
      } else {
        console.log('[rinezz] Sesi WhatsApp logout. Menghapus folder session...');
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (_) {}
        console.log('[rinezz] Silakan jalankan ulang bot untuk login kembali.');
        process.exit(0);
      }
    } else if (connection === 'open') {
      console.log('\n======================================================');
      console.log(`✅ BOT "${config.botName.toUpperCase()}" BERHASIL TERHUBUNG KE WHATSAPP!`);
      console.log(`🤖 Model AI: ${config.router9.model} (9router)`);
      console.log(`👤 Owner: ${config.ownerName}`);
      console.log('======================================================\n');
    }
  });

  // Simpan kredensial login
  sock.ev.on('creds.update', saveCreds);

  // Listener Pesan Masuk
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message) continue;

      // Abaikan jika pesan ini dihasilkan otomatis oleh bot sendiri (mencegah loop)
      if (sentMessageIds.has(msg.key.id)) continue;

      const remoteJid = msg.key.remoteJid;
      const isGroup = remoteJid.endsWith('@g.us');
      const botJid = sock.user?.id || '';
      const botNumber = botJid.split(':')[0].split('@')[0];
      const remoteNumber = remoteJid.split(':')[0].split('@')[0];
      const isSelfChat = remoteNumber === botNumber;
      const isFromMe = Boolean(msg.key.fromMe);

      // Tentukan senderJid
      let senderJid = remoteJid;
      if (isGroup) {
        senderJid = msg.key.participant || msg.participant || (isFromMe ? `${botNumber}@s.whatsapp.net` : remoteJid);
      } else if (isFromMe) {
        senderJid = `${botNumber}@s.whatsapp.net`;
      }

      const pushName = (isFromMe ? config.ownerName : msg.pushName) || 'Kawan';

      const rawText = extractMessageText(msg);
      if (!rawText.trim()) continue;

      // 1. Eksekusi Command (jika diawali prefix '/')
      // Bisa digunakan oleh siapa saja, TERMASUK oleh pemilik bot sendiri (fromMe)
      if (rawText.trim().startsWith(config.prefix)) {
        try {
          const handled = await handleCommand({
            sock,
            msg,
            text: rawText,
            senderJid,
            pushName,
            isGroup
          });
          if (handled !== false) continue;
        } catch (err) {
          console.error('[Command Handler Error]:', err);
          await sock.sendMessage(remoteJid, { text: `⚠️ Terjadi error saat memproses perintah:\n_${err.message}_` }, { quoted: msg });
          continue;
        }
      }

      // 2. Deteksi Trigger AI
      let isAiTriggered = false;
      let cleanQuery = rawText;

      if (isSelfChat) {
        // Di chat pribadi ke nomor sendiri (Message Yourself):
        // Bebas mengetik apa saja untuk mengobrol dengan AI rinezz
        isAiTriggered = true;
      } else if (!isGroup) {
        // Di chat pribadi dengan orang lain:
        // Jika orang lain yang kirim pesan, bot membalas.
        // Jika pemilik bot yang sedang chat ke orang lain, bot TIDAK ikut campur.
        if (!isFromMe) {
          isAiTriggered = true;
        }
      } else {
        // Di grup WhatsApp:
        // Trigger jika mention bot (@rinezz) atau reply ke bot
        if (isMentioningBot(msg, botJid)) {
          isAiTriggered = true;
          cleanQuery = rawText.replace(/@\d+/g, '').trim();
        } else if (isReplyingToBot(msg, botJid)) {
          isAiTriggered = true;
        }
      }

      // 3. Respon AI 9router (kr/auto)
      if (isAiTriggered && cleanQuery.trim().length > 0) {
        try {
          await sock.sendPresenceUpdate('composing', remoteJid);
          const aiReply = await ai.askAI(senderJid, cleanQuery.trim());
          await sock.sendMessage(remoteJid, { text: aiReply }, { quoted: msg });
        } catch (err) {
          console.error('[AI Trigger Error]:', err);
          await sock.sendMessage(remoteJid, { text: `⚠️ Maaf, terjadi kesalahan saat menghubungi AI rinezz.` }, { quoted: msg });
        } finally {
          await sock.sendPresenceUpdate('paused', remoteJid);
        }
      }
    }
  });

  return sock;
}

module.exports = {
  startWhatsAppBot
};
