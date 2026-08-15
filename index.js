const mineflayer = require('mineflayer');
const http = require('http');

// Web Server phụ (Port phụ: 58878)
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

function createBot() {
  const bot = mineflayer.createBot(botOptions);

  bot.on('spawn', () => {
    console.log('Bot đã vào server!');
    startAntiBanMovement(bot);
  });

  bot.on('death', () => {
    console.log('Bot bị hạ gục, đang hồi sinh...');
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    const msg = message.toLowerCase().trim();

    if (msg === '!pos' || msg === '!toado') {
      const p = bot.entity.position;
      bot.chat(`[Vị trí] X: ${Math.round(p.x)}, Y: ${Math.round(p.y)}, Z: ${Math.round(p.z)}`);
    } else if (msg === '!status' || msg === '!trangthai') {
      bot.chat(`[Trạng thái] Máu: ${Math.round(bot.health)}/20 | Thức ăn: ${Math.round(bot.food)}/20`);
    } else if (msg === '!jump' || msg === '!nhay') {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
      bot.chat('Đã nhảy!');
    } else if (msg === '!ping') {
      bot.chat('Pong! Bot đang chạy siêu mượt 24/7.');
    }
  });

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

  bot.on('end', () => {
    console.log('Kết nối bị ngắt, đang thử lại sau 10 giây...');
    setTimeout(createBot, 10000);
  });

  bot.on('error', (err) => console.log('Lỗi hệ thống:', err.message));
}

// Thuật toán di chuyển ngẫu nhiên hóa mô phỏng người chơi (Anti-Ban)
function startAntiBanMovement(bot) {
  function randomAction() {
    if (!bot || !bot.entity) return;

    bot.clearControlStates();

    // Xoay hướng nhìn ngẫu nhiên
    const yaw = (Math.random() * 2 - 1) * Math.PI;
    const pitch = (Math.random() * 0.6 - 0.3);
    bot.look(yaw, pitch, true);

    // Tỷ lệ 30% quơ tay ngẫu nhiên
    if (Math.random() < 0.3) {
      bot.swing('arm');
    }

    // Chọn hành động ngẫu nhiên (0: Tiến, 1: Lùi, 2: Trái, 3: Phải, 4: Đứng yên, 5: Tiến + Nhảy, 6: Ngồi)
    const action = Math.floor(Math.random() * 7);

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
        bot.setControlState('forward', true);
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 400);
        break;
      case 6:
        bot.setControlState('sneak', true);
        bot.setControlState('forward', true);
        setTimeout(() => bot.setControlState('sneak', false), 1200);
        break;
    }

    // Thời gian di chuyển ngắn ngẫu nhiên từ 1s - 2.5s
    const moveDuration = 1000 + Math.random() * 1500;
    setTimeout(() => {
      if (bot && bot.entity) bot.clearControlStates();
    }, moveDuration);

    // Thời gian nghỉ ngẫu nhiên trước hành động tiếp theo (3s - 8s)
    const nextDelay = 3000 + Math.random() * 5000;
    setTimeout(randomAction, nextDelay);
  }

  randomAction();
}

createBot();
