const { OpenAI } = require('openai');
const config = require('../config');

// Inisialisasi client OpenAI yang diarahkan ke 9router
let client = null;

function getClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: config.router9.apiKey || 'dummy_key',
      baseURL: config.router9.baseURL || 'https://api.9router.com/v1',
    });
  }
  return client;
}

// Memory percakapan per user (menyimpan hingga 10 pesan terakhir)
const conversations = new Map();
const MAX_HISTORY = 10;

const SYSTEM_PROMPT = `Kamu adalah "rinezz", asisten AI WhatsApp yang pintar, ramah, santai, ekspresif, dan tidak kaku.
Identitas dan kepribadianmu:
- Nama: rinezz
- Pembuat: rinezzero
- Karakter: Ramah, asik diajak ngobrol, humoris jika situasi santai, tapi tetap pintar, solutif, dan berwawasan luas saat ditanya hal serius/pelajaran/coding.
- Gaya penulisan: Gunakan format teks WhatsApp yang nyaman dibaca (*teks tebal* untuk poin penting, _teks miring_, emoji yang pas, dan tidak kaku).
- Jangan menjawab dengan jawaban yang terlalu berbelit-belit kecuali user meminta penjelasan panjang atau tutorial lengkap.
- Jika ada yang bertanya siapa dirimu atau siapa pembuatmu, jelaskan dengan bangga bahwa kamu adalah rinezz buatan rinezzero.`;

function getHistory(userId) {
  if (!conversations.has(userId)) {
    conversations.set(userId, []);
  }
  return conversations.get(userId);
}

function clearMemory(userId) {
  conversations.delete(userId);
}

async function askAI(userId, userPrompt) {
  if (!config.router9.apiKey || config.router9.apiKey === 'masukkan_api_key_9router_disini') {
    return '⚠️ *API Key 9router belum dikonfigurasi!*\n\nSilakan isi `ROUTER9_API_KEY` di file `.env` terlebih dahulu agar otak AI rinezz dapat aktif.';
  }

  const history = getHistory(userId);

  // Tambahkan prompt user ke riwayat
  history.push({ role: 'user', content: userPrompt });

  // Batasi jumlah riwayat agar hemat token
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history
  ];

  try {
    const openai = getClient();
    const response = await openai.chat.completions.create({
      model: config.router9.model || 'kr/auto',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    const reply = response.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return 'Maaf, rinezz sedang tidak bisa merespon saat ini. Coba tanyakan lagi ya!';
    }

    // Simpan respon AI ke riwayat
    history.push({ role: 'assistant', content: reply });
    return reply;
  } catch (error) {
    console.error('[AI Error 9router]:', error.message || error);
    
    // Jangan biarkan error mengotori history
    if (history.length > 0 && history[history.length - 1].role === 'user') {
      history.pop();
    }

    return `⚠️ Terjadi kendala saat menghubungi AI 9router:\n_${error.message || 'Koneksi gagal atau timeout'}_`;
  }
}

// Fitur Hiburan Khusus (Roast, Joke, Curhat)
async function getRoast(target) {
  const prompt = target
    ? `Berikan roasting yang lucu, kocak, santai, dan kena mental tapi tetap bersahabat untuk orang bernama "${target}". Jangan menyinggung SARA/fisik ekstrem.`
    : `Berikan roasting yang lucu, santai, dan kocak tentang kebiasaan orang sehari-hari yang suka overthinking atau malas ngerjain tugas.`;
  return askAI('roast_temp_' + Date.now(), prompt);
}

async function getJoke() {
  const prompt = `Ceritakan 1 jokes bapak-bapak atau tebak-tebakan receh khas Indonesia yang lucu dan bikin senyum tipis.`;
  return askAI('joke_temp_' + Date.now(), prompt);
}

async function getCurhat(userMessage) {
  const prompt = `User sedang curhat: "${userMessage}". Balaslah sebagai teman dekat yang hangat, suportif, berempati tinggi, dan memberi semangat tanpa menggurui.`;
  return askAI('curhat_temp_' + Date.now(), prompt);
}

module.exports = {
  askAI,
  clearMemory,
  getRoast,
  getJoke,
  getCurhat
};
