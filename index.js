const mineflayer = require('mineflayer');
const http = require('http');

// ==================== KHỎI TẠO WEB SERVER (24/7 RENDER) ====================
process.on('uncaughtException', (err) => console.log('[Lỗi Hệ Thống]:', err.message));
process.on('unhandledRejection', (reason) => console.log('[Lỗi Rejection]:', reason));

const PORT = process.env.PORT || 58878;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('AFK_Bot_247 đang chạy 24/7!');
}).listen(PORT, () => {
  console.log(`[Web Server] Khởi chạy cổng ${PORT}`);
});

// ==================== CẤU HÌNH BOT GIẢ LẬP VANILLA CLIENT ====================
const botOptions = {
  host: 'muitenvn.seedloaf.gg',
  port: 55386,
  username: 'AFK_Bot_247',
  version: '1.20.1',
  brand: 'vanilla', // Giả lập Brand gói tin chuẩn Vanilla Mojang
  viewDistance: 'far'
};

let bot = null;
let afkLoopTimer = null;
let isReconnecting = false;

function createBot() {
  isReconnecting = false;

  if (bot) {
    try {
      bot.removeAllListeners();
      bot.quit();
    } catch (e) {}
    bot = null;
  }

  if (afkLoopTimer) clearTimeout(afkLoopTimer);

  bot = mineflayer.createBot(botOptions);

  // 1. Giả lập độ trễ mạng (Ping Jitter) khi phản hồi gói KeepAlive
  bot._client.on('keep_alive', (packet) => {
    const networkLatency = 60 + Math.floor(Math.random() * 90); // Delay 60ms - 150ms như người thật
    setTimeout(() => {
      if (bot && bot._client) {
        bot._client.write('keep_alive', { keepAliveId: packet.keepAliveId });
      }
    }, networkLatency);
  });

  bot.on('spawn', () => {
    console.log('[Bot] Đã kết nối! Đang hoạt động ở chế độ giả lập người chơi Vanilla...');
    startStealthAFKEngine();
  });

  // Tự động ăn với độ trễ phản xạ người chơi
  bot.on('health', () => {
    if (!bot || bot.food >= 15) return;
    const food = bot.inventory.items().find(i => 
      ['cooked_beef', 'cooked_porkchop', 'cooked_chicken', 'bread', 'apple', 'baked_potato', 'steak'].some(f => i.name.includes(f))
    );
    if (food) {
      setTimeout(() => {
        if (!bot) return;
        bot.equip(food, 'hand')
          .then(() => bot.consume())
          .catch(() => {});
      }, 300 + Math.random() * 400);
    }
  });

  const handleReconnect = (reason) => {
    if (isReconnecting) return;
    isReconnecting = true;
    if (afkLoopTimer) clearTimeout(afkLoopTimer);

    const delay = 12000 + Math.floor(Math.random() * 6000);
    console.log(`[${reason}] Thử kết nối lại sau ${Math.round(delay / 1000)}s...`);
    setTimeout(() => createBot(), delay);
  };

  bot.on('end', () => handleReconnect('End'));
  bot.on('kicked', (reason) => handleReconnect('Kicked'));
  bot.on('error', (err) => handleReconnect(`Error: ${err.message}`));
}

// ==================== HỆ THỐNG GIẢ LẬP HÀNH VI ẨN DANH ====================

// Quay góc nhìn có độ rung nhẹ tay người (Human Hand Jitter)
function smoothLookHuman(targetYaw, targetPitch, steps = 10) {
  if (!bot || !bot.entity) return;
  let currentStep = 0;
  const startYaw = bot.entity.yaw;
  const startPitch = bot.entity.pitch;

  const interval = setInterval(() => {
    if (!bot || !bot.entity) {
      clearInterval(interval);
      return;
    }
    currentStep++;
    const progress = currentStep / steps;

    // Sai số ngẫu nhiên mô phỏng vi sai di chuột
    const jitterYaw = (Math.random() - 0.5) * 0.015;
    const jitterPitch = (Math.random() - 0.5) * 0.01;

    const nextYaw = startYaw + (targetYaw - startYaw) * progress + jitterYaw;
    const nextPitch = startPitch + (targetPitch - startPitch) * progress + jitterPitch;

    bot.look(nextYaw, nextPitch, true);

    if (currentStep >= steps) clearInterval(interval);
  }, 30 + Math.floor(Math.random() * 15));
}

function startStealthAFKEngine() {
  function afkRoutine() {
    if (!bot || !bot.entity) {
      afkLoopTimer = setTimeout(afkRoutine, 3000);
      return;
    }

    bot.clearControlStates();

    const actions = [
      // Kịch bản A: Nhìn ngẫu nhiên có độ rung tay
      () => {
        const y = bot.entity.yaw + (Math.random() - 0.5) * 1.4;
        const p = (Math.random() - 0.5) * 0.5;
        smoothLookHuman(y, p);
      },
      // Kịch bản B: Nhấp phím di chuyển ngắn với thời gian giữ phím lẻ
      () => {
        const dir = Math.random() < 0.6 ? 'forward' : 'back';
        bot.setControlState(dir, true);
        setTimeout(() => {
          if (bot) bot.clearControlStates();
        }, 280 + Math.random() * 550);
      },
      // Kịch bản C: Đổi hotbar với độ trễ phản xạ
      () => {
        const slot = Math.floor(Math.random() * 9);
        setTimeout(() => {
          if (bot) bot.setQuickBarSlot(slot);
        }, 180 + Math.random() * 220);
      },
      // Kịch bản D: Ngồi xuống quan sát ngắn
      () => {
        bot.setControlState('sneak', true);
        setTimeout(() => {
          if (bot) bot.setControlState('sneak', false);
        }, 700 + Math.random() * 900);
      }
    ];

    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    randomAction();

    // Chu kỳ ngẫu nhiên không trùng lặp (4.2s - 8.5s)
    const nextInterval = 4200 + Math.floor(Math.random() * 4300);
    afkLoopTimer = setTimeout(afkRoutine, nextInterval);
  }

  afkRoutine();
}

createBot();
