document.getElementById('submitBtn').onclick = async () => {
  const username = document.getElementById('usernameInput').value.trim();
  if (!username) {
    alert('Please enter your Discord username.');
    return;
  }

  // Resolve Discord ID
  const res = await fetch(`https://YOUR-BOT-APP.herokuapp.com/api/resolveUser?username=${encodeURIComponent(username)}`);
  if (!res.ok) {
    alert('Could not find that username in Discord.');
    return;
  }

  const { id: userId } = await res.json();
  console.log('Resolved Discord ID:', userId);

  // Get or create user data
  const checkRes = await fetch(`https://YOUR-BOT-APP.herokuapp.com/api/getOrCreateUser?userId=${userId}`);
  const userData = await checkRes.json();
  console.log('User Data:', userData);

  // Show user info
  const infoBox = document.getElementById('infoBox');
  infoBox.innerText = `BALANCE: ${userData.balance}\nLEVEL: ${userData.level}\nXP: ${userData.xp}`;
  infoBox.style.display = 'block';

  // Hide form, show game
  document.getElementById('usernameForm').style.display = 'none';
  document.getElementById('gameContainer').style.display = 'block';

  startGame(userId, infoBox);
};

function startGame(userId, infoBox) {
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
        const res = await fetch('https://YOUR-BOT-APP.herokuapp.com/api/updateXP', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, xp: 10, balance: 5 })
        });
        const updated = await res.json();

        // Update infoBox
        infoBox.innerText = `BALANCE: ${updated.balance}\nLEVEL: ${updated.level}\nXP: ${updated.xp}`;
      });
  }

  function update() {
    player.setVelocity(0);
    if (cursors.left.isDown) player.setVelocityX(-160);
    else if (cursors.right.isDown) player.setVelocityX(160);
    if (cursors.up.isDown) player.setVelocityY(-160);
    else if (cursors.down.isDown) player.setVelocityY(160);
  }
}
