// ✅ Your Discord App details:
const CLIENT_ID = '1389447739737378886';
const REDIRECT_URI = 'https://apra1605.github.io/agentgame/';
const SCOPES = ['identify'];

// ✅ Your Firebase config:
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
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.getElementById('loginBtn').onclick = () => {
  const oauthURL = `https://discord.com/api/oauth2/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=token` +
    `&scope=${SCOPES.join('%20')}`;
  window.location.href = oauthURL;
};

window.onload = async () => {
  const hash = window.location.hash;
  if (hash.includes('access_token')) {
    const params = new URLSearchParams(hash.substr(1));
    const accessToken = params.get('access_token');

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const user = await userRes.json();
    const userId = user.id;
    const username = `${user.username}`;

    console.log('Logged in:', userId, username);

    // Hide login, show game UI
    document.getElementById('login').style.display = 'none';

    const infoBox = document.getElementById('infoBox');
    infoBox.innerText = `Logged in as: ${username}\nID: ${userId}`;
    infoBox.style.display = 'block';

    // Check or create user in Firebase
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    let userData;

    if (snapshot.exists()) {
      userData = snapshot.val();
    } else {
      userData = { xp: 0, balance: 0, level: 1 };
      await set(userRef, userData);
    }

    infoBox.innerText = `User: ${username}\nXP: ${userData.xp}\nBalance: ${userData.balance}\nLevel: ${userData.level}`;

    startGame(userId, infoBox, userData);
  }
};

function startGame(userId, infoBox, userData) {
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

        infoBox.innerText = `User: ${userId}\nXP: ${newXP}\nBalance: ${newBalance}\nLevel: ${newLevel}`;
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
