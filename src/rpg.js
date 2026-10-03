const fs = require('fs');
const path = require('path');
const config = require('../config');

const DB_DIR = path.dirname(config.dbPath);
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// In-memory cache synced with disk
let players = {};

function loadDatabase() {
  try {
    if (fs.existsSync(config.dbPath)) {
      const data = fs.readFileSync(config.dbPath, 'utf8');
      players = JSON.parse(data || '{}');
    } else {
      players = {};
      saveDatabase();
    }
  } catch (err) {
    console.error('[RPG] Error loading database:', err.message);
    players = {};
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(config.dbPath, JSON.stringify(players, null, 2), 'utf8');
  } catch (err) {
    console.error('[RPG] Error saving database:', err.message);
  }
}

loadDatabase();

// Definisi Role dan Base Stats
const ROLES = {
  tank: {
    name: 'Tank',
    emoji: '🛡️',
    description: 'Ketahanan baja, HP sangat tebal & defense tinggi',
    baseHp: 160,
    hpPerLevel: 25,
    basePower: 28,
    powerPerLevel: 8,
    workJob: 'Bodyguard Elit Kerajaan',
    workAction: 'mengawal konvoi bangsawan kerajaan dari serangan perompak'
  },
  warrior: {
    name: 'Warrior',
    emoji: '⚔️',
    description: 'Petarung seimbang, serangan dan pertahanan stabil',
    baseHp: 130,
    hpPerLevel: 20,
    basePower: 38,
    powerPerLevel: 10,
    workJob: 'Instruktur Latihan Militer',
    workAction: 'melatih pasukan garda depan kekaisaran dalam duel pedang'
  },
  mage: {
    name: 'Mage',
    emoji: '🧙‍♂️',
    description: 'Ahli sihir dengan kekuatan serang dahsyat (Magic Burst)',
    baseHp: 95,
    hpPerLevel: 12,
    basePower: 52,
    powerPerLevel: 14,
    workJob: 'Pustakawan & Peracik Potion',
    workAction: 'meracik ramuan sihir eliksir kuno pesanan guild penyihir'
  },
  archer: {
    name: 'Archer',
    emoji: '🏹',
    description: 'Pemanah lincah dengan akurasi dan critical hit tinggi',
    baseHp: 105,
    hpPerLevel: 15,
    basePower: 45,
    powerPerLevel: 12,
    workJob: 'Bounty Hunter Pemburu Hutan',
    workAction: 'melacak buronan buruan di pedalaman hutan belantara'
  },
  assassin: {
    name: 'Assassin',
    emoji: '🗡️',
    description: 'Pembunuh bayangan dengan damage mematikan',
    baseHp: 95,
    hpPerLevel: 14,
    basePower: 58,
    powerPerLevel: 15,
    workJob: 'Agen Spionase Rahasia',
    workAction: 'menyusup ke markas sindikat bawah tanah untuk mencuri dokumen penting'
  }
};

function getExpNeeded(level) {
  return level * 100;
}

function calculateMaxHp(roleKey, level) {
  const role = ROLES[roleKey] || ROLES.warrior;
  return role.baseHp + (level - 1) * role.hpPerLevel;
}

function calculatePower(roleKey, level) {
  const role = ROLES[roleKey] || ROLES.warrior;
  return role.basePower + (level - 1) * role.powerPerLevel;
}

function getPlayer(jid) {
  return players[jid] || null;
}

function registerPlayer(jid, name, roleKey) {
  const normalizedRole = (roleKey || '').toLowerCase().trim();
  if (!ROLES[normalizedRole]) {
    return {
      success: false,
      message: `Role *"${roleKey}"* tidak ditemukan!\n\nPilihan role yang tersedia:\n${Object.keys(ROLES).map(k => `• *${k}* ${ROLES[k].emoji} (${ROLES[k].description})`).join('\n')}\n\nKetik: */game register <role>*`
    };
  }

  if (players[jid]) {
    return {
      success: false,
      message: `⚠️ Kamu sudah terdaftar sebagai *${players[jid].role}*!\nKetik */game profile* untuk melihat status karaktermu.`
    };
  }

  const role = ROLES[normalizedRole];
  const initialMaxHp = role.baseHp;
  const initialPower = role.basePower;

  players[jid] = {
    id: jid,
    name: name || 'Petualang',
    role: role.name,
    roleKey: normalizedRole,
    level: 1,
    exp: 0,
    hp: initialMaxHp,
    maxHp: initialMaxHp,
    power: initialPower,
    gold: 150, // Modal awal
    kills: 0,
    bossKills: 0,
    lastClaim: 0,
    lastWork: 0,
    lastHunt: 0,
    lastMission: 0,
    createdAt: Date.now()
  };

  saveDatabase();

  return {
    success: true,
    player: players[jid],
    message: `🎉 *PENDAFTARAN PETUALANG BERHASIL!*\n\n` +
      `👤 Nama: *${players[jid].name}*\n` +
      `🎭 Role: ${role.emoji} *${role.name}*\n` +
      `❤️ HP: *${initialMaxHp}/${initialMaxHp}*\n` +
      `⚡ Power: *${initialPower}*\n` +
      `💰 Modal Awal: *150 Gold*\n\n` +
      `Gunakan perintah:\n` +
      `• */claim* - Ambil hadiah harian\n` +
      `• */work* - Bekerja mencari gold\n` +
      `• */game hunt* - Berburu monster\n` +
      `• */mission* - Misi petualangan & boss fight`
  };
}

// Cek dan proses naik level jika EXP cukup
function checkLevelUp(player) {
  let leveledUp = false;
  let oldLevel = player.level;
  
  while (player.exp >= getExpNeeded(player.level)) {
    player.exp -= getExpNeeded(player.level);
    player.level += 1;
    leveledUp = true;
  }

  if (leveledUp) {
    const newMaxHp = calculateMaxHp(player.roleKey, player.level);
    const newPower = calculatePower(player.roleKey, player.level);
    
    // Pulihkan HP penuh saat level up
    player.maxHp = newMaxHp;
    player.hp = newMaxHp;
    player.power = newPower;
    
    return {
      leveledUp: true,
      oldLevel,
      newLevel: player.level,
      newMaxHp,
      newPower
    };
  }

  return { leveledUp: false };
}

function formatCooldown(msRemaining) {
  const totalSeconds = Math.ceil(msRemaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours} jam`);
  if (minutes > 0) parts.push(`${minutes} menit`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} detik`);
  return parts.join(' ');
}

// ==========================================
// 1. PROFILE
// ==========================================
function getProfile(jid) {
  const p = getPlayer(jid);
  if (!p) {
    return `⚠️ Kamu belum terdaftar dalam dunia petualangan *rinezz*!\nKetik */game register <role>* untuk mulai.\n\nPilihan role: *tank, warrior, mage, archer, assassin*`;
  }

  const role = ROLES[p.roleKey] || ROLES.warrior;
  const expTarget = getExpNeeded(p.level);
  const expPercent = Math.min(100, Math.floor((p.exp / expTarget) * 100));
  
  // Progress Bar
  const totalBars = 10;
  const filledBars = Math.floor((expPercent / 100) * totalBars);
  const progressBar = '▰'.repeat(filledBars) + '▱'.repeat(totalBars - filledBars);

  return `🎮 ━━━ *PROFIL PETUALANG* ━━━ 🎮\n\n` +
    `👤 *Nama:* ${p.name}\n` +
    `🎭 *Role:* ${role.emoji} ${p.role}\n` +
    `⭐ *Level:* ${p.level}\n` +
    `📊 *EXP:* [${progressBar}] ${p.exp}/${expTarget} (${expPercent}%)\n` +
    `❤️ *HP:* ${p.hp} / ${p.maxHp}\n` +
    `⚡ *Power:* ${p.power}\n` +
    `💰 *Gold:* ${p.gold.toLocaleString('id-ID')} Gold\n` +
    `⚔️ *Monster Dikalahkan:* ${p.kills || 0}\n` +
    `👑 *Boss Ditaklukkan:* ${p.bossKills || 0}\n\n` +
    `💡 *Tips Perintah:*\n` +
    `• */claim* (Daily Gold & EXP)\n` +
    `• */work* (Bekerja dapat Gold)\n` +
    `• */game hunt* (Berburu EXP)\n` +
    `• */mission* (Misi & Lawan Bos)\n` +
    `• */game heal* (Pulihkan HP)`;
}

// ==========================================
// 2. DAILY CLAIM (/claim)
// ==========================================
function dailyClaim(jid) {
  const p = getPlayer(jid);
  if (!p) return { success: false, message: `⚠️ Kamu belum terdaftar! Ketik */game register <role>* dulu.` };

  const now = Date.now();
  const COOLDOWN = 24 * 60 * 60 * 1000; // 24 Jam
  const diff = now - (p.lastClaim || 0);

  if (diff < COOLDOWN) {
    return {
      success: false,
      message: `⏳ Kamu sudah mengklaim hadiah harian hari ini!\nSilakan tunggu *${formatCooldown(COOLDOWN - diff)}* lagi.`
    };
  }

  // Hadiah harian scale dengan level
  const baseGold = 250 + (p.level * 50);
  const baseExp = 120 + (p.level * 30);

  p.gold += baseGold;
  p.exp += baseExp;
  p.lastClaim = now;

  const levelUpInfo = checkLevelUp(p);
  saveDatabase();

  let msg = `🎁 ━━━ *HADIAH HARIAN DIKLAIM!* ━━━ 🎁\n\n` +
    `Selamat ${p.name}! Kamu telah menerima bantuan dari kerajaan:\n` +
    `💰 +${baseGold.toLocaleString('id-ID')} Gold\n` +
    `⭐ +${baseExp} EXP\n` +
    `Total Gold kamu sekarang: *${p.gold.toLocaleString('id-ID')} Gold*`;

  if (levelUpInfo.leveledUp) {
    msg += `\n\n🎊 *LEVEL UP!* Kamu naik ke *Level ${levelUpInfo.newLevel}*!\n❤️ Max HP naik menjadi: ${levelUpInfo.newMaxHp}\n⚡ Power naik menjadi: ${levelUpInfo.newPower}`;
  }

  return { success: true, message: msg };
}

// ==========================================
// 3. WORK (/work)
// ==========================================
function work(jid) {
  const p = getPlayer(jid);
  if (!p) return { success: false, message: `⚠️ Kamu belum terdaftar! Ketik */game register <role>* dulu.` };

  if (p.hp <= 15) {
    return {
      success: false,
      message: `⚠️ HP kamu sekarat (${p.hp}/${p.maxHp})! Tubuhmu terlalu lelah untuk bekerja.\nKetik */game heal* untuk memulihkan diri.`
    };
  }

  const now = Date.now();
  const COOLDOWN = 45 * 60 * 1000; // 45 Menit Cooldown
  const diff = now - (p.lastWork || 0);

  if (diff < COOLDOWN) {
    return {
      success: false,
      message: `💼 Kamu baru saja selesai bekerja! Kamu butuh istirahat.\nTunggu *${formatCooldown(COOLDOWN - diff)}* lagi.`
    };
  }

  const role = ROLES[p.roleKey] || ROLES.warrior;
  const earnedGold = Math.floor(100 + (p.level * 25) + (Math.random() * 50));
  const earnedExp = Math.floor(40 + (p.level * 10));
  const hpLoss = Math.floor(5 + Math.random() * 8);

  p.gold += earnedGold;
  p.exp += earnedExp;
  p.hp = Math.max(1, p.hp - hpLoss);
  p.lastWork = now;

  const levelUpInfo = checkLevelUp(p);
  saveDatabase();

  let msg = `💼 ━━━ *LAPORAN PEKERJAAN* ━━━ 💼\n\n` +
    `Sebagai *${role.name}*, kamu bertugas sebagai *${role.workJob}* dan ${role.workAction}.\n\n` +
    `📈 *Hasil Kerja:*\n` +
    `💰 +${earnedGold} Gold\n` +
    `⭐ +${earnedExp} EXP\n` +
    `❤️ -${hpLoss} HP (Kelelahan, sisa HP: ${p.hp}/${p.maxHp})`;

  if (levelUpInfo.leveledUp) {
    msg += `\n\n🎊 *LEVEL UP!* Kamu naik ke *Level ${levelUpInfo.newLevel}*!\n❤️ HP & Power pulih dan meningkat!`;
  }

  return { success: true, message: msg };
}

// ==========================================
// 4. HUNT (/game hunt)
// ==========================================
function hunt(jid) {
  const p = getPlayer(jid);
  if (!p) return { success: false, message: `⚠️ Kamu belum terdaftar! Ketik */game register <role>* dulu.` };

  if (p.hp <= 20) {
    return {
      success: false,
      message: `💀 HP kamu terlalu rendah (${p.hp}/${p.maxHp}) untuk berburu!\nKetik */game heal* dulu sebelum mati di hutan.`
    };
  }

  const now = Date.now();
  const COOLDOWN = 2 * 60 * 1000; // 2 Menit Cooldown berburu
  const diff = now - (p.lastHunt || 0);

  if (diff < COOLDOWN) {
    return {
      success: false,
      message: `🌲 Kamu sedang memantau jejak monster di hutan.\nTunggu *${formatCooldown(COOLDOWN - diff)}* lagi untuk berburu kembali.`
    };
  }

  // Daftar monster liar
  const monsters = [
    { name: 'Slime Hijau Berlendir', minLvl: 1, power: 15, exp: 35, gold: 30 },
    { name: 'Serigala Hutan Liar', minLvl: 1, power: 25, exp: 50, gold: 45 },
    { name: 'Goblin Pencuri', minLvl: 2, power: 35, exp: 70, gold: 65 },
    { name: 'Prajurit Skeleton', minLvl: 3, power: 50, exp: 95, gold: 90 },
    { name: 'Troll Gua Batu', minLvl: 4, power: 65, exp: 130, gold: 120 },
    { name: 'Harpy Lembah Badai', minLvl: 6, power: 85, exp: 170, gold: 150 },
    { name: 'Golem Reruntuhan Kuno', minLvl: 8, power: 110, exp: 220, gold: 200 }
  ];

  // Filter monster yang sesuai dengan level pemain
  const eligibleMonsters = monsters.filter(m => m.minLvl <= p.level);
  const target = eligibleMonsters[Math.floor(Math.random() * eligibleMonsters.length)] || monsters[0];

  p.lastHunt = now;

  // Pertarungan
  const playerAtk = p.power + Math.floor(Math.random() * 15);
  const monsterAtk = target.power + Math.floor(Math.random() * 10);

  let damageTaken = Math.max(5, monsterAtk - Math.floor(p.power * 0.2));
  // Jika tank, terima damage lebih kecil
  if (p.roleKey === 'tank') {
    damageTaken = Math.max(3, Math.floor(damageTaken * 0.65));
  }

  p.hp = Math.max(1, p.hp - damageTaken);
  p.exp += target.exp;
  p.gold += target.gold;
  p.kills = (p.kills || 0) + 1;

  const levelUpInfo = checkLevelUp(p);
  saveDatabase();

  let msg = `⚔️ ━━━ *PERBURUAN MONSTER* ━━━ ⚔️\n\n` +
    `Kamu menjelajahi rimba dan bertemu seekor *${target.name}*!\n` +
    `💥 Seranganmu menembus pertahanan monster (${playerAtk} DMG)!\n` +
    `🩸 Monster membalas dan melukaimu (-${damageTaken} HP).\n\n` +
    `🏆 *HASIL PERBURUAN: MENANG!*\n` +
    `⭐ +${target.exp} EXP\n` +
    `💰 +${target.gold} Gold\n` +
    `❤️ Sisa HP: ${p.hp}/${p.maxHp}`;

  if (levelUpInfo.leveledUp) {
    msg += `\n\n🎊 *LEVEL UP!* Selamat! Kamu naik ke *Level ${levelUpInfo.newLevel}*!\n❤️ HP & Power telah diperbarui dan pulih maksimal!`;
  }

  return { success: true, message: msg };
}

// ==========================================
// 5. MISSION (/mission) & EPIC BOSS FIGHT (KELIPATAN LEVEL 5)
// ==========================================
function mission(jid) {
  const p = getPlayer(jid);
  if (!p) return { success: false, message: `⚠️ Kamu belum terdaftar! Ketik */game register <role>* dulu.` };

  if (p.hp <= 35) {
    return {
      success: false,
      message: `⚠️ HP kamu terlalu kritis (${p.hp}/${p.maxHp}) untuk menjalankan misi berbahaya!\nPulihkan diri dengan */game heal*.`
    };
  }

  const now = Date.now();
  const COOLDOWN = 15 * 60 * 1000; // 15 Menit Cooldown
  const diff = now - (p.lastMission || 0);

  if (diff < COOLDOWN) {
    return {
      success: false,
      message: `🗺️ Pasukanmu masih menyelesaikan pemulihan ekspedisi misi sebelumnya.\nSilakan tunggu *${formatCooldown(COOLDOWN - diff)}* lagi.`
    };
  }

  p.lastMission = now;

  // Cek apakah Boss Fight (Kelipatan Level 5: 5, 10, 15, 20, ...)
  const isBossFight = (p.level % 5 === 0);

  if (isBossFight) {
    const bosses = {
      5: { name: '👹 Orc Warlord "Grommash"', reqPower: 55, exp: 600, gold: 800, hpLossMax: 60 },
      10: { name: '🐉 Shadow Wyvern "Nidhogg"', reqPower: 110, exp: 1400, gold: 1800, hpLossMax: 90 },
      15: { name: '💀 Lich King "Kel\'Thuzad"', reqPower: 180, exp: 2600, gold: 3500, hpLossMax: 130 },
      20: { name: '🔥 Ancient Red Dragon "Ignis"', reqPower: 260, exp: 4500, gold: 6000, hpLossMax: 180 }
    };

    // Ambil bos yang cocok atau generate scaling boss jika level > 20
    const boss = bosses[p.level] || {
      name: `⚡ Titan of Cataclysm (Level ${p.level})`,
      reqPower: p.level * 14,
      exp: p.level * 250,
      gold: p.level * 350,
      hpLossMax: p.level * 10
    };

    // Kalkulasi duel bos
    const winProbability = Math.min(0.9, Math.max(0.3, p.power / boss.reqPower));
    const isWin = Math.random() <= winProbability;

    if (isWin) {
      let dmg = Math.floor(boss.hpLossMax * (0.4 + Math.random() * 0.4));
      if (p.roleKey === 'tank') dmg = Math.floor(dmg * 0.6); // Tank resistance
      p.hp = Math.max(1, p.hp - dmg);
      p.exp += boss.exp;
      p.gold += boss.gold;
      p.bossKills = (p.bossKills || 0) + 1;

      const levelUpInfo = checkLevelUp(p);
      saveDatabase();

      let msg = `👑 🔥 ━━━ *EPIC BOSS RAID DEFEATED!* ━━━ 🔥 👑\n\n` +
        `⚔️ Sebagai petualang *Level ${p.level}*, kamu menantang penguasa dungeon:\n` +
        `👹 *${boss.name}*!\n\n` +
        `Pertarungan berlangsung sangat sengit! Jurus pamungkasmu berhasil menumbangkan sang Bos!\n` +
        `🩸 Kamu terluka parah: -${dmg} HP (Sisa HP: ${p.hp}/${p.maxHp})\n\n` +
        `🏆 *REWARD BOS KERAJAAN:*\n` +
        `⭐ +${boss.exp} EXP\n` +
        `💰 +${boss.gold.toLocaleString('id-ID')} Gold\n` +
        `👑 Gelar: *Penakluk ${boss.name}*`;

      if (levelUpInfo.leveledUp) {
        msg += `\n\n🎊 *LEVEL UP DARI BOS RAID!* Selamat! Kamu naik ke *Level ${levelUpInfo.newLevel}*!`;
      }

      return { success: true, message: msg };
    } else {
      // Kalah bos
      const dmg = Math.floor(p.hp * 0.7);
      p.hp = Math.max(1, p.hp - dmg);
      saveDatabase();

      return {
        success: false,
        message: `💀 ━━━ *GAGAL MENGALAHKAN BOS!* ━━━ 💀\n\n` +
          `Kamu berhadapan dengan *${boss.name}*, namun kekuatannya masih terlalu dahsyat untukmu saat ini!\n` +
          `🩸 Kamu terhempas dan kabur dengan luka berat: -${dmg} HP (Sisa HP: ${p.hp}/${p.maxHp}).\n\n` +
          `💡 *Saran:* Tingkatkan levelmu dengan */work* dan */game hunt*, atau gunakan */game heal* lalu coba lagi!`
      };
    }
  }

  // Regular Expedition Mission
  const regularMissions = [
    { title: 'Menyelamatkan Kafilah Dagang yang Disandera', exp: 160, gold: 200, hpCost: 20 },
    { title: 'Menyusup & Menghancurkan Sarang Goblin Liar', exp: 220, gold: 260, hpCost: 28 },
    { title: 'Mempertahankan Menara Pengawas Perbatasan', exp: 280, gold: 320, hpCost: 35 },
    { title: 'Menumpas Sekte Hitam di Bawah Tanah Kota', exp: 350, gold: 400, hpCost: 42 }
  ];

  const m = regularMissions[Math.floor(Math.random() * regularMissions.length)];
  let damage = m.hpCost + Math.floor(Math.random() * 10);
  if (p.roleKey === 'tank') damage = Math.floor(damage * 0.7);

  p.hp = Math.max(1, p.hp - damage);
  const earnedExp = m.exp + (p.level * 15);
  const earnedGold = m.gold + (p.level * 20);

  p.exp += earnedExp;
  p.gold += earnedGold;

  const levelUpInfo = checkLevelUp(p);
  saveDatabase();

  let msg = `🗺️ ━━━ *MISI EKSPEDISI SELESAI* ━━━ 🗺️\n\n` +
    `📜 Misi: *${m.title}*\n` +
    `Status: *BERHASIL DITUNTASKAN!*\n\n` +
    `🩸 Kerusakan diterima: -${damage} HP (Sisa: ${p.hp}/${p.maxHp})\n` +
    `⭐ +${earnedExp} EXP\n` +
    `💰 +${earnedGold} Gold`;

  if (levelUpInfo.leveledUp) {
    msg += `\n\n🎊 *LEVEL UP!* Selamat! Kamu naik ke *Level ${levelUpInfo.newLevel}*!`;
  }

  return { success: true, message: msg };
}

// ==========================================
// 6. HEAL (/game heal)
// ==========================================
function heal(jid) {
  const p = getPlayer(jid);
  if (!p) return { success: false, message: `⚠️ Kamu belum terdaftar! Ketik */game register <role>* dulu.` };

  if (p.hp >= p.maxHp) {
    return { success: false, message: `💚 HP kamu sudah penuh (${p.hp}/${p.maxHp})!` };
  }

  const healCost = 60; // 60 Gold untuk full heal
  if (p.gold < healCost) {
    // Free mini heal jika tidak punya uang
    const freeHeal = Math.min(p.maxHp, p.hp + 30);
    p.hp = freeHeal;
    saveDatabase();
    return {
      success: true,
      message: `🩹 Gold kamu kurang dari ${healCost} Gold. Kamu beristirahat di pondok penginapan dan memulihkan sebagian luka.\n❤️ HP kamu sekarang: *${p.hp}/${p.maxHp}*`
    };
  }

  p.gold -= healCost;
  p.hp = p.maxHp;
  saveDatabase();

  return {
    success: true,
    message: `🧪 *PULIH SEMPURNA!*\nKamu meminum ramuan Eliksir Ajaib seharga ${healCost} Gold.\n❤️ HP kamu kini penuh kembali: *${p.maxHp}/${p.maxHp}*!\n💰 Sisa Gold: ${p.gold} Gold`
  };
}

// ==========================================
// 7. LEADERBOARD (/game top)
// ==========================================
function getLeaderboard() {
  const all = Object.values(players);
  if (all.length === 0) {
    return `🏆 Belum ada petualang yang terdaftar. Jadilah yang pertama dengan */game register <role>*!`;
  }

  // Sort by level desc, then exp desc
  all.sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    return b.exp - a.exp;
  });

  const top10 = all.slice(0, 10);
  const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

  let text = `🏆 ━━━ *PAPAN PERINGKAT PETUALANG* ━━━ 🏆\n\n`;
  top10.forEach((p, index) => {
    const role = ROLES[p.roleKey] || ROLES.warrior;
    text += `${medal[index]} *${p.name}*\n` +
      `   ⭐ Level ${p.level} | ${role.emoji} ${p.role} | 💰 ${p.gold.toLocaleString('id-ID')} G\n\n`;
  });

  text += `Ayo terus bertualang dan raih posisi puncak! ⚔️`;
  return text;
}

module.exports = {
  ROLES,
  getPlayer,
  registerPlayer,
  getProfile,
  dailyClaim,
  work,
  hunt,
  mission,
  heal,
  getLeaderboard
};
