const mineflayer = require('mineflayer');
const http = require('http');

// Web Server phụ (Port: 58878)
const PORT = process.env.PORT || 58878;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('AFK_Bot_247 dang hoat dong 24/7!');
}).listen(PORT, () => {
  console.log(`Web Server phụ đang chạy ở cổng ${PORT}`);
});

// Cấu hình Bot Minecraft (Port: 55386)
const botOptions = {
  host: 'muitenvn.seedloaf.gg',
  port: 55386,
  username: 'AFK_Bot_247',
  version: false
};

let lastChatTime = 0; // Thời gian phản hồi chat gần nhất (Cooldown chống spam)

function createBot() {
  const bot = mineflayer.createBot(botOptions);

  bot.on('spawn', () => {
    console.log('Bot đã vào server!');
    startAdvancedAntiBan(bot);
  });

  bot.on('death', () => {
    console.log('Bot bị hạ gục, đang tự hồi sinh...');
  });

  // Xử lý lệnh chat kèm Cooldown 3 giây (Tránh Anti-Spam Kick)
  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    const now = Date.now();
    if (now - lastChatTime < 3000) return; 

    const msg = message.toLowerCase().trim();

    if (msg === '!pos' || msg === '!toado') {
      lastChatTime = now;
      const p = bot.entity.position;
      bot.chat(`[Vị trí] X: ${Math.round(p.x)}, Y: ${Math.round(p.y)}, Z: ${Math.round(p.z)}`);
    } else if (msg === '!status' || msg === '!trangthai') {
      lastChatTime = now;
      bot.chat(`[Trạng thái] Máu: ${Math.round(bot.health)}/20 | Thức ăn: ${Math.round(bot.food)}/20`);
    } else if (msg === '!jump' || msg === '!nhay') {
      lastChatTime = now;
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 400);
      bot.chat('Đã nhảy!');
    } else if (msg === '!ping') {
      lastChatTime = now;
      bot.chat('Pong! Bot đang chạy siêu mượt 24/7.');
    }
  });

  // Tự động ăn khi đói
  bot.on('health', () => {
    if (bot.food < 15) {
      const foodItem = bot.inventory.items().find(item => 
        item.name.includes('cooked') || 
        item.name.includes('bread') || 
        item.name.includes('apple') || 
        item.name.includes('steak')
      );
      if (foodItem) {
        bot.equip(foodItem, 'hand')
          .then(() => bot.consume())
          .catch(() => {});
      }
    }
  });

  // Tự động kết nối lại ngẫu nhiên 10s - 20s (Né hệ thống Anti-Bot IP Flood)
  bot.on('end', () => {
    const reconnectDelay = 10000 + Math.floor(Math.random() * 10000);
    console.log(`Kết nối bị ngắt, đang thử lại sau ${Math.round(reconnectDelay / 1000)} giây...`);
    setTimeout(createBot, reconnectDelay);
  });

  bot.on('error', (err) => console.log('Lỗi hệ thống:', err.message));
}

// Hệ thống hành vi giả lập người chơi nâng cao
function startAdvancedAntiBan(bot) {
  function executeAction() {
    if (!bot || !bot.entity) return;

    bot.clearControlStates();

    // 1. Nhìn vào người chơi gần đó (nếu có) để tạo sự tương tác tự nhiên
    const filter = e => e.type === 'player' && e.username !== bot.username && e.position.distanceTo(bot.entity.position) < 8;
    const nearbyPlayer = bot.nearestEntity(filter);

    if (nearbyPlayer && Math.random() < 0.4) {
      bot.lookAt(nearbyPlayer.position.offset(0, nearbyPlayer.height, 0), false);
    } else {
      // Quay camera mượt (false = tránh Anti-Cheat bắt lỗi Impossible Head Rotation)
      const yaw = (Math.random() * 2 - 1) * Math.PI;
      const pitch = (Math.random() * 0.4 - 0.2);
      bot.look(yaw, pitch, false);
    }

    // 2. Chuyển đổi ô hotbar ngẫu nhiên (Giả lập thao tác tay người chơi)
    if (Math.random() < 0.35) {
      const randomSlot = Math.floor(Math.random() * 9);
      bot.setQuickBarSlot(randomSlot);
    }

    // 3. Vung tay ngẫu nhiên
    if (Math.random() < 0.25) {
      bot.swing('arm');
    }

    // 4. Các hành động di chuyển hỗn hợp
    const action = Math.floor(Math.random() * 8);

    switch (action) {
      case 0:
        bot.setControlState('forward', true);
        break;
      case 1:
        bot.setControlState('back', true);
        break;
      case 2:
        bot.setControlState('left', true);
        break;
      case 3:
        bot.setControlState('right', true);
        break;
      case 4:
        // Đứng yên quan sát
        break;
      case 5:
        // Vừa tiến vừa nhảy nhẹ
        bot.setControlState('forward', true);
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 350);
        break;
      case 6:
        // Ngồi nhún (Sneak)
        bot.setControlState('sneak', true);
        setTimeout(() => bot.setControlState('sneak', false), 800 + Math.random() * 500);
        break;
      case 7:
        // Di chuyển chéo
        bot.setControlState('forward', true);
        bot.setControlState('right', true);
        break;
    }

    // Độ dài di chuyển từ 0.8s - 2.2s
    const moveDuration = 800 + Math.random() * 1400;
    setTimeout(() => {
      if (bot && bot.entity) bot.clearControlStates();
    }, moveDuration);

    // Thời gian chờ biến thiên giữa các hành động (3.5s - 9s)
    const nextDelay = 3500 + Math.random() * 5500;
    setTimeout(executeAction, nextDelay);
  }

  executeAction();
}

createBot();
