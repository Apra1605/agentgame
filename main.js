console.log("✅ main.js is running");

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDmnk1IjJQQc9ksYluffJ_o0i4U_DSlTQ4",
  authDomain: "newagent-lfgn.firebaseapp.com",
  databaseURL: "https://newagent-lfgn-default-rtdb.firebaseio.com",
  projectId: "newagent-lfgn",
  storageBucket: "newagent-lfgn.appspot.com",
  messagingSenderId: "363511493070",
  appId: "1:363511493070:web:81f113614b622963f0fb9f"
};

// ✅ Init Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, get, update, child } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const loginBtn = document.getElementById('loginBtn');

if (loginBtn) {
  loginBtn.onclick = async () => {
    const username = document.getElementById('usernameInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();

    console.log("✅ Attempting login for:", username);

    if (!username || !password) {
      showError("Please enter both username and password.");
      return;
    }

    try {
      const snapshot = await get(ref(db, 'users/'));
      if (snapshot.exists()) {
        const users = snapshot.val();
        let found = false;

        for (const userId in users) {
          const user = users[userId];
          if (user.username === username && user.password === password) {
            console.log(`✅ Login success for userId: ${userId}`);
            found = true;
            document.getElementById('login').style.display = 'none';
            const infoBox = document.getElementById('infoBox');
            infoBox.innerText = `Logged in as: ${username}\nXP: ${user.xp}\nBalance: ${user.balance}\nLevel: ${user.level}`;
            infoBox.style.display = 'block';
            startGame(userId, infoBox, user);
            break;
          }
        }

        if (!found) {
          showError("Invalid username or password.");
        }
      } else {
        showError("No users found in database.");
      }
    } catch (err) {
      console.error(err);
      showError("Error while logging in.");
    }
  };
}

function showError(msg) {
  document.getElementById('loginError').innerText = msg;
}

function startGame(userId, infoBox, userData) {
  console.log("✅ Starting Phaser game...");

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
        const userRef = ref(db, `users/${userId}`);
        const newXP = userData.xp + 10;
        const newBalance = userData.balance + 5;
        const newLevel = Math.floor(newXP / 100) + 1;

        userData.xp = newXP;
        userData.balance = newBalance;
        userData.level = newLevel;

        await update(userRef, {
          xp: newXP,
          balance: newBalance,
          level: newLevel
        });

        infoBox.innerText = `Logged in as: ${userData.username}\nXP: ${newXP}\nBalance: ${newBalance}\nLevel: ${newLevel}`;

        console.log("✅ Mission complete — Firebase updated!");
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
