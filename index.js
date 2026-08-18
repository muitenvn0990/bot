const mineflayer = require('mineflayer');
const http = require('http');

// ==================== KHỞI TẠO WEB SERVER (RENDER 24/7) ====================
process.on('uncaughtException', (err) => console.log('[Lỗi Hệ Thống]:', err.message));
process.on('unhandledRejection', (reason) => console.log('[Lỗi Rejection]:', reason));

const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('AFK_Bot_247 đang hoạt động!');
}).listen(PORT, () => {
  console.log(`[Web Server] Khởi chạy cổng ${PORT}`);
});

// ==================== CẤU HÌNH BOT VANILLA ====================
const botOptions = {
  host: 'muitenvn.seedloaf.gg',
  port: 55386,
  username: 'AFK_Bot_247',
  version: '1.20.1',
  brand: 'vanilla',
  checkTimeoutInterval: 60000 // Tăng thời gian chờ timeout tránh bị disconnect oan
};

let bot = null;
let afkLoopTimer = null;
let isReconnecting = false;

function createBot() {
  isReconnecting = false;

  // Dọn dẹp bot cũ triệt để trước khi tạo kết nối mới
  if (bot) {
    try {
      bot.removeAllListeners();
      bot.end();
    } catch (e) {}
    bot = null;
  }

  if (afkLoopTimer) clearTimeout(afkLoopTimer);

  console.log('[Bot] Đang kết nối tới server...');
  bot = mineflayer.createBot(botOptions);

  bot.on('spawn', () => {
    console.log('[Bot] Đã đăng nhập thành công! Hệ thống Anti-AFK bắt đầu chạy...');
    startStealthAFKEngine();
  });

  // Tự động hồi sinh khi bị hạ gục
  bot.on('death', () => {
    console.log('[Bot] Bị hạ gục, đang tự động hồi sinh...');
  });

  // Tự động ăn khi đói (Có độ trễ tự nhiên)
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
      }, 500 + Math.random() * 500);
    }
  });

  // Xử lý ngắt kết nối và tự động kết nối lại an toàn
  const handleReconnect = (reason) => {
    if (isReconnecting) return;
    isReconnecting = true;

    if (afkLoopTimer) clearTimeout(afkLoopTimer);

    // Chờ 25 - 30 giây để server xóa hoàn toàn phiên đăng nhập cũ (xử lý triệt để duplicate_login)
    const delay = 25000 + Math.floor(Math.random() * 5000);
    console.log(`[${reason}] Ngắt kết nối. Đợi ${Math.round(delay / 1000)}s để làm sạch phiên trước khi vào lại...`);

    setTimeout(() => {
      createBot();
    }, delay);
  };

  bot.on('end', () => handleReconnect('End'));
  bot.on('kicked', (reason) => {
    const reasonText = typeof reason === 'object' ? JSON.stringify(reason) : reason;
    handleReconnect(`Kicked: ${reasonText}`);
  });
  bot.on('error', (err) => handleReconnect(`Error: ${err.message}`));
}

// ==================== HỆ THỐNG ANTI-AFK ẨN DANH ====================

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

    // Vi sai nhỏ ngẫu nhiên khi di chuột
    const jitterYaw = (Math.random() - 0.5) * 0.015;
    const jitterPitch = (Math.random() - 0.5) * 0.01;

    const nextYaw = startYaw + (targetYaw - startYaw) * progress + jitterYaw;
    const nextPitch = startPitch + (targetPitch - startPitch) * progress + jitterPitch;

    bot.look(nextYaw, nextPitch, true);

    if (currentStep >= steps) clearInterval(interval);
  }, 35 + Math.floor(Math.random() * 15));
}

function startStealthAFKEngine() {
  function afkRoutine() {
    if (!bot || !bot.entity) {
      afkLoopTimer = setTimeout(afkRoutine, 4000);
      return;
    }

    bot.clearControlStates();

    const actions = [
      // Kịch bản 1: Xoay đầu ngẫu nhiên
      () => {
        const y = bot.entity.yaw + (Math.random() - 0.5) * 1.5;
        const p = (Math.random() - 0.5) * 0.4;
        smoothLookHuman(y, p);
      },
      // Kịch bản 2: Di chuyển ngắn
      () => {
        const dir = Math.random() < 0.6 ? 'forward' : 'back';
        bot.setControlState(dir, true);
        setTimeout(() => {
          if (bot) bot.clearControlStates();
        }, 300 + Math.random() * 400);
      },
      // Kịch bản 3: Đổi ô Hotbar
      () => {
        const slot = Math.floor(Math.random() * 9);
        bot.setQuickBarSlot(slot);
      },
      // Kịch bản 4: Cúi người (Sneak)
      () => {
        bot.setControlState('sneak', true);
        setTimeout(() => {
          if (bot) bot.setControlState('sneak', false);
        }, 600 + Math.random() * 600);
      }
    ];

    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    randomAction();

    // Chu kỳ hành động ngẫu nhiên (5s - 9s)
    const nextInterval = 5000 + Math.floor(Math.random() * 4000);
    afkLoopTimer = setTimeout(afkRoutine, nextInterval);
  }

  afkRoutine();
}

createBot();
