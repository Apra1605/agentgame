// ✅ main.js running with full live debug!
log("✅ main.js loaded");

const loginBtn = document.getElementById('loginBtn');

loginBtn.onclick = async () => {
  const usernameInput = document.getElementById('usernameInput').value.trim();
  const passwordInput = document.getElementById('passwordInput').value.trim();

  log(`🔑 Login clicked: Username=${usernameInput}`);

  if (!usernameInput || !passwordInput) {
    showError("Please enter both fields.");
    return;
  }

  try {
    const isSandboxed = window.location !== window.parent.location;
    log(`🔍 Sandbox check: ${isSandboxed ? "INSIDE Discord embed" : "Browser direct"}`);

    const dbPrefix = isSandboxed ? "/db" : "https://newagent-lfgn-default-rtdb.firebaseio.com";
    log(`🌐 Using DB Prefix: ${dbPrefix}`);

    log("📡 Fetching all users...");
    const res = await fetch(`${dbPrefix}/users.json`);
    const users = await res.json();
    log(`✅ Users fetched: ${JSON.stringify(users, null, 2)}`);

    let found = null;

    for (const userId in users) {
      const u = users[userId];
      log(`👀 Checking user ID ${userId}: ${JSON.stringify(u)}`);
      if (u.missions && u.missions.username && u.missions.password) {
        if (
          u.missions.username.toLowerCase() === usernameInput.toLowerCase() &&
          u.missions.password === passwordInput
        ) {
          found = { userId, ...u };
          log(`🎉 MATCH: User ID ${userId}`);
          break;
        }
      }
    }

    if (!found) {
      showError("❌ Invalid username or password.");
      return;
    }

    log(`✅ LOGIN SUCCESS: ${JSON.stringify(found, null, 2)}`);

    document.getElementById('login').style.display = 'none';

    const infoBox = document.getElementById('infoBox');
    infoBox.style.display = 'block';
    infoBox.innerText = `
      User: ${found.missions.username}
      XP: ${found.xp || 0}
      Balance: ${found.balance || 0}
      Level: ${found.level || 0}
    `.trim();

    startGame(found.userId, infoBox, found);

  } catch (err) {
    log(`🔥 ERROR: ${err}`);
    showError("Server error. Check debug box.");
  }
};

function showError(msg) {
  document.getElementById('loginError').innerText = msg;
  log(`🚫 Error shown: ${msg}`);
}

function log(msg) {
  console.log(msg);
  const debug = document.getElementById('debugBox');
  debug.textContent += `\n${msg}`;
  debug.scrollTop = debug.scrollHeight;
}

function startGame(userId, infoBox, userData) {
  log(`🚀 Starting Phaser game for user ${userId}...`);

  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'gameContainer',
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: { preload, create, update }
  };

  const game = new Phaser.Game(config);

  let player, cursors;

  function preload() {
    log(`🎮 Preloading assets...`);
    this.load.image('agent', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
  }

  function create() {
    log(`✅ Game created!`);
    player = this.physics.add.sprite(400, 300, 'agent');
    cursors = this.input.keyboard.createCursorKeys();

    const completeBtn = this.add.text(20, 20, '✅ Complete Mission', { fill: '#0f0' })
      .setInteractive()
      .on('pointerdown', async () => {
        log(`🗂️ Completing mission for user ${userId}`);

        const isSandboxed = window.location !== window.parent.location;
        const dbPrefix = isSandboxed ? "/db" : "https://newagent-lfgn-default-rtdb.firebaseio.com";

        const newXP = (userData.xp || 0) + 10;
        const newBalance = (userData.balance || 0) + 5;
        const newLevel = Math.floor(newXP / 100) + 1;

        userData.xp = newXP;
        userData.balance = newBalance;
        userData.level = newLevel;

        log(`🔄 Updating DB with: XP=${newXP}, Balance=${newBalance}, Level=${newLevel}`);

        await fetch(`${dbPrefix}/users/${userId}.json`, {
          method: "PATCH",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            xp: newXP,
            balance: newBalance,
            level: newLevel
          })
        });

        infoBox.innerText = `
          User: ${userData.missions.username}
          XP: ${newXP}
          Balance: ${newBalance}
          Level: ${newLevel}
        `.trim();

        log(`✅ Mission complete & DB updated!`);
      });

    document.getElementById('gameContainer').style.display = 'block';
  }

  function update() {
    player.setVelocity(0);
    if (cursors.left.isDown) player.setVelocityX(-160);
    else if (cursors.right.isDown) player.setVelocityX(160);
    if (cursors.up.isDown) player.setVelocityY(-160);
    else if (cursors.down.isDown) player.setVelocityY(160);
  }
}
