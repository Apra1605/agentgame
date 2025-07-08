console.log("✅ main.js running");

const loginBtn = document.getElementById('loginBtn');

loginBtn.onclick = async () => {
  const username = document.getElementById('usernameInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();

  console.log("🔑 Logging in with:", username);

  if (!username || !password) {
    showError("Please enter both fields.");
    return;
  }

  try {
    const res = await fetch("https://agent-discord-4667e1c402f3.herokuapp.com/", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      showError("Invalid username or password.");
      return;
    }

    const data = await res.json();
    console.log("✅ Login success:", data);

    document.getElementById('login').style.display = 'none';
    const infoBox = document.getElementById('infoBox');
    infoBox.style.display = 'block';
    infoBox.innerText = `User: ${data.username}\nXP: ${data.xp}\nBalance: ${data.balance}\nLevel: ${data.level}`;

    startGame(data.userId, infoBox, data);
  } catch (err) {
    console.error(err);
    showError("Server error.");
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
        const res = await fetch("https://YOUR-BOT-HOST/api/complete", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });

        const updated = await res.json();
        userData.xp = updated.xp;
        userData.balance = updated.balance;
        userData.level = updated.level;

        infoBox.innerText = `User: ${userData.username}\nXP: ${userData.xp}\nBalance: ${userData.balance}\nLevel: ${userData.level}`;
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
