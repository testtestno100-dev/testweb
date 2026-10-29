import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
// 引入 Realtime Database 必要的函數
import { getDatabase, ref, push, onChildAdded, query, orderByChild, startAt } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAIjpJCL-TYI4paKnQM797TuNPXBYagFj4",
  authDomain: "webchatting-af4a4.firebaseapp.com",
  databaseURL: "https://webchatting-af4a4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "webchatting-af4a4",
  storageBucket: "webchatting-af4a4.firebasestorage.app",
  messagingSenderId: "925676549978",
  appId: "1:925676549978:web:7ad31c783942340561e563",
  measurementId: "G-LWYCF3H9NN"
};

// 初始化 Firebase 與 Database
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messagesRef = ref(db, 'messages');

let mywordsid = localStorage.getItem('mywordsid');
if (!mywordsid) {
    mywordsid = 'mywords-' + Date.now();
    localStorage.setItem('mywordsid', mywordsid);
}



const 聊天室 = document.querySelector('.chat-body');
const 我輸入的 = document.querySelector('.remywords');
const 送出 = document.querySelector('.sendbutton');

function 發言() {
  const text = 我輸入的.value.trim();
    if (text === "") {
        return;
    }
    
    push(ref(db, 'messages'), {
        senderId: mywordsid,
        username: "匿名",
        text: text,
        timestamp: Date.now()
    });
  }

我輸入的.addEventListener('keyup', function(a){
  if (a.key === 'Enter') {
    發言();
  }
});

const now = new Date();
const cutoffTime = new Date(); // 4:00 AM today
cutoffTime.setHours(4, 0, 0, 0);
const startOfDayTimestamp = cutoffTime.getTime();

if (now.getTime() < startOfDayTimestamp) {
    // 如果現在時間早於今天的 4:00 AM，則將日期設為昨天
    cutoffTime.setDate(cutoffTime.getDate() - 1);
}

const todatyQuery = query(messagesRef, orderByChild('timestamp'), startAt(cutoffTime.getTime()));

onChildAdded(todatyQuery, (snapshot) => {
    const message = snapshot.val();

    const isme = message.senderId === mywordsid;

    const 新的發言 = document.createElement('div');
    新的發言.classList.add(isme ? 'mywords' : 'otherwords');
      新的發言.innerHTML = `
        <div class="talking">
          <div class="bubble">${message.text}</div>
        </div>
      `;

    聊天室.appendChild(新的發言);
    我輸入的.value = '';
    聊天室.scrollTop = 聊天室.scrollHeight;
});

送出.addEventListener('click', 發言);

const 漢堡選單 = document.querySelector('.menu');
const 導覽選項 = document.querySelector('.items');
const 關閉按鈕 = document.querySelector('.remove');
const 選項連結 = document.querySelectorAll('.items li a');

漢堡選單.addEventListener('click', function() {
  導覽選項.classList.toggle('show');
});

關閉按鈕.addEventListener('click', function() {
  導覽選項.classList.remove('show');
});

選項連結.forEach(function(連結) {
  連結.addEventListener('click', function() {
    導覽選項.classList.remove('show');
  });
});

// 動畫

document.addEventListener("DOMContentLoaded", function() {
  // 建立一個觀察者
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      // 如果元素進入了使用者的可視範圍
      if (entry.isIntersecting) {
        entry.target.classList.add('active'); // 加上 active 類別觸發動畫
        
        // 選擇性：如果希望每次滑到都重新播放，就不要加下面這行；
        // 如果希望動畫「只觸發一次」就好，可以取消下面這行的註解：
        // observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1 // 代表當元素露出 10% 時就會觸發動畫
  });

  // 抓出所有需要被偵測動畫的元素
  const fadeElements = document.querySelectorAll('.animate-fade-in-up');
  fadeElements.forEach(element => {
    observer.observe(element);
  });
});

// 打開指定的 Modal 視窗
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden'); // 移除 hidden，顯示視窗
    }
}

// 關閉指定的 Modal 視窗
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden'); // 加上 hidden，隱藏視窗
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-open-info').addEventListener('click', (e) => { e.stopPropagation(); openModal('info-modal'); });

    document.getElementById('btn-close-info').addEventListener('click', () => closeModal('info-modal'));
    document.getElementById('btn-close-info-bottom').addEventListener('click', () => closeModal('info-modal'));
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            startMode(btn.getAttribute('data-mode'));
        });
    });
});

// 說明文字

document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.image-container');
  const model = document.getElementById('talkingmodel');
  const modelImg = document.getElementById('modelIMG');
  const modelTitle = document.getElementById('modeltitle');
  const modelDesc = document.getElementById('modelDesc');
  const modelClose = document.getElementById('modelClose');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      // 暫時拿掉 width 限制，直接彈出看反應
      const img = card.querySelector('img');
      const title = card.getAttribute('data-title') || '';
      const desc = card.getAttribute('data-desc') || card.querySelector('p')?.textContent || '';

      if (img && modelImg) {
        modelImg.src = img.src;
        modelImg.alt = img.alt;
      }
      if (modelTitle) modelTitle.textContent = title;
      if (modelDesc) modelDesc.innerHTML = desc;

      if (model) {
        model.classList.add('active');
        console.log('彈窗應該要打開了！'); // 可以看 F12 Console 有沒有印出這行
      }
    });
  });

  if (modelClose) {
    modelClose.addEventListener('click', () => {
      if (model) model.classList.remove('active');
    });
  }

  if (model) {
    model.addEventListener('click', (e) => {
      if (e.target === model) {
        model.classList.remove('active');
      }
    });
  }
});