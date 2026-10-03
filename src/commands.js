const config = require('../config');
const ai = require('./ai');
const rpg = require('./rpg');

const startTime = Date.now();

function formatUptime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days} hari`);
  if (hours > 0) parts.push(`${hours} jam`);
  if (minutes > 0) parts.push(`${minutes} menit`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} detik`);
  return parts.join(' ');
}

async function handleCommand({ sock, msg, text, senderJid, pushName, isGroup }) {
  const trimmed = text.trim();
  const startTimeCmd = Date.now();

  // Helper untuk reply
  const reply = async (content) => {
    return await sock.sendMessage(msg.key.remoteJid, { text: content }, { quoted: msg });
  };

  // Parsing command and arguments
  let command = '';
  let args = [];

  if (trimmed.startsWith(config.prefix)) {
    const split = trimmed.slice(config.prefix.length).trim().split(/\s+/);
    command = split[0].toLowerCase();
    args = split.slice(1);
  }

  // 1. /ping
  if (command === 'ping') {
    const latency = Date.now() - startTimeCmd;
    const uptimeStr = formatUptime(Date.now() - startTime);
    return reply(
      `🏓 *Pong!*\n\n` +
      `⚡ *Kecepatan Respon:* \`${latency} ms\`\n` +
      `⏱️ *Uptime Bot:* \`${uptimeStr}\`\n` +
      `🟢 *Status:* Aktif & Siap Melayani!`
    );
  }

  // 2. /menu atau /help
  if (command === 'menu' || command === 'help') {
    const menuText =
      `🤖 ━━━ *${config.botName.toUpperCase()} AI WHATSAPP* ━━━ 🤖\n` +
      `_Halo, *${pushName}*! Saya adalah asisten AI serba bisa & game petualangan._\n\n` +
      `🧠 *[ FITUR AI 9ROUTER (kr/auto) ]*\n` +
      `• */ai <pertanyaan>* : Tanya apa saja ke rinezz\n` +
      `• *@${config.botName} <pesan>* : Panggil rinezz di grup\n` +
      `• *[Reply Pesan]* : Balas pesan rinezz langsung\n` +
      `• */reset* : Hapus ingatan obrolan AI\n\n` +
      `⚔️ *[ PETUALANGAN RPG ]*\n` +
      `• */game* : Panduan & info roleplay game\n` +
      `• */game register <role>* : Daftar karakter (Tank, Warrior, Mage, Archer, Assassin)\n` +
      `• */game profile* : Cek status, HP, Power, Level & Gold\n` +
      `• */game hunt* : Berburu monster untuk EXP & Gold\n` +
      `• */game heal* : Pulihkan HP\n` +
      `• */game top* : Papan peringkat petualang tertinggi\n` +
      `• */claim* : Hadiah harian (Daily EXP & Gold)\n` +
      `• */work* : Bekerja sesuai role untuk cari Gold\n` +
      `• */mission* : Ekspedisi & Boss Raid (Tiap level kelipatan 5)\n\n` +
      `🎉 *[ SANTAI & HIBURAN ]*\n` +
      `• */roast [nama]* : Roasting santai & kocak\n` +
      `• */joke* : Tebak-tebakan / lelucon receh\n` +
      `• */curhat <teks>* : Teman curhat yang suportif\n\n` +
      `⚙️ *[ INFORMASI ]*\n` +
      `• */ping* : Cek kecepatan bot & status online\n` +
      `• */info* : Informasi bot & developer\n` +
      `• */menu* : Menampilkan menu ini\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 _Ketik perintah diawali dengan tanda slash (/)_`;
    return reply(menuText);
  }

  // 3. /info
  if (command === 'info') {
    const uptimeStr = formatUptime(Date.now() - startTime);
    const infoText =
      `ℹ️ ━━━ *INFO BOT ${config.botName.toUpperCase()}* ━━━ ℹ️\n\n` +
      `🏷️ *Nama Bot:* ${config.botName}\n` +
      `📦 *Versi:* ${config.version}\n` +
      `🧠 *Model AI:* ${config.router9.model} (via 9router)\n` +
      `⚡ *WA Library:* @whiskeysockets/baileys\n` +
      `⏱️ *Uptime:* ${uptimeStr}\n` +
      `👤 *Pembuat / Owner:* ${config.ownerName}\n` +
      `📌 *Platform:* Node.js\n\n` +
      `_Bot WhatsApp modern dengan integrasi AI cerdas, fitur percakapan santai, dan sistem game roleplay interaktif!_`;
    return reply(infoText);
  }

  // 4. /reset
  if (command === 'reset') {
    ai.clearMemory(senderJid);
    return reply(`🧹 *Memori percakapan dibersihkan!* rinezz siap memulai topik obrolan baru denganmu.`);
  }

  // 5. /roast
  if (command === 'roast') {
    const target = args.join(' ');
    const roastResult = await ai.getRoast(target);
    return reply(`🔥 *ROASTING TIME!*\n\n${roastResult}`);
  }

  // 6. /joke
  if (command === 'joke') {
    const jokeResult = await ai.getJoke();
    return reply(`😂 *JOKES RECEH*\n\n${jokeResult}`);
  }

  // 7. /curhat
  if (command === 'curhat') {
    const curhatMsg = args.join(' ');
    if (!curhatMsg) {
      return reply(`Ketik */curhat <ceritamu>* yaa. Aku siap dengerin apa pun yang lagi mengganjal di pikiranmu! 😊`);
    }
    const curhatReply = await ai.getCurhat(curhatMsg);
    return reply(curhatReply);
  }

  // 8. /claim (Daily)
  if (command === 'claim') {
    const res = rpg.dailyClaim(senderJid);
    return reply(res.message);
  }

  // 9. /work
  if (command === 'work') {
    const res = rpg.work(senderJid);
    return reply(res.message);
  }

  // 10. /mission
  if (command === 'mission') {
    const res = rpg.mission(senderJid);
    return reply(res.message);
  }

  // 11. /game
  if (command === 'game') {
    const subCmd = (args[0] || '').toLowerCase();
    const subArg = args.slice(1).join(' ');

    if (subCmd === 'register' || subCmd === 'daftar') {
      const res = rpg.registerPlayer(senderJid, pushName, subArg);
      return reply(res.message);
    }

    if (subCmd === 'profile' || subCmd === 'status' || subCmd === 'me') {
      const profile = rpg.getProfile(senderJid);
      return reply(profile);
    }

    if (subCmd === 'hunt' || subCmd === 'berburu') {
      const res = rpg.hunt(senderJid);
      return reply(res.message);
    }

    if (subCmd === 'heal' || subCmd === 'obat') {
      const res = rpg.heal(senderJid);
      return reply(res.message);
    }

    if (subCmd === 'top' || subCmd === 'leaderboard') {
      const leaderboard = rpg.getLeaderboard();
      return reply(leaderboard);
    }

    // Default /game menu
    const gameMenu =
      `🎮 ━━━ *PANDUAN ROLEPLAY GAME ${config.botName.toUpperCase()}* ━━━ 🎮\n\n` +
      `Selamat datang di petualangan RPG! Pilih role impianmu, naikkan level, kalahkan monster, dan tantang bos perkasa setiap kelipatan level 5!\n\n` +
      `🛡️ *ROLE YANG TERSEDIA:*\n` +
      `• *Tank* 🛡️ : Pertahanan tebal, HP melimpah\n` +
      `• *Warrior* ⚔️ : Petarung seimbang, serangan & tahan banting\n` +
      `• *Mage* 🧙‍♂️ : Sihir mematikan (Magic Burst damage)\n` +
      `• *Archer* 🏹 : Pemanah lincah, serangan critical tinggi\n` +
      `• *Assassin* 🗡️ : Serangan bayangan mematikan\n\n` +
      `📜 *PERINTAH GAME:*\n` +
      `• */game register <role>* : Pilih role & mulai petualangan\n` +
      `• */game profile* : Cek stats Level, HP, Power & Gold\n` +
      `• */claim* : Ambil hadiah harian (EXP & Gold)\n` +
      `• */work* : Bekerja sesuai role untuk gaji Gold\n` +
      `• */game hunt* : Berburu monster liar di hutan\n` +
      `• */mission* : Ekspedisi & Boss Raid (Level 5, 10, 15, dst)\n` +
      `• */game heal* : Mengisi ulang HP\n` +
      `• */game top* : Papan peringkat petualang terbaik\n\n` +
      `_Ayo daftar sekarang: */game register warrior*_`;
    return reply(gameMenu);
  }

  // 12. /ai <pertanyaan>
  if (command === 'ai') {
    const question = args.join(' ');
    if (!question) {
      return reply(`Mau tanya apa ke rinezz? Contoh:\n*/ai jelaskan cara kerja AI secara sederhana*`);
    }
    const aiAnswer = await ai.askAI(senderJid, question);
    return reply(aiAnswer);
  }

  return false; // Bukan command terdaftar
}

module.exports = {
  handleCommand
};
