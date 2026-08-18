const mineflayer = require('mineflayer');
const http = require('http');

// Bắt lỗi hệ thống để tránh crash app 24/7 trên Render
process.on('uncaughtException', (err) => {
  console.log('[Lỗi Bắt Được]:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.log('[Lỗi Rejection]:', reason);
});

// Web Server phụ duy trì uptime (Port từ process.env.PORT hoặc 58878)
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
  version: '1.20.1'
};

// Cấu hình tài khoản tự động đăng nhập (Nếu server yêu cầu /login)
const AUTH_PASSWORD = ''; // Nhập mật khẩu vào đây nếu server cần /login hoặc /register

let bot = null;
let lastChatTime = 0;
let patrolTimer = null;
let isReconnecting = false;
let followTarget = null;

function createBot() {
  isReconnecting = false;
  followTarget = null;

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
    console.log('Lỗi khởi tạo bot:', err.message);
    handleReconnect('CreateBot Fail');
    return;
  }

  // Khi bot vào server
  bot.on('spawn', () => {
    console.log('Bot đã kết nối vào server thành công!');
    startSafeAntiBanMovement();
  });

  // Tự động gửi lệnh /login hoặc /register nếu server yêu cầu
  bot.on('messagestr', (message) => {
    if (!AUTH_PASSWORD) return;
    const msg = message.toLowerCase();
    if (msg.includes('/login') || msg.includes('/dangnhap')) {
      bot.chat(`/login ${AUTH_PASSWORD}`);
    } else if (msg.includes('/register') || msg.includes('/dangky')) {
      bot.chat(`/register ${AUTH_PASSWORD} ${AUTH_PASSWORD}`);
    }
  });

  // Tự động hồi sinh khi chết
  bot.on('death', () => {
    console.log('Bot đã hy sinh, đang tiến hành hồi sinh...');
  });

  // Xử lý các câu lệnh qua chat (cooldown 2.5s)
  bot.on('chat', (username, message) => {
    if (!bot || username === bot.username) return;

    const now = Date.now();
    if (now - lastChatTime < 2500) return;

    const msg = message.toLowerCase().trim();
    const args = msg.split(' ');
    const cmd = args[0];

    if (cmd === '!help' || cmd === '!trogiup') {
      lastChatTime = now;
      bot.chat('Lệnh bot: !pos, !status, !inv, !jump, !follow, !stop, !ping');
    } 
    else if (cmd === '!pos' || cmd === '!toado') {
      lastChatTime = now;
      if (bot.entity) {
        const p = bot.entity.position;
        bot.chat(`[Vị trí] X: ${Math.round(p.x)}, Y: ${Math.round(p.y)}, Z: ${Math.round(p.z)}`);
      }
    } 
    else if (cmd === '!status' || cmd === '!trangthai') {
      lastChatTime = now;
      bot.chat(`[Trạng thái] Máu: ${Math.round(bot.health)}/20 | Thức ăn: ${Math.round(bot.food)}/20`);
    } 
    else if (cmd === '!inv' || cmd === '!tui') {
      lastChatTime = now;
      const items = bot.inventory.items().map(i => `${i.displayName} x${i.count}`).slice(0, 4).join(', ');
      bot.chat(`[Túi đồ] ${items || 'Túi đồ trống'}`);
    }
    else if (cmd === '!jump' || cmd === '!nhay') {
      lastChatTime = now;
      bot.setControlState('jump', true);
      setTimeout(() => bot && bot.setControlState('jump', false), 400);
      bot.chat('Đã nhảy!');
    } 
    else if (cmd === '!follow' || cmd === '!theotui') {
      lastChatTime = now;
      const target = bot.players[username]?.entity;
      if (target) {
        followTarget = username;
        bot.chat(`Đang đi theo ${username}!`);
      } else {
        bot.chat('Không nhìn thấy bạn ở gần!');
      }
    }
    else if (cmd === '!stop' || cmd === '!dung') {
      lastChatTime = now;
      followTarget = null;
      bot.clearControlStates();
      bot.chat('Đã dừng đi theo.');
    }
    else if (cmd === '!ping') {
      lastChatTime = now;
      bot.chat('Pong! Bot đang chạy siêu mượt 24/7.');
    }
  });

  // Tự động ăn khi độ no < 15
  bot.on('health', () => {
    if (!bot) return;
    if (bot.food < 15) {
      const foodItem = bot.inventory.items().find(item => 
        item.name.includes('cooked') || 
        item.name.includes('bread') || 
        item.name.includes('apple') || 
        item.name.includes('steak') ||
        item.name.includes('porkchop')
      );

      if (foodItem) {
        bot.equip(foodItem, 'hand')
          .then(() => bot.consume())
          .catch(() => {});
      }
    }
  });

  // Xử lý mất kết nối tự động kết nối lại
  const handleReconnect = (reason) => {
    if (isReconnecting) return;
    isReconnecting = true;
    if (patrolTimer) clearTimeout(patrolTimer);

    const delay = 10000 + Math.floor(Math.random() * 5000); // 10s - 15s
    console.log(`[${reason}] Mất kết nối. Tự động kết nối lại sau ${Math.round(delay / 1000)}s...`);

    setTimeout(() => {
      createBot();
    }, delay);
  };

  bot.on('end', () => handleReconnect('End'));
  bot.on('kicked', (reason) => console.log('Bị kick vì:', reason));
  bot.on('error', (err) => handleReconnect(`Error: ${err.message}`));
}

// Hệ thống Anti-AFK & Đi theo người chơi thông minh
function startSafeAntiBanMovement() {
  function action() {
    if (!bot || !bot.entity) {
      patrolTimer = setTimeout(action, 3000);
      return;
    }

    bot.clearControlStates();

    // Đi theo người chơi (nếu nhận lệnh !follow)
    if (followTarget) {
      const playerEntity = bot.players[followTarget]?.entity;
      if (playerEntity) {
        const dist = bot.entity.position.distanceTo(playerEntity.position);
        bot.lookAt(playerEntity.position.offset(0, playerEntity.height, 0), true);
        if (dist > 3) {
          bot.setControlState('forward', true);
          if (dist > 8) bot.setControlState('sprint', true);
        }
        patrolTimer = setTimeout(action, 600);
        return;
      }
    }

    // Anti-Void Protection (Kiểm tra xem bot có rơi ra khỏi world không)
    const p = bot.entity.position;
    if (p.y <= 0) {
      bot.look((Math.random() * 2 - 1) * Math.PI, 0, false);
      patrolTimer = setTimeout(action, 4000);
      return;
    }

    // Xoay góc nhìn tự nhiên hướng về người chơi ở gần
    const nearbyPlayer = bot.nearestEntity(e => e.type === 'player' && e.username !== bot.username && e.position.distanceTo(bot.entity.position) < 8);
    if (nearbyPlayer && Math.random() < 0.4) {
      bot.lookAt(nearbyPlayer.position.offset(0, nearbyPlayer.height, 0), false);
    } else {
      bot.look((Math.random() * 2 - 1) * Math.PI, (Math.random() * 0.4 - 0.2), false);
    }

    // Chuyển slot hotbar ngẫu nhiên
    if (Math.random() < 0.25) {
      bot.setQuickBarSlot(Math.floor(Math.random() * 9));
    }

    // Vung tay ngẫu nhiên
    if (Math.random() < 0.2) {
      if (typeof bot.swingArm === 'function') bot.swingArm('right');
      else if (typeof bot.swing === 'function') bot.swing('arm');
    }

    // Di chuyển ngắn ngẫu nhiên
    const moveType = Math.floor(Math.random() * 6);
    switch (moveType) {
      case 0: bot.setControlState('forward', true); break;
      case 1: bot.setControlState('back', true); break;
      case 2: bot.setControlState('left', true); break;
      case 3: bot.setControlState('right', true); break;
      case 4: 
        bot.setControlState('sneak', true); 
        setTimeout(() => bot && bot.setControlState('sneak', false), 800); 
        break;
      case 5: break;
    }

    const moveDuration = 400 + Math.random() * 600;
    setTimeout(() => {
      if (bot && bot.entity && !followTarget) bot.clearControlStates();
    }, moveDuration);

    const nextDelay = 3500 + Math.random() * 4500;
    patrolTimer = setTimeout(action, nextDelay);
  }

  action();
}

createBot();
