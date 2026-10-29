import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase 設定
const firebaseConfig = {
    apiKey: "AIzaSyA5_QR7dEjIx6RTghTqcB5jgCs6c-4nHQY",
    authDomain: "shottime-397a4.firebaseapp.com",
    projectId: "shottime-397a4",
    storageBucket: "shottime-397a4.firebasestorage.app",
    messagingSenderId: "543397406837",
    appId: "1:543397406837:web:79429dc37c8aad0014b03c",
    measurementId: "G-1KCTHMZ8KN"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 雲端 Firebase 方法
async function saveScoreToCloud(playerName, score) {
    try {
        await addDoc(collection(db, "leaderboard"), {
            name: playerName || "神秘酒客",
            score: Number(score),
            createdAt: serverTimestamp()
        });
        return true;
    } catch (e) {
        console.error("寫入 Firestore 失敗:", e);
        return false;
    }
}

async function fetchCloudLeaderboard() {
    try {
        const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(50));
        const querySnapshot = await getDocs(q);
        
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        const scores = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.createdAt && data.createdAt.toMillis) {
                const recordTime = data.createdAt.toMillis();
                if (recordTime >= oneWeekAgo) {
                    scores.push(data);
                }
            }
        });

        scores.sort((a, b) => b.score - a.score);
        return scores.slice(0, 10);

    } catch (e) {
        console.error("讀取 Firestore 失敗:", e);
        return null;
    }
}

// 遊戲狀態變數
let currentMode = ''; 
let targetClicks = 90; 
let clicks = 0; 
let isPlaying = false;
let isReadying = false;
let timerInterval = null;
let playerName = "神秘酒客";

// DOM 元素引用
const homeMenu = document.getElementById('home-menu');
const gameContainer = document.getElementById('game-container');
const timerDisplayEl = document.getElementById('timer-display');
const clicksDisplayEl = document.getElementById('clicks-display');
const clicksLabelEl = document.getElementById('clicks-label');
const beerLiquid = document.getElementById('beer-liquid');
const statusOverlay = document.getElementById('status-overlay');
const statusOverlayText = document.getElementById('status-overlay-text');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnNextMode = document.getElementById('btn-next-mode');

// Modal 顯隱操作
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}
function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

// 啟動模式流程
function startMode(mode) {
    currentMode = mode;

    if (mode === 'extreme') {
        openModal('nickname-modal');
        return;
    }

    if (mode === 'normal') targetClicks = 90;
    if (mode === 'hard') targetClicks = 120;

    initGameUI();
    startReadyCountdown();
}

function confirmStartExtreme() {
    const input = document.getElementById('player-nickname').value.trim();
    playerName = input || "神秘酒客";
    closeModal('nickname-modal');
    
    initGameUI();
    startReadyCountdown();
}

// 初始化遊戲畫面
function initGameUI() {
    homeMenu.classList.add('hidden');
    gameContainer.classList.remove('hidden');

    btnNextMode.classList.add('hidden');
    btnLeft.innerText = "終止挑戰";
    btnRight.innerText = "重新挑戰";

    if (currentMode === 'extreme') {
        clicksLabelEl.innerText = "SHOT 數";
        clicks = 0;
    } else {
        clicksLabelEl.innerText = "剩餘杯數";
        clicks = targetClicks;
    }

    timerDisplayEl.innerText = "15";
    updateClicksDisplay();
    beerLiquid.style.height = "100%";
}

// 倒數 Ready? -> 2 -> 1 -> GO!
function startReadyCountdown() {
    isReadying = true;
    isPlaying = false;
    statusOverlay.classList.remove('hidden');

    const seq = ["Ready?", "2", "1", "GO!"];
    let idx = 0;

    statusOverlayText.innerText = seq[idx];

    const readyTimer = setInterval(() => {
        idx++;
        if (idx < seq.length) {
            statusOverlayText.innerText = seq[idx];
        } else {
            clearInterval(readyTimer);
            statusOverlay.classList.add('hidden');
            isReadying = false;
            startGameTimer();
        }
    }, 600);
}

// 開啟 15 秒精準倒數計時器
function startGameTimer() {
    isPlaying = true;
    const startTime = Date.now();
    const duration = 15000;

    timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const left = Math.ceil((duration - elapsed) / 1000);

        if (left >= 0) {
            timerDisplayEl.innerText = left;
        }

        if (elapsed >= duration) {
            clearInterval(timerInterval);
            finishGame(false);
        }
    }, 100);
}

// 中央點擊感應區點擊 handler
function handleTapAreaClick(e) {
    if (!isPlaying || isReadying) return;

    createPopText(e);
    createRipple(e);

    if (currentMode === 'extreme') {
        clicks++;
        updateClicksDisplay();
    } else {
        if (clicks > 0) {
            clicks--;
            updateClicksDisplay();
            updateBeerLiquidLevel();

            if (clicks === 0) {
                clearInterval(timerInterval);
                finishGame(true);
            }
        }
    }
}

// 更新點擊數字
function updateClicksDisplay() {
    if (currentMode === 'extreme') {
        clicksDisplayEl.innerText = `${clicks} 杯`;
    } else {
        clicksDisplayEl.innerText = clicks;
    }
}

// 動態水位消退邏輯
function updateBeerLiquidLevel() {
    if (currentMode === 'extreme') return;

    if (clicks > 90) beerLiquid.style.height = "100%";
    else if (clicks > 80) beerLiquid.style.height = "80%";
    else if (clicks > 50) beerLiquid.style.height = "60%";
    else if (clicks > 30) beerLiquid.style.height = "40%";
    else if (clicks > 0) beerLiquid.style.height = "20%";
    else beerLiquid.style.height = "0%";
}

// 遊戲結算
async function finishGame(isSuccess) {
    isPlaying = false;

    if (currentMode === 'extreme') {
        statusOverlayText.innerText = "Time's up";
        statusOverlay.classList.remove('hidden');

        await saveScoreToCloud(playerName, clicks);

        setTimeout(() => {
            statusOverlay.classList.add('hidden');
            backToHome();
            openModal('leaderboard-modal');
            loadLeaderboardData();
        }, 1500);

    } else {
        if (isSuccess) {
            statusOverlayText.innerText = "挑戰成功！";
            statusOverlayText.style.fontFamily = "'Microsoft JhengHei', sans-serif";
            statusOverlayText.style.fontWeight = "bold";
            statusOverlay.classList.remove('hidden');

            setTimeout(() => {
                statusOverlay.classList.add('hidden');
                if (currentMode === 'normal') {
                    btnNextMode.innerText = "困難模式";
                    btnNextMode.classList.remove('hidden');
                } else if (currentMode === 'hard') {
                    btnNextMode.innerText = "返回首頁";
                    btnNextMode.classList.remove('hidden');
                }
            }, 1000);

        } else {
            statusOverlayText.innerText = "挑戰失敗！";
            statusOverlayText.style.fontFamily = "'Microsoft JhengHei', sans-serif";
            statusOverlayText.style.fontWeight = "bold";
            statusOverlay.classList.remove('hidden');

            btnLeft.innerText = "不玩了";
            btnRight.innerText = "再來一次";
        }
    }
}

// 底部左鈕操作
function handleLeftBtn() {
    clearInterval(timerInterval);
    backToHome();
}

// 底部右鈕操作
function handleRightBtn() {
    clearInterval(timerInterval);
    startMode(currentMode);
}

// 挑戰成功後的跨模式跳轉按鈕
function handleNextModeBtn() {
    clearInterval(timerInterval);
    if (currentMode === 'normal') {
        startMode('hard');
    } else {
        backToHome();
    }
}

// 返回首頁
function backToHome() {
    isPlaying = false;
    isReadying = false;
    clearInterval(timerInterval);

    gameContainer.classList.add('hidden');
    homeMenu.classList.remove('hidden');
    statusOverlay.classList.add('hidden');
}

// --- 特效生成函式 ---

function createPopText(e) {
    const pop = document.createElement('div');
    pop.className = 'click-pop pixel-font';
    pop.innerText = '+1';
    pop.style.left = `${e.clientX}px`;
    pop.style.top = `${e.clientY}px`;

    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 500);
}

function createRipple(e) {
    const circle = document.createElement('div');
    const diameter = 120;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - diameter / 2}px`;
    circle.style.top = `${e.clientY - diameter / 2}px`;
    circle.classList.add('ripple');

    document.body.appendChild(circle);
    setTimeout(() => circle.remove(), 400);
}

// --- 雲端排行榜 modal ---

async function loadLeaderboardData() {
    const listEl = document.getElementById('leaderboard-list');
    listEl.innerHTML = `
        <div class="text-center py-10 text-gray-400 text-sm">
            <i class="fa-solid fa-spinner animate-spin text-2xl text-pink-500 mb-2"></i><br>
            雲端資料載入中...
        </div>
    `;

    const data = await fetchCloudLeaderboard();
    if (data && data.length > 0) {
        listEl.innerHTML = "";
        data.forEach((item, index) => {
            let rankBadge = `<span class="w-6 text-center font-bold text-gray-400">${index + 1}</span>`;
            let rankBg = "bg-gray-900/50 border-white/5";
            let rankColor = "text-purple-400";

            if (index === 0) {
                rankBadge = `<i class="fa-solid fa-crown text-amber-400 text-base w-6 text-center"></i>`;
                rankBg = "bg-amber-500/10 border-amber-500/30";
                rankColor = "text-amber-400 font-black";
            } else if (index === 1) {
                rankBadge = `<i class="fa-solid fa-medal text-slate-300 text-base w-6 text-center"></i>`;
                rankBg = "bg-slate-500/10 border-slate-500/30";
                rankColor = "text-slate-300 font-bold";
            } else if (index === 2) {
                rankBadge = `<i class="fa-solid fa-award text-amber-700 text-base w-6 text-center"></i>`;
                rankBg = "bg-amber-900/10 border-amber-800/30";
                rankColor = "text-amber-600 font-bold";
            }

            const row = document.createElement('div');
            row.className = `flex justify-between items-center p-3 rounded-xl border ${rankBg}`;
            row.innerHTML = `
                <div class="flex items-center space-x-3">
                    ${rankBadge}
                    <span class="text-sm font-bold ${rankColor}">${escapeHtml(item.name)}</span>
                </div>
                <div class="pixel-font ${rankColor} text-sm">
                    ${item.score} <span class="text-[10px] text-gray-400 font-normal">SHOTS</span>
                </div>
            `;
            listEl.appendChild(row);
        });
    } else {
        listEl.innerHTML = `<div class="text-center py-10 text-gray-400 text-sm">本週尚無挑戰紀錄</div>`;
    }
}

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 事件綁定
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-open-info').addEventListener('click', (e) => { e.stopPropagation(); openModal('info-modal'); });
    document.getElementById('btn-open-leaderboard').addEventListener('click', (e) => { 
        e.stopPropagation(); 
        openModal('leaderboard-modal'); 
        loadLeaderboardData();
    });

    document.getElementById('btn-close-info').addEventListener('click', () => closeModal('info-modal'));
    document.getElementById('btn-close-info-bottom').addEventListener('click', () => closeModal('info-modal'));
    document.getElementById('btn-close-leaderboard').addEventListener('click', () => closeModal('leaderboard-modal'));

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            startMode(btn.getAttribute('data-mode'));
        });
    });

    document.getElementById('tap-target-area').addEventListener('click', handleTapAreaClick);

    document.getElementById('btn-left').addEventListener('click', (e) => { e.stopPropagation(); handleLeftBtn(); });
    document.getElementById('btn-right').addEventListener('click', (e) => { e.stopPropagation(); handleRightBtn(); });
    document.getElementById('btn-next-mode').addEventListener('click', (e) => { e.stopPropagation(); handleNextModeBtn(); });

    document.getElementById('btn-cancel-nickname').addEventListener('click', () => closeModal('nickname-modal'));
    document.getElementById('btn-confirm-nickname').addEventListener('click', confirmStartExtreme);

    document.getElementById('btn-refresh-leaderboard').addEventListener('click', loadLeaderboardData);
});