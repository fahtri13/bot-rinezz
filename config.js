require('dotenv').config();

module.exports = {
  botName: process.env.BOT_NAME || 'rinezz',
  version: '1.0.0',
  ownerName: process.env.OWNER_NAME || 'rinezzero',
  
  // 9router AI configuration
  router9: {
    apiKey: process.env.ROUTER9_API_KEY || '',
    baseURL: process.env.ROUTER9_BASE_URL || 'https://api.9router.com/v1',
    model: process.env.AI_MODEL || 'kr/auto',
  },
  
  // WhatsApp connection config
  usePairingCode: process.env.USE_PAIRING_CODE === 'true',
  pairingNumber: process.env.PAIRING_NUMBER || '', // Contoh: 6281234567890
  sessionDir: process.env.SESSION_DIR || './session',
  
  // Command prefix
  prefix: '/',
  
  // Database file
  dbPath: './database/players.json'
};
