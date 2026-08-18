const mineflayer = require('mineflayer');
const http = require('http');

// ==================== KHỎI TẠO WEB SERVER (GIỮ BOT ONLINE 24/7 TRÊN RENDER) ====================
process.on('uncaughtException', (err) => console.log('[Lỗi Hệ Thống]:', err.message));
process.on('unhandledRejection', (reason) => console.log('[Lỗi Rejection]:', reason));

const PORT = process.env.PORT || 58878;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('AFK_Bot_247 đang chạy 24/7!');
}).listen(PORT, () => {
  console.log(`[Web Server] Khởi chạy cổng ${PORT}`);
});

// ==================== CẤU HÌNH BOT ====================
const botOptions = {
  host: 'muitenvn.seedloaf.gg',
  port: 55386,
  username: 'AFK_Bot_247',
  version: '1.20.1'
};

let bot = null;
let afkLoopTimer = null;
let isReconnecting = false;
let lastPosition = null;
let stuckCount = 0;

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

  bot.on('spawn', () => {
    console.log('[Bot] Đã vào server! Khởi động hệ thống Anti-AFK thế hệ mới...');
    startAdvancedAFKEngine();
  });

  bot.on('death', () => {
    console.log('[Bot] Bị hạ gục, đang tự động hồi sinh...');
  });

  // Tự động ăn khi đói
  bot.on('health', () => {
    if (!bot || bot.food >= 15) return;
    const food = bot.inventory.items().find(i => 
      ['cooked_beef', 'cooked_porkchop', 'cooked_chicken', 'bread', 'apple', 'baked_potato', 'steak'].some(f => i.name.includes(f))
    );
    if (food) {
      bot.equip(food, 'hand')
        .then(() => bot.consume())
        .catch(() => {});
    }
  });

  // Tự động kết nối lại khi mất mạng / kicked
  const handleReconnect = (reason) => {
    if (isReconnecting) return;
    isReconnecting = true;
    if (afkLoopTimer) clearTimeout(afkLoopTimer);

    const delay = 10000 + Math.floor(Math.random() * 5000);
    console.log(`[${reason}] Mất kết nối. Thử đăng nhập lại sau ${Math.round(delay / 1000)}s...`);
    setTimeout(() => createBot(), delay);
  };

  bot.on('end', () => handleReconnect('End'));
  bot.on('kicked', (reason) => handleReconnect(`Kicked`));
  bot.on('error', (err) => handleReconnect(`Error: ${err.message}`));
}

// ==================== HỆ THỐNG ANTI-AFK THÔNG MINH (GIẢ LẬP NGƯỜI THẬT) ====================

// 1. Hàm quay đầu mượt mà (Tránh xoay giật cục bị plugin phát hiện)
function smoothLook(targetYaw, targetPitch, steps = 8) {
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
    const nextYaw = startYaw + (targetYaw - startYaw) * progress;
    const nextPitch = startPitch + (targetPitch - startPitch) * progress;

    bot.look(nextYaw, nextPitch, true);

    if (currentStep >= steps) clearInterval(interval);
  }, 40);
}

// 2. Lõi hành vi Anti-AFK đa dạng
function startAdvancedAFKEngine() {
  function afkRoutine() {
    if (!bot || !bot.entity) {
      afkLoopTimer = setTimeout(afkRoutine, 3000);
      return;
    }

    bot.clearControlStates();
    const p = bot.entity.position;

    // BẢO VỆ 1: Tránh rớt Void / Chưa load xong map
    if (p.y <= 0) {
      afkLoopTimer = setTimeout(afkRoutine, 4000);
      return;
    }

    // BẢO VỆ 2: Kiểm tra kẹt tường (Stuck Detection)
    if (lastPosition && p.distanceTo(lastPosition) < 0.2) {
      stuckCount++;
    } else {
      stuckCount = 0;
    }
    lastPosition = p.clone();

    // Nếu bị kẹt vào góc quá 3 lần -> Tự xoay 180 độ và nhảy ra ngoài
    if (stuckCount >= 3) {
      stuckCount = 0;
      const escapeYaw = bot.entity.yaw + Math.PI;
      smoothLook(escapeYaw, 0);
      bot.setControlState('jump', true);
      bot.setControlState('forward', true);
      setTimeout(() => {
        if (bot) bot.clearControlStates();
      }, 600);
      afkLoopTimer = setTimeout(afkRoutine, 2000);
      return;
    }

    // RANDOM HÀNH VI GIẢ LẬP NGƯỜI CHƠI THẬT (5 KỊCH BẢN)
    const actionType = Math.floor(Math.random() * 5);

    switch (actionType) {
      case 0: {
        // Kịch bản 0: Đứng quan sát xung quanh (Xoay đầu mượt + Nhìn người chơi gần đó)
        const nearbyPlayer = bot.nearestEntity(e => e.type === 'player' && e.username !== bot.username && e.position.distanceTo(bot.entity.position) < 10);
        if (nearbyPlayer) {
          const target = nearbyPlayer.position.offset(0, nearbyPlayer.height, 0);
          bot.lookAt(target, false);
        } else {
          const randomYaw = (Math.random() * 2 - 1) * Math.PI;
          const randomPitch = (Math.random() * 0.4 - 0.2);
          smoothLook(randomYaw, randomPitch);
        }
        if (Math.random() < 0.4) bot.swingArm('right');
        break;
      }

      case 1: {
        // Kịch bản 1: Đi dạo ngắn (Tiến/Lùi) kèm kiểm tra chướng ngại vật
        const randomDir = Math.random() < 0.7 ? 'forward' : 'back';
        bot.setControlState(randomDir, true);
        
        // Nếu có vật cản thấp 1 block -> Tự động nhảy qua
        if (Math.random() < 0.3) {
          bot.setControlState('jump', true);
          setTimeout(() => bot && bot.setControlState('jump', false), 350);
        }

        setTimeout(() => {
          if (bot) bot.clearControlStates();
        }, 600 + Math.random() * 800);
        break;
      }

      case 2: {
        // Kịch bản 2: Ngồi xổm (Sneak) kiểm tra góc nhìn (Giống đang xem kho/chat)
        bot.setControlState('sneak', true);
        const lookDownPitch = 0.5 + Math.random() * 0.3;
        smoothLook(bot.entity.yaw, lookDownPitch);

        setTimeout(() => {
          if (!bot) return;
          bot.setControlState('sneak', false);
          smoothLook(bot.entity.yaw, 0);
        }, 1200 + Math.random() * 1000);
        break;
      }

      case 3: {
        // Kịch bản 3: Đổi ô Hotbar + Vung tay (Giả lập sắp xếp túi đồ)
        const randomSlot = Math.floor(Math.random() * 9);
        bot.setQuickBarSlot(randomSlot);
        setTimeout(() => {
          if (bot) bot.swingArm('right');
        }, 300);
        break;
      }

      case 4: {
        // Kịch bản 4: Nhảy quay góc (Jump + Turn 90 độ)
        const newYaw = bot.entity.yaw + (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
        smoothLook(newYaw, 0);
        bot.setControlState('jump', true);
        setTimeout(() => {
          if (bot) bot.setControlState('jump', false);
        }, 400);
        break;
      }
    }

    // Thời gian nghỉ giữa các hành động ngẫu nhiên (từ 3.5s - 7s) để không tạo chu kỳ cố định
    const nextInterval = 3500 + Math.floor(Math.random() * 3500);
    afkLoopTimer = setTimeout(afkRoutine, nextInterval);
  }

  afkRoutine();
}

createBot();
