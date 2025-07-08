console.log("✅ main.js running");

const loginBtn = document.getElementById('loginBtn');

loginBtn.onclick = async () => {
  const usernameInput = document.getElementById('usernameInput').value.trim();
  const passwordInput = document.getElementById('passwordInput').value.trim();

  console.log("🔑 Logging in with:", usernameInput);

  if (!usernameInput || !passwordInput) {
    showError("Please enter both fields.");
    return;
  }

  try {
    // Detect sandbox: Discord embed = window !== parent
    const isSandboxed = window.location !== window.parent.location;
    const dbPrefix = isSandboxed ? "/db" : "https://newagent-lfgn-default-rtdb.firebaseio.com";

    console.log("🌐 Using DB Prefix:", dbPrefix);

    // Pull all users
    const res = await fetch(`${dbPrefix}/users.json`);
    const users = await res.json();

    let found = null;

    for (const userId in users) {
      const u = users[userId];
      if (u.missions && u.missions.username && u.missions.password) {
        if (
          u.missions.username.toLowerCase() === usernameInput.toLowerCase() &&
          u.missions.password === passwordInput
        ) {
          found = { userId, ...u };
          break;
        }
      }
    }

    if (!found) {
      showError("Invalid username or password.");
      return;
    }

    console.log("✅ Login success:", found);

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
    console.error(err);
    showError("Server error. Check console.");
  }
};

function showError(msg) {
  document.getElementById('loginError').innerText = msg;
}

function startGame(userId, infoBox, userData) {
  console.log("✅ Starting Phaser...");

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
    this.load.image('agent', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
  }

  function create() {
    player = this.physics.add.sprite(400, 300, 'agent');
    cursors = this.input.keyboard.createCursorKeys();

    const completeBtn = this.add.text(20, 20, '✅ Complete Mission', { fill: '#0f0' })
      .setInteractive()
      .on('pointerdown', async () => {
        const isSandboxed = window.location !== window.parent.location;
        const dbPrefix = isSandboxed ? "/db" : "https://newagent-lfgn-default-rtdb.firebaseio.com";

        const newXP = (userData.xp || 0) + 10;
        const newBalance = (userData.balance || 0) + 5;
        const newLevel = Math.floor(newXP / 100) + 1;

        userData.xp = newXP;
        userData.balance = newBalance;
        userData.level = newLevel;

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
