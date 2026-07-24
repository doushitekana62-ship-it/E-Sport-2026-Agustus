// ============================================================
//  TOURNAMENT MANAGEMENT SYSTEM - FULL LOGIC
//  Author: Tournament Admin
//  Version: 1.0
// ============================================================

// ============================================================
//  ADMIN CREDENTIALS (HARDCODE - BISA DIUBAH)
// ============================================================
const ADMIN = {
    username: 'admin',
    password: 'rahasia123'
};

// ============================================================
//  DATA TOURNAMENT
// ============================================================
const TOURNAMENT_DATA = {
    mlbb: {
        name: 'MLBB',
        icon: 'fa-crosshairs',
        groups: {
            'A': ['Bene', 'Naqash', 'Tama Ardi ENG', 'Yasha WS', 'Gibran Sifu'],
            'B': ['Daniel L', 'Faisal Hakim', 'Ade Lukman', 'Ujang Jaelani WS', 'Ade Project'],
            'C': ['Riki NZoom', 'Andri', 'Nabil', 'Nicholas', 'Agus Eng'],
            'D': ['Gilang', 'Adzwar', 'Barend', 'Pace', 'Jaenal'],
            'E': ['Sikwan', 'Asher', 'Novan', 'Bintang WS', 'Joshua'],
            'F': ['Aziz Prj', 'Tegar', 'Moses', 'Zakariya Efendi', 'Hizkia Derren'],
            'G': ['Ade R Eng', 'Dwi WS', 'Aldika', 'Yona', 'Ikhsan']
        },
        matches: [], // { group, player1, player2, score1, score2, played }
        standings: {}, // { player: { points, wins, draws, losses, matches } }
        finalists: [], // 2 pemain dengan poin tertinggi
        finalMatches: [], // BO5 matches
        champion: null
    },
    ctr: {
        name: 'CTR',
        icon: 'fa-car',
        groups: {
            'A': ['Nicolas Kurnia Pancipta', 'Ade Rizkon Gunawan', 'Barend', 'Pace'],
            'B': ['Dimas Pamungkas', 'Asher Xavierius Mokalu', 'Adzwar Muhamad Fadhilah', 'Zakariaya Efendi'],
            'C': ['Daniel L.A.U', 'Bertus', 'Nuriyah', 'Gibran Putra Yulerny'],
            'D': ['Naqash Wiyar Jatmiko', 'Ikhsan fadilah', 'Pak Sidik', 'Tegar Wahyu'],
            'E': ['SLAMET MUJIANTO', 'Yona Salnupansen', 'Faishal Hakim Ardika', 'Esthu (juara bertahan)'],
            'F': ['Gregorius Yoga', 'Bennedictus Dimas Aditia', 'Arif electric', 'Novan Sukma Aji'],
            'G': ['Jaenal', 'Paul', 'Arif Project', 'Bayu wahyu pribadi'],
            'H': ['sikwan', 'Joshua']
        },
        matches: [],
        standings: {},
        knockout: {
            round16: [],
            round8: [],
            round4: [],
            final: null
        },
        champion: null
    },
    pes: {
        name: 'PES/FC',
        icon: 'fa-futbol',
        teams: {
            'A': { players: ['Gibran Putra Yulerry', 'Paul'], status: 'active' },
            'B': { players: ['Esthu (juara bertahan)', 'Arif Project'], status: 'active' },
            'C': { players: ['Yona Salnupansen', 'Moses'], status: 'active' },
            'D': { players: ['Naqash Wiyar Jatmiko', 'Nala Adonis'], status: 'active' },
            'E': { players: ['Tegar Wahyu', 'Harun'], status: 'active' },
            'F': { players: ['Asher Xavierius Mokalu', 'Ikhsan fadilah'], status: 'active' },
            'G': { players: ['Arif electric', 'Andri'], status: 'active' },
            'H': { players: ['Novan Sukma Aji', 'Pace'], status: 'active' },
            'I': { players: ['Faishal Hakim Ardika', 'Bayu wahyu pribadi'], status: 'active' },
            'J': { players: ['Daniel L.A.U', 'Hizkia Darren A.P.'], status: 'active' },
            'K': { players: ['SLAMET MUJIANTO', 'sikwan'], status: 'active' },
            'L': { players: ['Adzwar Muhamad Fadhilah', 'Nicolas Kurnia Pancipita'], status: 'active' },
            'M': { players: ['Joshua', 'Dimas Pamungkas'], status: 'active' },
            'N': { players: ['Bertus', 'Pratama Gilang Buana'], status: 'active' }
        },
        bracket: {
            round1: [], // 7 matches
            round2: [], // 4 matches (termasuk BYE)
            round3: [], // 2 matches
            final: null // 1 match
        },
        champion: null,
        byeTeam: 'B' // Esthu sebagai juara bertahan
    }
};

// ============================================================
//  STATE MANAGEMENT
// ============================================================
let currentGame = 'mlbb';
let isLoggedIn = false;
let data = {};

// ============================================================
//  LOCAL STORAGE
// ============================================================
function loadData() {
    const saved = localStorage.getItem('tournamentData');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Merge with default structure
            data = deepMerge(TOURNAMENT_DATA, parsed);
            return true;
        } catch (e) {
            console.warn('Gagal load data, menggunakan default');
        }
    }
    data = JSON.parse(JSON.stringify(TOURNAMENT_DATA));
    return false;
}

function saveData() {
    localStorage.setItem('tournamentData', JSON.stringify(data));
}

function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                result[key] = deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
    }
    return result;
}

function resetData() {
    if (confirm('⚠️ Reset semua data tournament? Ini akan menghapus semua skor!')) {
        data = JSON.parse(JSON.stringify(TOURNAMENT_DATA));
        saveData();
        renderCurrentGame();
        alert('✅ Data berhasil direset!');
    }
}

// ============================================================
//  AUTHENTICATION
// ============================================================
function login() {
    const username = document.getElementById('usernameInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();
    const errorEl = document.getElementById('loginError');

    if (username === ADMIN.username && password === ADMIN.password) {
        isLoggedIn = true;
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        errorEl.textContent = '';
        loadData();
        renderAll();
        showNotification('✅ Selamat datang, Admin!', 'success');
    } else {
        errorEl.textContent = '❌ Username atau password salah!';
        errorEl.style.color = '#ff4d94';
    }
}

function logout() {
    if (confirm('Yakin ingin logout?')) {
        isLoggedIn = false;
        document.getElementById('loginModal').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('usernameInput').value = '';
        document.getElementById('passwordInput').value = '';
        document.getElementById('loginError').textContent = '';
    }
}

// ============================================================
//  NOTIFICATION
// ============================================================
function showNotification(msg, type = 'info') {
    const colors = {
        success: '#39ff14',
        error: '#ff4d94',
        info: '#4dc9ff'
    };
    const div = document.createElement('div');
    div.style.cssText = `
        position: fixed; top: 20px; right: 20px; 
        background: #12122a; border: 2px solid ${colors[type]}; 
        color: white; padding: 15px 25px; border-radius: 12px;
        box-shadow: 0 0 30px rgba(0,0,0,0.5);
        z-index: 99999;
        font-weight: 500;
        animation: fadeIn 0.3s ease;
        max-width: 90%;
    `;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transition = 'opacity 0.5s';
        setTimeout(() => div.remove(), 500);
    }, 3000);
}

// ============================================================
//  RENDER ENGINE
// ============================================================
function renderAll() {
    renderGameNav();
    renderCurrentGame();
}

function renderGameNav() {
    const buttons = document.querySelectorAll('.game-btn');
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.game === currentGame);
    });
}

function renderCurrentGame() {
    const area = document.getElementById('contentArea');
    const gameData = data[currentGame];

    if (!gameData) {
        area.innerHTML = '<p style="color:red;">Data game tidak ditemukan!</p>';
        return;
    }

    let html = '';

    // ========== MLBB ==========
    if (currentGame === 'mlbb') {
        html += renderMLBB(gameData);
    }

    // ========== CTR ==========
    if (currentGame === 'ctr') {
        html += renderCTR(gameData);
    }

    // ========== PES ==========
    if (currentGame === 'pes') {
        html += renderPES(gameData);
    }

    area.innerHTML = html;
}

// ============================================================
//  MLBB RENDER
// ============================================================
function renderMLBB(gameData) {
    // Init standings jika kosong
    if (Object.keys(gameData.standings).length === 0) {
        initStandings('mlbb');
    }

    let html = `
        <div class="section-title">
            <i class="fas fa-crosshairs"></i>
            <span>MLBB - Fase Grup</span>
            <button onclick="resetData()" style="margin-left:auto;background:rgba(255,77,148,0.2);border:1px solid #ff4d94;color:#ff4d94;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:12px;">
                <i class="fas fa-redo"></i> Reset
            </button>
        </div>
        <div class="group-container">
    `;

    // Render group standings
    const groupKeys = Object.keys(gameData.groups);
    groupKeys.forEach(group => {
        const players = gameData.groups[group];
        const standings = getGroupStandings('mlbb', group);

        html += `
            <div class="group-card">
                <h4><i class="fas fa-users"></i> Group ${group}</h4>
                <table class="standings-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Pemain</th>
                            <th style="text-align:center">M</th>
                            <th style="text-align:center">P</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Sort by points
        const sorted = [...standings].sort((a, b) => b.points - a.points || a.wins - b.wins);
        sorted.forEach((p, idx) => {
            const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : '';
            const topClass = idx < 2 ? 'rank-top' : '';
            html += `
                <tr class="${topClass}">
                    <td class="rank ${rankClass}">${idx + 1}</td>
                    <td class="player-name">${p.player}</td>
                    <td style="text-align:center">${p.matches || 0}</td>
                    <td class="points">${p.points || 0}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
                <div style="margin-top:10px;font-size:11px;color:var(--text-secondary);">
                    <i class="fas fa-info-circle"></i> 
                    ${players.length} pemain • Top 2 ke Final
                </div>
            </div>
        `;
    });

    html += `</div>`;

    // ===== Final Section =====
    const finalists = getMLBBFinalists();
    html += `
        <div class="section-title" style="margin-top:30px;">
            <i class="fas fa-trophy" style="color:var(--neon-yellow);"></i>
            <span>FINAL BO5</span>
        </div>
    `;

    if (finalists.length === 2) {
        html += `
            <div class="bracket-container">
                <div class="bracket-title">🏆 GRAND FINAL - BEST OF 5</div>
                <div style="display:flex;justify-content:center;gap:30px;flex-wrap:wrap;padding:20px;">
                    <div style="text-align:center;padding:20px 30px;background:var(--bg-primary);border-radius:16px;border:2px solid var(--neon-purple);">
                        <div style="font-size:14px;color:var(--text-secondary);">Finalis 1</div>
                        <div style="font-size:24px;font-weight:bold;color:var(--neon-blue);">${finalists[0]}</div>
                    </div>
                    <div style="display:flex;align-items:center;font-size:30px;color:var(--neon-yellow);">
                        <i class="fas fa-vs"></i>
                    </div>
                    <div style="text-align:center;padding:20px 30px;background:var(--bg-primary);border-radius:16px;border:2px solid var(--neon-pink);">
                        <div style="font-size:14px;color:var(--text-secondary);">Finalis 2</div>
                        <div style="font-size:24px;font-weight:bold;color:var(--neon-pink);">${finalists[1]}</div>
                    </div>
                </div>
                <div id="mlbbFinalMatches" style="margin-top:20px;">
                    ${renderMLBBFinalMatches()}
                </div>
                ${gameData.champion ? `
                    <div class="final-banner">
                        <i class="fas fa-crown"></i>
                        <h2>🏆 CHAMPION!</h2>
                        <div class="champion-name">${gameData.champion}</div>
                    </div>
                ` : ''}
            </div>
        `;
    } else {
        html += `
            <div class="bracket-container" style="text-align:center;padding:30px;color:var(--text-secondary);">
                <i class="fas fa-hourglass-half" style="font-size:36px;color:var(--neon-purple);display:block;margin-bottom:10px;"></i>
                Menunggu hasil grup untuk menentukan 2 finalis...
                <div style="font-size:12px;margin-top:8px;">Klik pertandingan di grup untuk input skor</div>
            </div>
        `;
    }

    return html;
}

function initStandings(game) {
    const gameData = data[game];
    const groups = gameData.groups;

    Object.keys(groups).forEach(group => {
        groups[group].forEach(player => {
            if (!gameData.standings[player]) {
                gameData.standings[player] = { player, points: 0, wins: 0, draws: 0, losses: 0, matches: 0 };
            }
        });
    });

    // Generate matches if empty
    if (gameData.matches.length === 0) {
        generateMatches(game);
    }

    saveData();
}

function generateMatches(game) {
    const gameData = data[game];
    const groups = gameData.groups;
    const matches = [];

    Object.keys(groups).forEach(group => {
        const players = groups[group];
        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                matches.push({
                    group: group,
                    player1: players[i],
                    player2: players[j],
                    score1: null,
                    score2: null,
                    played: false
                });
            }
        }
    });

    gameData.matches = matches;
    saveData();
}

function getGroupStandings(game, group) {
    const gameData = data[game];
    const players = gameData.groups[group] || [];
    const result = [];

    players.forEach(player => {
        const s = gameData.standings[player] || { player, points: 0, wins: 0, draws: 0, losses: 0, matches: 0 };
        result.push({ ...s });
    });

    return result;
}

function getMLBBFinalists() {
    const gameData = data.mlbb;
    const standings = gameData.standings;
    const sorted = Object.values(standings).sort((a, b) => b.points - a.points || a.wins - b.wins);
    return sorted.slice(0, 2).map(s => s.player);
}

function renderMLBBFinalMatches() {
    const gameData = data.mlbb;
    let html = '';

    if (gameData.finalMatches.length === 0) {
        // Generate BO5 matches
        const finalists = getMLBBFinalists();
        if (finalists.length === 2) {
            for (let i = 1; i <= 5; i++) {
                gameData.finalMatches.push({
                    match: i,
                    player1: finalists[0],
                    player2: finalists[1],
                    score1: null,
                    score2: null,
                    played: false
                });
            }
            saveData();
        }
    }

    const finalMatches = gameData.finalMatches;
    if (finalMatches.length === 0) return '<p style="text-align:center;color:var(--text-secondary);">Belum ada pertandingan final</p>';

    let wins1 = 0,
        wins2 = 0;
    finalMatches.forEach(m => {
        if (m.played) {
            if (m.score1 > m.score2) wins1++;
            else if (m.score2 > m.score1) wins2++;
        }
    });

    const isFinished = wins1 >= 3 || wins2 >= 3;

    html += `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">
    `;

    finalMatches.forEach((m, idx) => {
        const isPlayed = m.played;
        const winner = isPlayed ? (m.score1 > m.score2 ? m.player1 : m.score2 > m.score1 ? m.player2 : null) : null;
        const isWinnerMatch = winner ? true : false;

        html += `
            <div class="bracket-match" onclick="openMatchModal('mlbb', 'final', ${idx})" style="${isWinnerMatch ? 'border-color:var(--neon-green);' : ''}">
                <div class="match-players">
                    <div class="player-entry ${isPlayed && m.score1 > m.score2 ? 'winner' : ''}">
                        <span>${m.player1}</span>
                        <span class="score">${isPlayed ? m.score1 : '-'}</span>
                    </div>
                    <div class="player-entry ${isPlayed && m.score2 > m.score1 ? 'winner' : ''}">
                        <span>${m.player2}</span>
                        <span class="score">${isPlayed ? m.score2 : '-'}</span>
                    </div>
                </div>
                <div class="match-status ${isPlayed ? 'played' : ''}">
                    ${isPlayed ? `Match ${idx+1} ✓` : `Match ${idx+1} ⏳`}
                    ${isPlayed && winner ? ` 🏆 ${winner}` : ''}
                </div>
            </div>
        `;
    });

    html += `</div>`;

    if (isFinished) {
        const champion = wins1 >= 3 ? finalMatches[0].player1 : finalMatches[0].player2;
        data.mlbb.champion = champion;
        saveData();
        html += `
            <div class="final-banner" style="margin-top:20px;">
                <i class="fas fa-crown"></i>
                <h2>🏆 CHAMPION!</h2>
                <div class="champion-name">${champion}</div>
                <div style="font-size:14px;color:var(--text-secondary);margin-top:8px;">
                    BO5: ${wins1} - ${wins2}
                </div>
            </div>
        `;
    }

    return html;
}

// ============================================================
//  CTR RENDER (Simplified - similar to MLBB)
// ============================================================
function renderCTR(gameData) {
    if (Object.keys(gameData.standings).length === 0) {
        initStandings('ctr');
    }

    let html = `
        <div class="section-title">
            <i class="fas fa-car"></i>
            <span>CTR - Fase Grup (Top 2 Lolos)</span>
            <button onclick="resetData()" style="margin-left:auto;background:rgba(255,77,148,0.2);border:1px solid #ff4d94;color:#ff4d94;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:12px;">
                <i class="fas fa-redo"></i> Reset
            </button>
        </div>
        <div class="group-container">
    `;

    const groupKeys = Object.keys(gameData.groups);
    groupKeys.forEach(group => {
        const standings = getGroupStandings('ctr', group);
        const sorted = [...standings].sort((a, b) => b.points - a.points || a.wins - b.wins);

        html += `
            <div class="group-card">
                <h4><i class="fas fa-users"></i> Group ${group}</h4>
                <table class="standings-table">
                    <thead>
                        <tr><th>#</th><th>Pemain</th><th style="text-align:center">M</th><th style="text-align:center">P</th></tr>
                    </thead>
                    <tbody>
        `;

        sorted.forEach((p, idx) => {
            const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : '';
            const topClass = idx < 2 ? 'rank-top' : '';
            html += `
                <tr class="${topClass}">
                    <td class="rank ${rankClass}">${idx + 1}</td>
                    <td class="player-name">${p.player}</td>
                    <td style="text-align:center">${p.matches || 0}</td>
                    <td class="points">${p.points || 0}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
                <div style="margin-top:10px;font-size:11px;color:var(--text-secondary);">
                    <i class="fas fa-info-circle"></i> Top 2 ke Knockout
                </div>
            </div>
        `;
    });

    html += `</div>`;

    // ===== Knockout Section =====
    html += `
        <div class="section-title" style="margin-top:30px;">
            <i class="fas fa-trophy" style="color:var(--neon-yellow);"></i>
            <span>Knockout Stage</span>
        </div>
    `;

    // Get all qualified players (top 2 from each group)
    const qualified = getAllQualified('ctr');
    if (qualified.length === 16) {
        html += renderCTRKnockout(qualified);
    } else {
        html += `
            <div class="bracket-container" style="text-align:center;padding:30px;color:var(--text-secondary);">
                <i class="fas fa-hourglass-half" style="font-size:36px;color:var(--neon-purple);display:block;margin-bottom:10px;"></i>
                Menunggu hasil grup... (${qualified.length}/16 pemain lolos)
            </div>
        `;
    }

    return html;
}

function getAllQualified(game) {
    const gameData = data[game];
    const groups = gameData.groups;
    const allQualified = [];

    Object.keys(groups).forEach(group => {
        const standings = getGroupStandings(game, group);
        const sorted = [...standings].sort((a, b) => b.points - a.points || a.wins - b.wins);
        const top2 = sorted.slice(0, 2).map(s => s.player);
        allQualified.push(...top2);
    });

    return allQualified;
}

function renderCTRKnockout(players) {
    // Shuffle untuk randomisasi bracket
    const shuffled = [...players];
    // Generate bracket matches (16 pemain → 8 matches)
    let matches = [];
    for (let i = 0; i < shuffled.length; i += 2) {
        matches.push({
            player1: shuffled[i],
            player2: shuffled[i + 1] || 'BYE',
            score1: null,
            score2: null,
            played: false,
            winner: null
        });
    }

    const ctrData = data.ctr;
    if (ctrData.knockout.round16.length === 0) {
        ctrData.knockout.round16 = matches;
        saveData();
    }

    let html = `
        <div class="bracket-container">
            <div class="bracket-title">🏆 BABAK 16 BESAR</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:30px;">
    `;

    const round16 = ctrData.knockout.round16;
    round16.forEach((m, idx) => {
        const isPlayed = m.played;
        const winner = isPlayed ? (m.score1 > m.score2 ? m.player1 : m.score2 > m.score1 ? m.player2 : null) : null;

        html += `
            <div class="bracket-match" onclick="openMatchModal('ctr', 'round16', ${idx})" style="${winner ? 'border-color:var(--neon-green);' : ''}">
                <div class="match-players">
                    <div class="player-entry ${isPlayed && m.score1 > m.score2 ? 'winner' : ''}">
                        <span>${m.player1}</span>
                        <span class="score">${isPlayed ? m.score1 : '-'}</span>
                    </div>
                    <div class="player-entry ${isPlayed && m.score2 > m.score1 ? 'winner' : ''}">
                        <span>${m.player2}</span>
                        <span class="score">${isPlayed ? m.score2 : '-'}</span>
                    </div>
                </div>
                <div class="match-status ${isPlayed ? 'played' : ''}">
                    ${isPlayed ? `✓ ${winner || 'Draw'}` : '⏳ Belum'}
                </div>
            </div>
        `;
    });

    html += `</div>`;

    // Check if round16 complete, generate round8
    const allPlayed = round16.every(m => m.played);
    if (allPlayed && ctrData.knockout.round8.length === 0) {
        const winners = round16.map(m => m.score1 > m.score2 ? m.player1 : m.score2 > m.score1 ? m.player2 : null).filter(w => w);
        const round8Matches = [];
        for (let i = 0; i < winners.length; i += 2) {
            round8Matches.push({
                player1: winners[i],
                player2: winners[i + 1] || 'BYE',
                score1: null,
                score2: null,
                played: false,
                winner: null
            });
        }
        ctrData.knockout.round8 = round8Matches;
        saveData();
    }

    // Render round8
    if (ctrData.knockout.round8.length > 0) {
        html += `<div class="bracket-title" style="margin-top:20px;">🏆 BABAK 8 BESAR</div>`;
        html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:30px;">`;
        ctrData.knockout.round8.forEach((m, idx) => {
            const isPlayed = m.played;
            const winner = isPlayed ? (m.score1 > m.score2 ? m.player1 : m.score2 > m.score1 ? m.player2 : null) : null;
            html += `
                <div class="bracket-match" onclick="openMatchModal('ctr', 'round8', ${idx})" style="${winner ? 'border-color:var(--neon-green);' : ''}">
                    <div class="match-players">
                        <div class="player-entry ${isPlayed && m.score1 > m.score2 ? 'winner' : ''}">
                            <span>${m.player1}</span>
                            <span class="score">${isPlayed ? m.score1 : '-'}</span>
                        </div>
                        <div class="player-entry ${isPlayed && m.score2 > m.score1 ? 'winner' : ''}">
                            <span>${m.player2}</span>
                            <span class="score">${isPlayed ? m.score2 : '-'}</span>
                        </div>
                    </div>
                    <div class="match-status ${isPlayed ? 'played' : ''}">
                        ${isPlayed ? `✓ ${winner || 'Draw'}` : '⏳ Belum'}
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    // Check round8 complete → generate semifinal
    if (ctrData.knockout.round8.length > 0 && ctrData.knockout.round8.every(m => m.played) && ctrData.knockout.round4.length === 0) {
        const winners = ctrData.knockout.round8.map(m => m.score1 > m.score2 ? m.player1 : m.score2 > m.score1 ? m.player2 : null).filter(w => w);
        const round4Matches = [];
        for (let i = 0; i < winners.length; i += 2) {
            round4Matches.push({
                player1: winners[i],
                player2: winners[i + 1],
                score1: null,
                score2: null,
                played: false,
                winner: null
            });
        }
        ctrData.knockout.round4 = round4Matches;
        saveData();
    }

    // Render semifinal
    if (ctrData.knockout.round4.length > 0) {
        html += `<div class="bracket-title" style="margin-top:20px;">🏆 BABAK 4 BESAR (Semifinal)</div>`;
        html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:30px;">`;
        ctrData.knockout.round4.forEach((m, idx) => {
            const isPlayed = m.played;
            const winner = isPlayed ? (m.score1 > m.score2 ? m.player1 : m.score2 > m.score1 ? m.player2 : null) : null;
            html += `
                <div class="bracket-match" onclick="openMatchModal('ctr', 'round4', ${idx})" style="${winner ? 'border-color:var(--neon-green);' : ''}">
                    <div class="match-players">
                        <div class="player-entry ${isPlayed && m.score1 > m.score2 ? 'winner' : ''}">
                            <span>${m.player1}</span>
                            <span class="score">${isPlayed ? m.score1 : '-'}</span>
                        </div>
                        <div class="player-entry ${isPlayed && m.score2 > m.score1 ? 'winner' : ''}">
                            <span>${m.player2}</span>
                            <span class="score">${isPlayed ? m.score2 : '-'}</span>
                        </div>
                    </div>
                    <div class="match-status ${isPlayed ? 'played' : ''}">
                        ${isPlayed ? `✓ ${winner || 'Draw'}` : '⏳ Belum'}
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    // Check semifinal complete → final
    if (ctrData.knockout.round4.length > 0 && ctrData.knockout.round4.every(m => m.played) && !ctrData.knockout.final) {
        const winners = ctrData.knockout.round4.map(m => m.score1 > m.score2 ? m.player1 : m.score2 > m.score1 ? m.player2 : null).filter(w => w);
        if (winners.length === 2) {
            ctrData.knockout.final = {
                player1: winners[0],
                player2: winners[1],
                score1: null,
                score2: null,
                played: false,
                winner: null
            };
            saveData();
        }
    }

    // Render final
    if (ctrData.knockout.final) {
        const f = ctrData.knockout.final;
        const isPlayed = f.played;
        const winner = isPlayed ? (f.score1 > f.score2 ? f.player1 : f.score2 > f.score1 ? f.player2 : null) : null;

        html += `<div class="bracket-title" style="margin-top:20px;color:var(--neon-yellow);">🏆 GRAND FINAL</div>`;
        html += `
            <div style="display:flex;justify-content:center;gap:30px;flex-wrap:wrap;padding:20px;">
                <div style="text-align:center;padding:20px 30px;background:var(--bg-primary);border-radius:16px;border:2px solid var(--neon-blue);">
                    <div style="font-size:14px;color:var(--text-secondary);">Finalis</div>
                    <div style="font-size:24px;font-weight:bold;color:${isPlayed && f.score1 > f.score2 ? 'var(--neon-green)' : 'var(--neon-blue)'};">${f.player1}</div>
                    <div style="font-size:20px;">${isPlayed ? f.score1 : '-'}</div>
                </div>
                <div style="display:flex;align-items:center;font-size:30px;color:var(--neon-yellow);"><i class="fas fa-vs"></i></div>
                <div style="text-align:center;padding:20px 30px;background:var(--bg-primary);border-radius:16px;border:2px solid var(--neon-pink);">
                    <div style="font-size:14px;color:var(--text-secondary);">Finalis</div>
                    <div style="font-size:24px;font-weight:bold;color:${isPlayed && f.score2 > f.score1 ? 'var(--neon-green)' : 'var(--neon-pink)'};">${f.player2}</div>
                    <div style="font-size:20px;">${isPlayed ? f.score2 : '-'}</div>
                </div>
            </div>
            <div style="text-align:center;">
                <button class="neon-btn" onclick="openMatchModal('ctr', 'final', 0)" style="max-width:300px;margin:0 auto;">
                    <i class="fas fa-edit"></i> Input Skor Final
                </button>
            </div>
        `;

        if (winner) {
            data.ctr.champion = winner;
            saveData();
            html += `
                <div class="final-banner" style="margin-top:20px;">
                    <i class="fas fa-crown"></i>
                    <h2>🏆 CHAMPION!</h2>
                    <div class="champion-name">${winner}</div>
                </div>
            `;
        }
    }

    return html;
}

// ============================================================
//  PES RENDER
// ============================================================
function renderPES(gameData) {
    let html = `
        <div class="section-title">
            <i class="fas fa-futbol"></i>
            <span>PES/FC 26 - Knockout</span>
            <button onclick="resetData()" style="margin-left:auto;background:rgba(255,77,148,0.2);border:1px solid #ff4d94;color:#ff4d94;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:12px;">
                <i class="fas fa-redo"></i> Reset
            </button>
        </div>
    `;

    // Generate bracket if empty
    if (gameData.bracket.round1.length === 0) {
        generatePESBracket(gameData);
    }

    // Render bracket rounds
    const rounds = [
        { key: 'round1', label: '16 BESAR', icon: 'fa-chevron-right' },
        { key: 'round2', label: '8 BESAR', icon: 'fa-chevron-right' },
        { key: 'round3', label: '4 BESAR (Semifinal)', icon: 'fa-chevron-right' },
        { key: 'final', label: '🏆 GRAND FINAL', icon: 'fa-trophy' }
    ];

    // Show team list
    html += `
        <div style="background:var(--bg-secondary);border-radius:16px;padding:15px 20px;margin-bottom:20px;border:1px solid rgba(180,77,255,0.1);">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;font-size:13px;">
    `;

    const teamKeys = Object.keys(gameData.teams);
    teamKeys.forEach(key => {
        const team = gameData.teams[key];
        const isBye = key === gameData.byeTeam;
        html += `
            <div style="padding:6px 10px;background:rgba(255,255,255,0.03);border-radius:8px;border-left:3px solid ${isBye ? 'var(--neon-yellow)' : 'var(--neon-purple)'};">
                <strong style="color:${isBye ? 'var(--neon-yellow)' : 'var(--neon-blue)'};">Tim ${key}</strong>
                ${isBye ? ' ⭐' : ''}
                <div style="font-size:11px;color:var(--text-secondary);">${team.players.join(' & ')}</div>
            </div>
        `;
    });

    html += `
            </div>
            <div style="margin-top:8px;font-size:11px;color:var(--text-secondary);">
                <i class="fas fa-star" style="color:var(--neon-yellow);"></i> Tim B (Esthu) sebagai juara bertahan mendapat BYE ke 8 Besar
            </div>
        </div>
    `;

    // Render each round
    rounds.forEach(round => {
        const matches = gameData.bracket[round.key];
        if (!matches || matches.length === 0) return;

        const isFinal = round.key === 'final';
        const isArray = Array.isArray(matches);

        html += `
            <div class="bracket-container" style="margin-top:15px;">
                <div class="bracket-title" style="${isFinal ? 'color:var(--neon-yellow);' : ''}">
                    <i class="fas ${round.icon}"></i> ${round.label}
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
        `;

        if (isArray) {
            matches.forEach((m, idx) => {
                const isPlayed = m.played;
                const winner = isPlayed ? (m.score1 > m.score2 ? m.player1 : m.score2 > m.score1 ? m.player2 : null) : null;
                const isBye = m.player2 === 'BYE';

                html += `
                    <div class="bracket-match" onclick="${!isFinal ? `openMatchModal('pes', '${round.key}', ${idx})` : ''}" 
                         style="${winner ? 'border-color:var(--neon-green);' : ''} ${isBye ? 'border-color:var(--neon-yellow);' : ''}">
                        <div class="match-players">
                            <div class="player-entry ${isPlayed && m.score1 > m.score2 ? 'winner' : ''}">
                                <span>${m.player1}</span>
                                <span class="score">${isPlayed ? m.score1 : '-'}</span>
                            </div>
                            <div class="player-entry ${isPlayed && m.score2 > m.score1 ? 'winner' : ''}">
                                <span>${isBye ? '⭐ BYE (Juara Bertahan)' : m.player2}</span>
                                <span class="score">${isPlayed ? m.score2 : isBye ? 'Auto' : '-'}</span>
                            </div>
                        </div>
                        <div class="match-status ${isPlayed ? 'played' : isBye ? 'byepass' : ''}">
                            ${isPlayed ? `✓ ${winner || 'Draw'}` : isBye ? '⭐ BYE' : '⏳ Belum'}
                        </div>
                    </div>
                `;
            });
        } else {
            // Final (single match)
            const m = matches;
            const isPlayed = m.played;
            const winner = isPlayed ? (m.score1 > m.score2 ? m.player1 : m.score2 > m.score1 ? m.player2 : null) : null;

            html += `
                <div style="grid-column:1/-1;display:flex;justify-content:center;gap:30px;flex-wrap:wrap;padding:20px;">
                    <div style="text-align:center;padding:20px 30px;background:var(--bg-primary);border-radius:16px;border:2px solid ${isPlayed && m.score1 > m.score2 ? 'var(--neon-green)' : 'var(--neon-blue)'};">
                        <div style="font-size:14px;color:var(--text-secondary);">Finalis</div>
                        <div style="font-size:24px;font-weight:bold;color:${isPlayed && m.score1 > m.score2 ? 'var(--neon-green)' : 'var(--neon-blue)'};">${m.player1}</div>
                        <div style="font-size:20px;">${isPlayed ? m.score1 : '-'}</div>
                    </div>
                    <div style="display:flex;align-items:center;font-size:30px;color:var(--neon-yellow);"><i class="fas fa-vs"></i></div>
                    <div style="text-align:center;padding:20px 30px;background:var(--bg-primary);border-radius:16px;border:2px solid ${isPlayed && m.score2 > m.score1 ? 'var(--neon-green)' : 'var(--neon-pink)'};">
                        <div style="font-size:14px;color:var(--text-secondary);">Finalis</div>
                        <div style="font-size:24px;font-weight:bold;color:${isPlayed && m.score2 > m.score1 ? 'var(--neon-green)' : 'var(--neon-pink)'};">${m.player2}</div>
                        <div style="font-size:20px;">${isPlayed ? m.score2 : '-'}</div>
                    </div>
                </div>
                <div style="text-align:center;grid-column:1/-1;">
                    <button class="neon-btn" onclick="openMatchModal('pes', 'final', 0)" style="max-width:300px;margin:0 auto;">
                        <i class="fas fa-edit"></i> Input Skor Final
                    </button>
                </div>
            `;

            if (winner) {
                data.pes.champion = winner;
                saveData();
                html += `
                    <div class="final-banner" style="grid-column:1/-1;margin-top:10px;">
                        <i class="fas fa-crown"></i>
                        <h2>🏆 CHAMPION!</h2>
                        <div class="champion-name">${winner}</div>
                    </div>
                `;
            }
        }

        html += `</div></div>`;
    });

    return html;
}

function generatePESBracket(gameData) {
    const teams = Object.keys(gameData.teams);
    const byeTeam = gameData.byeTeam;

    // Round 1: 13 tim (semua kecuali bye) → 6 matches + 1 bye
    const activeTeams = teams.filter(t => t !== byeTeam);
    const round1 = [];
    for (let i = 0; i < activeTeams.length; i += 2) {
        if (i + 1 < activeTeams.length) {
            round1.push({
                player1: `Tim ${activeTeams[i]}`,
                player2: `Tim ${activeTeams[i + 1]}`,
                score1: null,
                score2: null,
                played: false,
                winner: null
            });
        } else {
            // Sisa 1 tim akan melawan BYE dari juara bertahan? 
            // Sebenarnya byeTeam langsung ke round2
            // Tim sisa masuk round2 juga
            round1.push({
                player1: `Tim ${activeTeams[i]}`,
                player2: `BYE (Free)`,
                score1: 1,
                score2: 0,
                played: true,
                winner: `Tim ${activeTeams[i]}`
            });
        }
    }

    gameData.bracket.round1 = round1;
    saveData();
}

// ============================================================
//  MATCH INPUT MODAL
// ============================================================
function openMatchModal(game, round, index) {
    if (!isLoggedIn) {
        showNotification('❌ Silakan login terlebih dahulu!', 'error');
        return;
    }

    const gameData = data[game];
    let match = null;
    let title = '';

    if (game === 'mlbb') {
        if (round === 'final') {
            match = gameData.finalMatches[index];
            title = `MLBB Final BO5 - Match ${index + 1}`;
        } else {
            match = gameData.matches[index];
            title = `MLBB Group ${match.group}`;
        }
    } else if (game === 'ctr') {
        if (round === 'final') {
            match = gameData.knockout.final;
            title = 'CTR Grand Final';
        } else {
            match = gameData.knockout[round][index];
            const roundNames = { round16: '16 Besar', round8: '8 Besar', round4: 'Semifinal' };
            title = `CTR ${roundNames[round] || round}`;
        }
    } else if (game === 'pes') {
        if (round === 'final') {
            match = gameData.bracket.final;
            title = 'PES Grand Final';
        } else {
            match = gameData.bracket[round][index];
            const roundNames = { round1: '16 Besar', round2: '8 Besar', round3: 'Semifinal' };
            title = `PES ${roundNames[round] || round}`;
        }
    }

    if (!match) {
        showNotification('❌ Pertandingan tidak ditemukan!', 'error');
        return;
    }

    // Check if match is BYE
    if (match.player2 === 'BYE' || match.player2 === 'BYE (Free)') {
        showNotification('⏳ Ini adalah BYE, otomatis lolos!', 'info');
        return;
    }

    // Check if already played
    if (match.played) {
        if (!confirm(`⚠️ Pertandingan sudah dimainkan!\n${match.player1} ${match.score1} - ${match.score2} ${match.player2}\n\nIngin mengubah skor?`)) {
            return;
        }
    }

    // Build modal content
    const modal = document.getElementById('matchModal');
    const content = document.getElementById('matchInputContent');

    content.innerHTML = `
        <div style="margin-bottom:15px;color:var(--text-secondary);font-size:14px;">
            <i class="fas fa-info-circle"></i> ${title}
        </div>
        <form id="matchForm" class="match-input-form">
            <div class="player-row">
                <span class="pname">${match.player1}</span>
                <input type="number" id="score1" value="${match.score1 || ''}" min="0" max="99" placeholder="Skor">
            </div>
            <div style="text-align:center;color:var(--text-secondary);font-weight:bold;">VS</div>
            <div class="player-row">
                <span class="pname">${match.player2}</span>
                <input type="number" id="score2" value="${match.score2 || ''}" min="0" max="99" placeholder="Skor">
            </div>
            <button type="submit" class="submit-match">
                <i class="fas fa-check"></i> Simpan Skor
            </button>
            ${match.played ? '<div style="text-align:center;font-size:12px;color:var(--neon-yellow);">⚠️ Ini akan mengupdate skor yang sudah ada</div>' : ''}
        </form>
    `;

    modal.style.display = 'flex';

    // Handle submit
    document.getElementById('matchForm').onsubmit = function(e) {
        e.preventDefault();
        const s1 = parseInt(document.getElementById('score1').value);
        const s2 = parseInt(document.getElementById('score2').value);

        if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
            showNotification('❌ Masukkan skor yang valid!', 'error');
            return;
        }

        // Update match
        match.score1 = s1;
        match.score2 = s2;
        match.played = true;

        // Update standings for MLBB and CTR
        if (game === 'mlbb' || game === 'ctr') {
            updateStandings(game, match.player1, match.player2, s1, s2);
        }

        // For PES, just mark winner
        if (game === 'pes') {
            if (s1 > s2) match.winner = match.player1;
            else if (s2 > s1) match.winner = match.player2;
            else match.winner = null;

            // Auto-advance for PES
            advancePESBracket(game);
        }

        // For CTR knockout, auto-advance
        if (game === 'ctr' && round !== 'final') {
            advanceCTRKnockout(game);
        }

        saveData();
        closeMatchModal();
        renderCurrentGame();
        showNotification(`✅ Skor disimpan! ${match.player1} ${s1} - ${s2} ${match.player2}`, 'success');

        // Check if final complete for MLBB
        if (game === 'mlbb' && round === 'final') {
            checkMLBBFinal();
        }
    };
}

function closeMatchModal() {
    document.getElementById('matchModal').style.display = 'none';
}

function updateStandings(game, player1, player2, score1, score2) {
    const gameData = data[game];
    const s1 = gameData.standings[player1];
    const s2 = gameData.standings[player2];

    if (!s1 || !s2) return;

    // Remove old points if match already played (for re-score)
    // We'll just update from scratch for simplicity
    // Recalculate all matches for this game
    recalculateStandings(game);
}

function recalculateStandings(game) {
    const gameData = data[game];
    const standings = gameData.standings;

    // Reset all standings
    Object.keys(standings).forEach(key => {
        standings[key] = { player: key, points: 0, wins: 0, draws: 0, losses: 0, matches: 0 };
    });

    // Process all matches
    gameData.matches.forEach(m => {
        if (m.played) {
            const s1 = standings[m.player1];
            const s2 = standings[m.player2];
            if (s1 && s2) {
                s1.matches += 1;
                s2.matches += 1;
                if (m.score1 > m.score2) {
                    s1.points += 3;
                    s1.wins += 1;
                    s2.losses += 1;
                } else if (m.score2 > m.score1) {
                    s2.points += 3;
                    s2.wins += 1;
                    s1.losses += 1;
                } else {
                    s1.points += 1;
                    s2.points += 1;
                    s1.draws += 1;
                    s2.draws += 1;
                }
            }
        }
    });

    saveData();
}

function advanceCTRKnockout(game) {
    const gameData = data[game];
    const knockout = gameData.knockout;

    // Check round16 complete
    if (knockout.round16.every(m => m.played) && knockout.round8.length === 0) {
        const winners = knockout.round16.map(m => m.score1 > m.score2 ? m.player1 : m.score2 > m.score1 ? m.player2 : null).filter(w => w);
        const round8 = [];
        for (let i = 0; i < winners.length; i += 2) {
            if (i + 1 < winners.length) {
                round8.push({
                    player1: winners[i],
                    player2: winners[i + 1],
                    score1: null,
                    score2: null,
                    played: false,
                    winner: null
                });
            }
        }
        knockout.round8 = round8;
        saveData();
    }

    // Check round8 complete
    if (knockout.round8.length > 0 && knockout.round8.every(m => m.played) && knockout.round4.length === 0) {
        const winners = knockout.round8.map(m => m.score1 > m.score2 ? m.player1 : m.score2 > m.score1 ? m.player2 : null).filter(w => w);
        const round4 = [];
        for (let i = 0; i < winners.length; i += 2) {
            if (i + 1 < winners.length) {
                round4.push({
                    player1: winners[i],
                    player2: winners[i + 1],
                    score1: null,
                    score2: null,
                    played: false,
                    winner: null
                });
            }
        }
        knockout.round4 = round4;
        saveData();
    }

    // Check round4 complete
    if (knockout.round4.length > 0 && knockout.round4.every(m => m.played) && !knockout.final) {
        const winners = knockout.round4.map(m => m.score1 > m.score2 ? m.player1 : m.score2 > m.score1 ? m.player2 : null).filter(w => w);
        if (winners.length === 2) {
            knockout.final = {
                player1: winners[0],
                player2: winners[1],
                score1: null,
                score2: null,
                played: false,
                winner: null
            };
            saveData();
        }
    }
}

function advancePESBracket(game) {
    const gameData = data[game];
    const bracket = gameData.bracket;

    // Check round1 complete
    if (bracket.round1.every(m => m.played) && bracket.round2.length === 0) {
        const winners = bracket.round1.map(m => m.score1 > m.score2 ? m.player1 : m.score2 > m.score1 ? m.player2 : null).filter(w => w);
        // Add BYE team
        const byeTeam = `Tim ${gameData.byeTeam}`;
        const allWinners = [...winners, byeTeam];

        const round2 = [];
        for (let i = 0; i < allWinners.length; i += 2) {
            if (i + 1 < allWinners.length) {
                round2.push({
                    player1: allWinners[i],
                    player2: allWinners[i + 1],
                    score1: null,
                    score2: null,
                    played: false,
                    winner: null
                });
            }
        }
        bracket.round2 = round2;
        saveData();
    }

    // Check round2 complete
    if (bracket.round2.length > 0 && bracket.round2.every(m => m.played) && bracket.round3.length === 0) {
        const winners = bracket.round2.map(m => m.score1 > m.score2 ? m.player1 : m.score2 > m.score1 ? m.player2 : null).filter(w => w);
        const round3 = [];
        for (let i = 0; i < winners.length; i += 2) {
            if (i + 1 < winners.length) {
                round3.push({
                    player1: winners[i],
                    player2: winners[i + 1],
                    score1: null,
                    score2: null,
                    played: false,
                    winner: null
                });
            }
        }
        bracket.round3 = round3;
        saveData();
    }

    // Check round3 complete
    if (bracket.round3.length > 0 && bracket.round3.every(m => m.played) && !bracket.final) {
        const winners = bracket.round3.map(m => m.score1 > m.score2 ? m.player1 : m.score2 > m.score1 ? m.player2 : null).filter(w => w);
        if (winners.length === 2) {
            bracket.final = {
                player1: winners[0],
                player2: winners[1],
                score1: null,
                score2: null,
                played: false,
                winner: null
            };
            saveData();
        }
    }
}

function checkMLBBFinal() {
    const gameData = data.mlbb;
    const finalMatches = gameData.finalMatches;
    if (finalMatches.length < 5) return;

    let wins1 = 0,
        wins2 = 0;
    finalMatches.forEach(m => {
        if (m.played) {
            if (m.score1 > m.score2) wins1++;
            else if (m.score2 > m.score1) wins2++;
        }
    });

    if (wins1 >= 3 || wins2 >= 3) {
        const champion = wins1 >= 3 ? finalMatches[0].player1 : finalMatches[0].player2;
        gameData.champion = champion;
        saveData();
        showNotification(`🏆 Champion MLBB: ${champion}!`, 'success');
        renderCurrentGame();
    }
}

// ============================================================
//  EVENT LISTENERS
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Login
    document.getElementById('loginBtn').addEventListener('click', login);
    document.getElementById('usernameInput').addEventListener('keypress', e => {
        if (e.key === 'Enter') login();
    });
    document.getElementById('passwordInput').addEventListener('keypress', e => {
        if (e.key === 'Enter') login();
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Game navigation
    document.querySelectorAll('.game-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentGame = this.dataset.game;
            renderAll();
        });
    });

    // Close modal on click outside
    document.getElementById('matchModal').addEventListener('click', function(e) {
        if (e.target === this) closeMatchModal();
    });

    // Show login modal on load
    document.getElementById('loginModal').style.display = 'flex';
});

// ============================================================
//  KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeMatchModal();
    }
});

// ============================================================
//  EXPOSE FUNCTIONS TO GLOBAL SCOPE (for inline onclick)
// ============================================================
window.openMatchModal = openMatchModal;
window.closeMatchModal = closeMatchModal;
window.resetData = resetData;
window.renderCurrentGame = renderCurrentGame;
window.showNotification = showNotification;

console.log('🎮 Tournament Management System loaded!');
console.log('📊 Data auto-save di localStorage');
console.log('🔐 Login: admin / rahasia123');
