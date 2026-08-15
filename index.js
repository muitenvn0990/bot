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

// Cấu hình Bot Minecraft (Port mới: 55386)
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
    bot.chat('AFK_Bot_247 đã sẵn sàng trực 24/7!');
    startPatrol(bot);
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

function startPatrol(bot) {
  let step = 0;
  setInterval(() => {
    if (!bot || !bot.entity) return;
    bot.clearControlStates();

    switch (step % 4) {
      case 0:
        bot.setControlState('forward', true);
        bot.look(0, 0);
        break;
      case 1:
        bot.setControlState('left', true);
        bot.look(Math.PI / 2, 0);
        break;
      case 2:
        bot.setControlState('back', true);
        bot.look(Math.PI, 0);
        break;
      case 3:
        bot.setControlState('right', true);
        bot.look(-Math.PI / 2, 0);
        bot.setControlState('jump', true);
        break;
    }
    step++;
  }, 3000);
}

createBot();
