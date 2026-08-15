// 1. TAO WEB SERVER PHU DE CLOUD KHONG BAO LOI PORT (Dung module http co san)
const http = require('http');
const PORT = process.env.PORT || 8080;

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot AFK Minecraft 24/7 dang hoat dong mượt mà!\n');
}).listen(PORT, () => {
  console.log(`[HTTP] Web server phu dang chay tren port ${PORT}`);
});

// 2. BYPASS KIEM TRA PHIEN BAN MINECRAFT
try {
  const versionCheckingPath = require.resolve('minecraft-protocol/src/client/versionChecking');
  require.cache[versionCheckingPath].exports = function () {};
} catch (e) {}

const mineflayer = require('mineflayer');

const serverConfig = {
  host: 'muitenvn.seedloaf.gg',
  port: 55386,
  username: 'AFK_Bot_247',
  version: '1.20.4'
};

let walkInterval = null;
let walkTimeout = null;

function startBot() {
  console.log(`[HE THONG] Dang khoi tao bot: ${serverConfig.username}...`);

  const bot = mineflayer.createBot(serverConfig);

  // Bat vat ly de bot tuan tra hinh vuong
  bot.once('inject_allowed', () => {
    if (bot.physics) bot.physics.enabled = true;
  });

  bot.once('login', () => {
    console.log(`[HE THONG] Server da xac nhan Login thanh cong (${bot.username})!`);
  });

  bot.on('spawn', () => {
    console.log(`[HE THONG] Bot ${bot.username} da vao game & bat dau tuan tra!`);

    if (walkInterval) clearInterval(walkInterval);
    if (walkTimeout) clearTimeout(walkTimeout);

    let step = 0;
    walkInterval = setInterval(() => {
      if (!bot || !bot.entity) return;

      const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      const currentAngle = angles[step % 4];

      bot.look(currentAngle, 0, true);
      bot.setControlState('forward', true);

      walkTimeout = setTimeout(() => {
        if (bot) {
          bot.setControlState('forward', false);
          console.log(`[PATROL] Da xong canh ${ (step % 4) + 1 }/4.`);
        }
      }, 2000);

      step++;
    }, 5000);
  });

  // TU DONG HOI SINH
  bot.on('death', () => {
    console.log('[SU KIEN] Bot da chet! Dang tu dong hoi sinh...');
    if (walkInterval) clearInterval(walkInterval);
    if (walkTimeout) clearTimeout(walkTimeout);
    setTimeout(() => { bot.respawn(); }, 2000);
  });

  // TU DONG AN
  bot.on('health', async () => {
    if (bot.food < 15) {
      try {
        const food = bot.inventory.items().find(item => 
          item.name.includes('cooked') || item.name.includes('bread') || 
          item.name.includes('apple') || item.name.includes('steak')
        );
        if (food) {
          await bot.equip(food, 'hand');
          await bot.consume();
          console.log('[THUC AN] Da tu dong an xong!');
        }
      } catch (err) {}
    }
  });

  // PHAN HOI CHAT
  bot.on('chat', async (username, message) => {
    if (username === bot.username) return;
    const msg = message.toLowerCase().trim();

    if (msg.includes('chao bot') || msg.includes('hi bot')) {
      bot.chat(`Chao ${username}! Minh dang di tuan tra AFK 24/7.`);
    } else if (msg.includes('bot dau')) {
      if (bot.entity) {
        const pos = bot.entity.position;
        bot.chat(`Vi tri X: ${Math.round(pos.x)}, Y: ${Math.round(pos.y)}, Z: ${Math.round(pos.z)}`);
      }
    }
  });

  // KET NOI LAI
  bot.on('end', (reason) => {
    if (walkInterval) clearInterval(walkInterval);
    if (walkTimeout) clearTimeout(walkTimeout);
    console.log(`[HE THONG] Ngat ket noi (${reason}). Thu lai sau 15 giay...`);
    setTimeout(startBot, 15000);
  });

  bot.on('error', (err) => {
    if (walkInterval) clearInterval(walkInterval);
    if (walkTimeout) clearTimeout(walkTimeout);
    console.log('[LOI MANG]', err.message);
  });
}

startBot();
