const mineflayer = require('mineflayer');
const http = require('http');

// Web Server phụ duy trì Render (Port: 58878 hoặc tự động lấy từ process.env.PORT)
const PORT = process.env.PORT || 58878;

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('AFK_Bot_247 dang hoat dong 24/7!');
}).listen(PORT, () => {
  console.log(`Web Server phụ đang chạy ở cổng ${PORT}`);
});

const botOptions = {
  host: 'muitenvn.seedloaf.gg',
  port: 55386,
  username: 'AFK_Bot_247',
  version: '1.20.1' // Đã cố định phiên bản để tránh lỗi tự động dò tìm
};

let bot = null;
let lastChatTime = 0;
let patrolTimer = null;
let isReconnecting = false;

function createBot() {
  isReconnecting = false;

  // Dọn dẹp listener và ngắt tiến trình bot cũ triệt để
  if (bot) {
    try {
      bot.removeAllListeners();
      bot.quit();
    } catch (e) {}
    bot = null;
  }

  if (patrolTimer) clearTimeout(patrolTimer);

  try {
    bot = mineflayer.createBot(botOptions);
  } catch (err) {
    console.log('Khởi tạo Bot thất bại:', err.message);
    handleReconnect('CreateBot Error');
    return;
  }

  bot.on('spawn', () => {
    console.log('Bot đã vào server thành công!');
    startSafeAntiBanMovement();
  });

  bot.on('death', () => {
    console.log('Bot bị hạ gục, đang hồi sinh...');
  });

  // Xử lý chat an toàn kèm cooldown 3 giây
  bot.on('chat', (username, message) => {
    if (!bot || username === bot.username) return;

    const now = Date.now();
    if (now - lastChatTime < 3000) return;

    const msg = message.toLowerCase().trim();

    if (msg === '!pos' || msg === '!toado') {
      lastChatTime = now;
      if (bot.entity) {
        const p = bot.entity.position;
        bot.chat(`[Vị trí] X: ${Math.round(p.x)}, Y: ${Math.round(p.y)}, Z: ${Math.round(p.z)}`);
      }
    } else if (msg === '!status' || msg === '!trangthai') {
      lastChatTime = now;
      bot.chat(`[Trạng thái] Máu: ${Math.round(bot.health)}/20 | Thức ăn: ${Math.round(bot.food)}/20`);
    } else if (msg === '!jump' || msg === '!nhay') {
      lastChatTime = now;
      bot.setControlState('jump', true);
      setTimeout(() => bot && bot.setControlState('jump', false), 400);
      bot.chat('Đã nhảy!');
    } else if (msg === '!ping') {
      lastChatTime = now;
      bot.chat('Pong! Bot đang chạy siêu mượt 24/7.');
    }
  });

  // Tự động ăn
  bot.on('health', () => {
    if (!bot) return;
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

  const handleReconnect = (reason) => {
    if (isReconnecting) return;
    isReconnecting = true;
    if (patrolTimer) clearTimeout(patrolTimer);

    const delay = 12000 + Math.floor(Math.random() * 8000); // 12s - 20s
    console.log(`[${reason}] Mất kết nối. Thử đăng nhập lại sau ${Math.round(delay / 1000)}s...`);

    setTimeout(() => {
      createBot();
    }, delay);
  };

  bot.on('end', () => handleReconnect('End'));
  bot.on('kicked', (reason) => console.log('Bị kick vì:', reason));
  bot.on('error', (err) => handleReconnect(`Error: ${err.message}`));
}

function startSafeAntiBanMovement() {
  function action() {
    if (!bot || !bot.entity) {
      patrolTimer = setTimeout(action, 4000);
      return;
    }

    bot.clearControlStates();

    // Kiểm tra vị trí an toàn
    const p = bot.entity.position;
    if (p.y <= 0) {
      bot.look((Math.random() * 2 - 1) * Math.PI, 0, false);
      patrolTimer = setTimeout(action, 5000);
      return;
    }

    // Xoay góc nhìn
    const filter = e => e.type === 'player' && e.username !== bot.username && e.position.distanceTo(bot.entity.position) < 8;
    const nearbyPlayer = bot.nearestEntity(filter);

    if (nearbyPlayer && Math.random() < 0.3) {
      bot.lookAt(nearbyPlayer.position.offset(0, nearbyPlayer.height, 0), false);
    } else {
      bot.look((Math.random() * 2 - 1) * Math.PI, (Math.random() * 0.4 - 0.2), false);
    }

    // Chuyển ô hotbar
    if (Math.random() < 0.3) {
      bot.setQuickBarSlot(Math.floor(Math.random() * 9));
    }

    // Vung tay
    if (Math.random() < 0.2) {
      if (typeof bot.swingArm === 'function') {
        bot.swingArm('right');
      } else if (typeof bot.swing === 'function') {
        bot.swing('arm');
      }
    }

    // Di chuyển
    const moveType = Math.floor(Math.random() * 6);
    switch (moveType) {
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
        bot.setControlState('sneak', true);
        setTimeout(() => bot && bot.setControlState('sneak', false), 800);
        break;
      case 5:
        break;
    }

    const moveDuration = 500 + Math.random() * 700;
    setTimeout(() => {
      if (bot && bot.entity) bot.clearControlStates();
    }, moveDuration);

    const nextDelay = 4000 + Math.random() * 5000;
    patrolTimer = setTimeout(action, nextDelay);
  }

  action();
}

createBot();
