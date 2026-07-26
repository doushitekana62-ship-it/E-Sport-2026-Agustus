// ============================================================
//  TOURNAMENT MANAGER 2026
//  Membaca data dari Google Spreadsheet
//  Versi: 1.0
// ============================================================

// ============================================================
//  KONFIGURASI SPREADSHEET
//  Ganti link berikut dengan link publish spreadsheet Anda
// ============================================================
const CONFIG = {
    // Base URL spreadsheet (tanpa gid)
    BASE_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGMy9RZ4BDEkzQzwWzmFktWZOYMN_3Itz_MxZsksFw72AULd-2nYOihbW87E6qb7Pq9pQCluKMzz5-/pub',
    
    // GID untuk setiap sheet (sesuaikan dengan spreadsheet Anda)
    SHEETS: {
        mlbb: { gid: 0, name: 'MLBB' },
        mlbbTeams: { gid: 1224539532, name: 'MLBB_Teams' },
        ctr: { gid: 905373510, name: 'CTR' },
        pes: { gid: 956808020, name: 'PES' },
        pesTeams: { gid: 1249712552, name: 'PES_Teams' }
    }
};

// ============================================================
//  STATE
// ============================================================
let currentGame = 'mlbb';
let allData = {
    mlbb: { matches: [], teams: [], standings: [] },
    ctr: { matches: [], standings: [] },
    pes: { matches: [], teams: [], bracket: [] }
};
let isLoading = false;
let lastUpdate = null;

// ============================================================
//  DOM REFS
// ============================================================
const contentArea = document.getElementById('contentArea');
const currentDateEl = document.getElementById('currentDate');
const countdownText = document.getElementById('countdownText');
const lastUpdateEl = document.getElementById('lastUpdate');

// ============================================================
//  UTILITY FUNCTIONS
// ============================================================
function getSheetUrl(gid) {
    return `${CONFIG.BASE_URL}?gid=${gid}&output=csv`;
}

async function fetchCSV(gid) {
    const url = getSheetUrl(gid);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        return parseCSV(text);
    } catch (error) {
        console.error(`Error fetching sheet gid=${gid}:`, error);
        return [];
    }
}

function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] !== undefined ? values[idx].trim().replace(/^"|"$/g, '') : '';
        });
        result.push(row);
    }
    return result;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    } catch {
        return dateStr;
    }
}

function getStatusColor(status) {
    const s = status?.toLowerCase() || '';
    if (s === 'done' || s === 'selesai') return 'done';
    return 'pending';
}

// ============================================================
//  COUNTDOWN
// ============================================================
function updateCountdown() {
    const now = new Date();
    const targets = [
        { date: '2026-07-27', label: 'MLBB Mulai' },
        { date: '2026-08-03', label: 'CTR Mulai' },
        { date: '2026-08-05', label: 'PES Mulai' }
    ];
    
    let nearest = null;
    let minDiff = Infinity;
    
    targets.forEach(t => {
        const d = new Date(t.date);
        const diff = d - now;
        if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            nearest = t;
        }
    });
    
    if (nearest) {
        const days = Math.floor(minDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((minDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((minDiff % (1000 * 60 * 60)) / (1000 * 60));
        countdownText.textContent = `${days}d ${hours}h ${mins}m → ${nearest.label}`;
        countdownText.style.color = 'var(--neon-yellow)';
    } else {
        countdownText.textContent = '🏆 Tournament Berlangsung!';
        countdownText.style.color = 'var(--neon-green)';
    }
}

// ============================================================
//  FETCH ALL DATA
// ============================================================
async function fetchAllData() {
    if (isLoading) return;
    isLoading = true;
    contentArea.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>🔄 Memuat data dari spreadsheet...</p>
        </div>
    `;

    try {
        // Fetch semua sheet
        const [mlbbRaw, mlbbTeamsRaw, ctrRaw, pesRaw, pesTeamsRaw] = await Promise.all([
            fetchCSV(CONFIG.SHEETS.mlbb.gid),
            fetchCSV(CONFIG.SHEETS.mlbbTeams.gid),
            fetchCSV(CONFIG.SHEETS.ctr.gid),
            fetchCSV(CONFIG.SHEETS.pes.gid),
            fetchCSV(CONFIG.SHEETS.pesTeams.gid)
        ]);

        // Proses MLBB
        allData.mlbb.matches = mlbbRaw;
        allData.mlbb.teams = mlbbTeamsRaw;
        allData.mlbb.standings = calculateMLBBStandings(mlbbRaw, mlbbTeamsRaw);

        // Proses CTR
        allData.ctr.matches = ctrRaw;
        allData.ctr.standings = calculateCTRStandings(ctrRaw);

        // Proses PES
        allData.pes.matches = pesRaw;
        allData.pes.teams = pesTeamsRaw;
        allData.pes.bracket = buildPESBracket(pesRaw, pesTeamsRaw);

        lastUpdate = new Date();
        lastUpdateEl.textContent = `Last update: ${lastUpdate.toLocaleTimeString('id-ID')}`;
        
        renderCurrentGame();
        updateCountdown();

    } catch (error) {
        console.error('Error fetching data:', error);
        contentArea.innerHTML = `
            <div class="loading-container" style="color:var(--neon-red);">
                <i class="fas fa-exclamation-triangle" style="font-size:48px;"></i>
                <h3>Gagal memuat data</h3>
                <p style="color:var(--text-secondary);">Pastikan spreadsheet sudah dipublikasikan dan link benar.</p>
                <button onclick="fetchAllData()" class="refresh-btn" style="padding:10px 30px;font-size:16px;margin-top:10px;">
                    <i class="fas fa-redo"></i> Coba Lagi
                </button>
            </div>
        `;
    }
    
    isLoading = false;
}

// ============================================================
//  MLBB STANDINGS
// ============================================================
function calculateMLBBStandings(matches, teams) {
    const standings = {};
    
    teams.forEach(t => {
        const key = t.Team?.trim() || '';
        if (key) {
            standings[key] = {
                team: key,
                name: t.TeamName || '',
                players: [t.Player1, t.Player2, t.Player3, t.Player4, t.Player5].filter(Boolean),
                points: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                matches: 0,
                goalsFor: 0,
                goalsAgainst: 0
            };
        }
    });
    
    matches.forEach(m => {
        const t1 = m.Team1?.trim() || '';
        const t2 = m.Team2?.trim() || '';
        const s1 = parseInt(m.Score1) || 0;
        const s2 = parseInt(m.Score2) || 0;
        
        if (!t1 || !t2 || !standings[t1] || !standings[t2]) return;
        if (m.Status?.toLowerCase() !== 'done' && !m.Score1 && !m.Score2) return;
        
        const team1 = standings[t1];
        const team2 = standings[t2];
        team1.matches += 1;
        team2.matches += 1;
        team1.goalsFor += s1;
        team1.goalsAgainst += s2;
        team2.goalsFor += s2;
        team2.goalsAgainst += s1;
        
        if (s1 > s2) {
            team1.points += 3;
            team1.wins += 1;
            team2.losses += 1;
        } else if (s2 > s1) {
            team2.points += 3;
            team2.wins += 1;
            team1.losses += 1;
        } else {
            team1.points += 1;
            team2.points += 1;
            team1.draws += 1;
            team2.draws += 1;
        }
    });
    
    return Object.values(standings).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        const diffA = a.goalsFor - a.goalsAgainst;
        const diffB = b.goalsFor - b.goalsAgainst;
        return diffB - diffA;
    });
}

// ============================================================
//  CTR STANDINGS
// ============================================================
function calculateCTRStandings(matches) {
    const standings = {};
    
    matches.forEach(m => {
        const p1 = m.Player1?.trim() || '';
        const p2 = m.Player2?.trim() || '';
        const s1 = parseInt(m.Score1) || 0;
        const s2 = parseInt(m.Score2) || 0;
        
        if (!p1 || !p2) return;
        if (m.Status?.toLowerCase() !== 'done' && !m.Score1 && !m.Score2) return;
        
        if (!standings[p1]) standings[p1] = { player: p1, group: m.Group || '', points: 0, wins: 0, draws: 0, losses: 0, matches: 0 };
        if (!standings[p2]) standings[p2] = { player: p2, group: m.Group || '', points: 0, wins: 0, draws: 0, losses: 0, matches: 0 };
        
        const s1data = standings[p1];
        const s2data = standings[p2];
        s1data.matches += 1;
        s2data.matches += 1;
        
        if (s1 > s2) {
            s1data.points += 3;
            s1data.wins += 1;
            s2data.losses += 1;
        } else if (s2 > s1) {
            s2data.points += 3;
            s2data.wins += 1;
            s1data.losses += 1;
        } else {
            s1data.points += 1;
            s2data.points += 1;
            s1data.draws += 1;
            s2data.draws += 1;
        }
    });
    
    return Object.values(standings).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.wins - a.wins;
    });
}

// ============================================================
//  PES BRACKET
// ============================================================
function buildPESBracket(matches, teams) {
    const teamMap = {};
    teams.forEach(t => {
        const key = t.Team?.trim() || '';
        if (key) {
            teamMap[key] = {
                team: key,
                players: [t.Player1, t.Player2].filter(Boolean)
            };
        }
    });
    
    // Build rounds
    const rounds = {
        round1: [],
        round2: [],
        round3: [],
        final: null
    };
    
    // Group matches by round
    const roundMap = {};
    matches.forEach(m => {
        const round = m.Round?.trim() || 'R1';
        if (!roundMap[round]) roundMap[round] = [];
        roundMap[round].push(m);
    });
    
    // Sort rounds
    const roundKeys = Object.keys(roundMap).sort();
    const roundLabels = ['R1', 'R2', 'R3', 'Final'];
    
    roundKeys.forEach((key, idx) => {
        const matchesInRound = roundMap[key];
        const roundData = matchesInRound.map(m => ({
            match: m.Match || '',
            team1: m.Team1?.trim() || '',
            team2: m.Team2?.trim() || '',
            score1: parseInt(m.Score1) || null,
            score2: parseInt(m.Score2) || null,
            winner: m.Winner?.trim() || '',
            status: m.Status?.toLowerCase() || 'pending',
            date: m.Date || ''
        }));
        
        if (key === 'Final' || idx === 3) {
            rounds.final = roundData[0] || null;
        } else if (idx === 0) {
            rounds.round1 = roundData;
        } else if (idx === 1) {
            rounds.round2 = roundData;
        } else if (idx === 2) {
            rounds.round3 = roundData;
        }
    });
    
    return { rounds, teamMap };
}

// ============================================================
//  RENDER ENGINE
// ============================================================
function renderCurrentGame() {
    if (currentGame === 'mlbb') renderMLBB();
    else if (currentGame === 'ctr') renderCTR();
    else if (currentGame === 'pes') renderPES();
}

function switchGame(game) {
    currentGame = game;
    document.querySelectorAll('.game-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.game === game);
    });
    renderCurrentGame();
}

// ============================================================
//  RENDER MLBB
// ============================================================
function renderMLBB() {
    const data = allData.mlbb;
    if (!data.matches.length && !data.teams.length) {
        contentArea.innerHTML = `
            <div class="loading-container">
                <i class="fas fa-database" style="font-size:48px;color:var(--text-muted);"></i>
                <p>Data MLBB belum tersedia</p>
                <button onclick="fetchAllData()" class="refresh-btn" style="padding:10px 30px;">
                    <i class="fas fa-redo"></i> Refresh
                </button>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="section-title">
            <i class="fas fa-crosshairs"></i>
            <span>MLBB - Fase Grup (7 Team)</span>
            <span class="badge">Round Robin</span>
        </div>
    `;
    
    // Standings
    html += `<div class="group-grid">`;
    const standings = data.standings;
    if (standings.length) {
        html += `
            <div class="group-card" style="grid-column:1/-1;">
                <div class="group-header">
                    <h4><i class="fas fa-trophy"></i> Klasemen Akhir</h4>
                    <span class="team-name">Top 2 ke Final BO5</span>
                </div>
                <table class="standings-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Team</th>
                            <th style="text-align:center">M</th>
                            <th style="text-align:center">W</th>
                            <th style="text-align:center">D</th>
                            <th style="text-align:center">L</th>
                            <th style="text-align:center">P</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        standings.forEach((s, idx) => {
            const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : '';
            const topClass = idx < 2 ? 'rank-top' : '';
            const displayName = s.name || `Team ${s.team}`;
            html += `
                <tr class="${topClass}">
                    <td class="rank ${rankClass}">${idx + 1}</td>
                    <td class="team-cell">
                        <strong>${displayName}</strong>
                        <div style="font-size:10px;color:var(--text-muted);">
                            ${s.players.join(', ')}
                        </div>
                    </td>
                    <td class="text-center">${s.matches}</td>
                    <td class="text-center" style="color:var(--neon-green);">${s.wins}</td>
                    <td class="text-center" style="color:var(--neon-yellow);">${s.draws}</td>
                    <td class="text-center" style="color:var(--neon-red);">${s.losses}</td>
                    <td class="points">${s.points}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    }
    html += `</div>`;
    
    // Matches list
    html += `
        <div class="section-title" style="margin-top:20px;">
            <i class="fas fa-list"></i>
            <span>Jadwal & Hasil Pertandingan</span>
        </div>
        <div class="match-list">
    `;
    
    const matches = data.matches;
    matches.forEach(m => {
        const t1 = m.Team1?.trim() || '';
        const t2 = m.Team2?.trim() || '';
        const s1 = m.Score1 ? parseInt(m.Score1) : null;
        const s2 = m.Score2 ? parseInt(m.Score2) : null;
        const isDone = m.Status?.toLowerCase() === 'done' || (s1 !== null && s2 !== null);
        const date = m.Date ? formatDate(m.Date) : `Hari ${m.Day || '-'}`;
        
        const team1Name = allData.mlbb.teams.find(t => t.Team?.trim() === t1)?.TeamName || t1;
        const team2Name = allData.mlbb.teams.find(t => t.Team?.trim() === t2)?.TeamName || t2;
        
        html += `
            <div class="match-item" onclick="showMatchDetail('mlbb', ${matches.indexOf(m)})">
                <div class="match-teams">
                    <span>${team1Name}</span>
                    <span class="vs">vs</span>
                    <span>${team2Name}</span>
                </div>
                <div class="match-score">
                    ${isDone ? `<span class="score-done">${s1} - ${s2}</span>` : '<span class="score-pending">-</span>'}
                </div>
                <div>
                    <span class="match-status-badge ${isDone ? 'done' : 'pending'}">
                        ${isDone ? '✅ Selesai' : '⏳ Pending'}
                    </span>
                    <div style="font-size:9px;color:var(--text-muted);margin-top:2px;">${date}</div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    
    // Final BO5 jika ada
    const top2 = standings.slice(0, 2);
    if (top2.length === 2) {
        html += `
            <div class="section-title" style="margin-top:30px;">
                <i class="fas fa-trophy" style="color:var(--neon-yellow);"></i>
                <span>🏆 GRAND FINAL BO5</span>
                <span class="badge">31 Juli 2026</span>
            </div>
            <div class="bracket-container">
                <div class="bracket-title">${top2[0].name || top2[0].team} 🆚 ${top2[1].name || top2[1].team}</div>
                <div style="display:flex;justify-content:center;gap:20px;flex-wrap:wrap;padding:15px;">
                    <div style="text-align:center;padding:15px 25px;background:var(--bg-primary);border-radius:12px;border:2px solid var(--neon-blue);">
                        <div style="font-size:12px;color:var(--text-secondary);">Finalis 1</div>
                        <div style="font-size:20px;font-weight:700;color:var(--neon-blue);">${top2[0].name || top2[0].team}</div>
                        <div style="font-size:11px;color:var(--text-muted);">Poin: ${top2[0].points}</div>
                    </div>
                    <div style="display:flex;align-items:center;font-size:28px;color:var(--neon-yellow);">
                        <i class="fas fa-vs"></i>
                    </div>
                    <div style="text-align:center;padding:15px 25px;background:var(--bg-primary);border-radius:12px;border:2px solid var(--neon-pink);">
                        <div style="font-size:12px;color:var(--text-secondary);">Finalis 2</div>
                        <div style="font-size:20px;font-weight:700;color:var(--neon-pink);">${top2[1].name || top2[1].team}</div>
                        <div style="font-size:11px;color:var(--text-muted);">Poin: ${top2[1].points}</div>
                    </div>
                </div>
                <div style="text-align:center;font-size:13px;color:var(--text-secondary);">
                    <i class="fas fa-info-circle"></i> Skor BO5 akan diupdate di spreadsheet
                </div>
            </div>
        `;
    }
    
    contentArea.innerHTML = html;
}

// ============================================================
//  RENDER CTR
// ============================================================
function renderCTR() {
    const data = allData.ctr;
    if (!data.matches.length) {
        contentArea.innerHTML = `
            <div class="loading-container">
                <i class="fas fa-database" style="font-size:48px;color:var(--text-muted);"></i>
                <p>Data CTR belum tersedia</p>
                <button onclick="fetchAllData()" class="refresh-btn" style="padding:10px 30px;">
                    <i class="fas fa-redo"></i> Refresh
                </button>
            </div>
        `;
        return;
    }
    
    // Group by group
    const groups = {};
    data.matches.forEach(m => {
        const g = m.Group?.trim() || 'Unknown';
        if (!groups[g]) groups[g] = [];
        groups[g].push(m);
    });
    
    let html = `
        <div class="section-title">
            <i class="fas fa-car"></i>
            <span>CTR - Fase Grup</span>
            <span class="badge">Top 2 Lolos</span>
        </div>
        <div class="group-grid">
    `;
    
    // Standings per group
    const allStandings = data.standings;
    const groupStandings = {};
    allStandings.forEach(s => {
        const g = s.group || 'Unknown';
        if (!groupStandings[g]) groupStandings[g] = [];
        groupStandings[g].push(s);
    });
    
    Object.keys(groups).sort().forEach(g => {
        const players = groupStandings[g] || [];
        const sorted = [...players].sort((a, b) => b.points - a.points || b.wins - a.wins);
        
        html += `
            <div class="group-card">
                <div class="group-header">
                    <h4><i class="fas fa-users"></i> Group ${g}</h4>
                    <span class="team-name">${sorted.length} pemain</span>
                </div>
                <table class="standings-table">
                    <thead>
                        <tr><th>#</th><th>Pemain</th><th style="text-align:center">M</th><th style="text-align:center">P</th></tr>
                    </thead>
                    <tbody>
        `;
        
        sorted.forEach((s, idx) => {
            const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : '';
            const topClass = idx < 2 ? 'rank-top' : '';
            html += `
                <tr class="${topClass}">
                    <td class="rank ${rankClass}">${idx + 1}</td>
                    <td class="team-cell">${s.player}</td>
                    <td class="text-center">${s.matches}</td>
                    <td class="points">${s.points}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
                <div style="margin-top:8px;font-size:11px;color:var(--text-secondary);">
                    <i class="fas fa-info-circle"></i> 
                    ✅ ${sorted.slice(0, 2).map(s => s.player).join(', ')} lolos ke 16 Besar
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    
    // List semua pertandingan
    html += `
        <div class="section-title" style="margin-top:20px;">
            <i class="fas fa-list"></i>
            <span>Semua Pertandingan CTR</span>
        </div>
        <div class="match-list">
    `;
    
    data.matches.forEach((m, idx) => {
        const p1 = m.Player1?.trim() || '';
        const p2 = m.Player2?.trim() || '';
        const s1 = m.Score1 ? parseInt(m.Score1) : null;
        const s2 = m.Score2 ? parseInt(m.Score2) : null;
        const isDone = m.Status?.toLowerCase() === 'done' || (s1 !== null && s2 !== null);
        const date = m.Date ? formatDate(m.Date) : '-';
        
        html += `
            <div class="match-item" onclick="showMatchDetail('ctr', ${idx})">
                <div class="match-teams">
                    <span>${p1}</span>
                    <span class="vs">vs</span>
                    <span>${p2}</span>
                </div>
                <div class="match-score">
                    ${isDone ? `<span class="score-done">${s1} - ${s2}</span>` : '<span class="score-pending">-</span>'}
                </div>
                <div>
                    <span class="match-status-badge ${isDone ? 'done' : 'pending'}">
                        ${isDone ? '✅' : '⏳'}
                    </span>
                    <div style="font-size:9px;color:var(--text-muted);margin-top:2px;">${date}</div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    
    contentArea.innerHTML = html;
}

// ============================================================
//  RENDER PES
// ============================================================
function renderPES() {
    const data = allData.pes;
    if (!data.matches.length) {
        contentArea.innerHTML = `
            <div class="loading-container">
                <i class="fas fa-database" style="font-size:48px;color:var(--text-muted);"></i>
                <p>Data PES/FC belum tersedia</p>
                <button onclick="fetchAllData()" class="refresh-btn" style="padding:10px 30px;">
                    <i class="fas fa-redo"></i> Refresh
                </button>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="section-title">
            <i class="fas fa-futbol"></i>
            <span>PES/FC 26 - Knockout</span>
            <span class="badge">14 Tim</span>
        </div>
    `;
    
    // Team list
    html += `
        <div style="background:var(--bg-secondary);border-radius:var(--radius);padding:15px 20px;margin-bottom:20px;border:1px solid rgba(180,77,255,0.1);">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:6px;font-size:12px;">
    `;
    
    const teams = data.teams;
    teams.forEach(t => {
        const team = t.Team?.trim() || '';
        const p1 = t.Player1 || '';
        const p2 = t.Player2 || '';
        const isBye = team === 'B';
        html += `
            <div style="padding:4px 8px;background:rgba(255,255,255,0.03);border-radius:6px;border-left:3px solid ${isBye ? 'var(--neon-yellow)' : 'var(--neon-purple)'};">
                <strong style="color:${isBye ? 'var(--neon-yellow)' : 'var(--neon-blue)'};">Tim ${team}</strong>
                ${isBye ? ' ⭐' : ''}
                <div style="font-size:10px;color:var(--text-muted);">${p1} & ${p2}</div>
            </div>
        `;
    });
    
    html += `
            </div>
            <div style="margin-top:8px;font-size:11px;color:var(--text-secondary);">
                <i class="fas fa-star" style="color:var(--neon-yellow);"></i> Tim B (Esthu) mendapat BYE ke 8 Besar
            </div>
        </div>
    `;
    
    // Bracket
    const bracket = data.bracket;
    const rounds = [
        { key: 'round1', label: '16 BESAR', icon: 'fa-chevron-right' },
        { key: 'round2', label: '8 BESAR', icon: 'fa-chevron-right' },
        { key: 'round3', label: '4 BESAR (Semifinal)', icon: 'fa-chevron-right' }
    ];
    
    rounds.forEach(round => {
        const matches = bracket.rounds?.[round.key] || [];
        if (!matches.length) return;
        
        html += `
            <div class="bracket-container" style="margin-top:15px;">
                <div class="bracket-title"><i class="fas ${round.icon}"></i> ${round.label}</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;">
        `;
        
        matches.forEach((m, idx) => {
            const isDone = m.status === 'done' || (m.score1 !== null && m.score2 !== null);
            const isBye = m.team2 === 'BYE (B)' || m.team2 === 'BYE';
            const winner = m.winner || '';
            
            html += `
                <div class="bracket-match" onclick="showMatchDetail('pes', ${idx}, '${round.key}')" 
                     style="${winner ? 'border-color:var(--neon-green);' : ''} ${isBye ? 'border-color:var(--neon-yellow);' : ''}">
                    <div class="match-players">
                        <div class="player-entry ${isDone && m.score1 > m.score2 ? 'winner' : ''}">
                            <span>${m.team1 || '-'}</span>
                            <span class="score">${isDone ? m.score1 : '-'}</span>
                        </div>
                        <div class="player-entry ${isDone && m.score2 > m.score1 ? 'winner' : ''}">
                            <span>${isBye ? '⭐ BYE' : (m.team2 || '-')}</span>
                            <span class="score">${isDone ? m.score2 : isBye ? 'Auto' : '-'}</span>
                        </div>
                    </div>
                    <div class="match-status ${isDone ? 'played' : ''} ${isBye ? 'byepass' : ''}">
                        ${isDone ? `✅ ${winner || 'Draw'}` : isBye ? '⭐ BYE' : '⏳ Pending'}
                    </div>
                </div>
            `;
        });
        
        html += `</div></div>`;
    });
    
    // Final
    if (bracket.rounds?.final) {
        const f = bracket.rounds.final;
        const isDone = f.status === 'done' || (f.score1 !== null && f.score2 !== null);
        
        html += `
            <div class="bracket-container" style="margin-top:15px;border-color:var(--neon-yellow);">
                <div class="bracket-title" style="color:var(--neon-yellow);">
                    <i class="fas fa-trophy"></i> GRAND FINAL
                </div>
                <div style="display:flex;justify-content:center;gap:20px;flex-wrap:wrap;padding:15px;">
                    <div style="text-align:center;padding:15px 25px;background:var(--bg-primary);border-radius:12px;border:2px solid ${isDone && f.score1 > f.score2 ? 'var(--neon-green)' : 'var(--neon-blue)'};">
                        <div style="font-size:12px;color:var(--text-secondary);">Finalis</div>
                        <div style="font-size:20px;font-weight:700;color:${isDone && f.score1 > f.score2 ? 'var(--neon-green)' : 'var(--neon-blue)'};">${f.team1 || '-'}</div>
                        <div style="font-size:20px;">${isDone ? f.score1 : '-'}</div>
                    </div>
                    <div style="display:flex;align-items:center;font-size:28px;color:var(--neon-yellow);"><i class="fas fa-vs"></i></div>
                    <div style="text-align:center;padding:15px 25px;background:var(--bg-primary);border-radius:12px;border:2px solid ${isDone && f.score2 > f.score1 ? 'var(--neon-green)' : 'var(--neon-pink)'};">
                        <div style="font-size:12px;color:var(--text-secondary);">Finalis</div>
                        <div style="font-size:20px;font-weight:700;color:${isDone && f.score2 > f.score1 ? 'var(--neon-green)' : 'var(--neon-pink)'};">${f.team2 || '-'}</div>
                        <div style="font-size:20px;">${isDone ? f.score2 : '-'}</div>
                    </div>
                </div>
                ${f.winner ? `
                    <div class="final-banner" style="margin-top:10px;">
                        <i class="fas fa-crown trophy-icon"></i>
                        <h2>🏆 CHAMPION!</h2>
                        <div class="champion-name">${f.winner}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    contentArea.innerHTML = html;
}

// ============================================================
//  MODAL DETAIL
// ============================================================
function showMatchDetail(game, index, round) {
    const modal = document.getElementById('matchModal');
    const body = document.getElementById('modalBody');
    
    let match = null;
    let title = '';
    
    if (game === 'mlbb') {
        match = allData.mlbb.matches[index];
        title = `MLBB - ${match.Team1} vs ${match.Team2}`;
    } else if (game === 'ctr') {
        match = allData.ctr.matches[index];
        title = `CTR - ${match.Player1} vs ${match.Player2}`;
    } else if (game === 'pes') {
        const roundData = allData.pes.bracket.rounds?.[round] || [];
        match = roundData[index];
        title = `PES - ${match?.team1} vs ${match?.team2}`;
    }
    
    if (!match) {
        body.innerHTML = '<p style="color:var(--neon-red);">Data tidak ditemukan</p>';
        modal.style.display = 'flex';
        return;
    }
    
    const isDone = match.Status?.toLowerCase() === 'done' || (match.Score1 !== undefined && match.Score1 !== null && match.Score1 !== '');
    const s1 = match.Score1 || match.score1 || '-';
    const s2 = match.Score2 || match.score2 || '-';
    const winner = match.Winner || match.winner || '-';
    
    body.innerHTML = `
        <div class="modal-body">
            <div class="detail-row">
                <span class="label">🏷️ Pertandingan</span>
                <span class="value">${title}</span>
            </div>
            <div class="detail-row">
                <span class="label">📅 Tanggal</span>
                <span class="value">${match.Date || match.date || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="label">📊 Skor</span>
                <span class="value" style="font-size:20px;color:${isDone ? 'var(--neon-green)' : 'var(--text-muted)'};">
                    ${isDone ? `${s1} - ${s2}` : 'Belum dimainkan'}
                </span>
            </div>
            <div class="detail-row">
                <span class="label">🏆 Pemenang</span>
                <span class="value ${winner && winner !== '-' ? 'winner' : ''}">
                    ${winner && winner !== '-' ? `🎉 ${winner}` : '-'}
                </span>
            </div>
            <div class="detail-row">
                <span class="label">📌 Status</span>
                <span class="value" style="color:${isDone ? 'var(--neon-green)' : 'var(--neon-yellow)'};">
                    ${isDone ? '✅ Selesai' : '⏳ Pending'}
                </span>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('matchModal').style.display = 'none';
}

// ============================================================
//  REFRESH DATA
// ============================================================
function refreshData() {
    fetchAllData();
}

// ============================================================
//  AUTO REFRESH (setiap 5 menit)
// ============================================================
setInterval(() => {
    refreshData();
}, 300000); // 5 menit

// ============================================================
//  INIT
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    const now = new Date();
    currentDateEl.textContent = now.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    
    // Countdown
    updateCountdown();
    setInterval(updateCountdown, 60000);
    
    // Fetch data
    fetchAllData();
    
    // Modal close on outside click
    document.getElementById('matchModal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Keyboard shortcut
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
});

// ============================================================
//  EXPOSE FUNCTIONS
// ============================================================
window.switchGame = switchGame;
window.refreshData = refreshData;
window.showMatchDetail = showMatchDetail;
window.closeModal = closeModal;

console.log('🏆 Tournament Manager 2026 loaded!');
console.log('📊 Data dari Google Spreadsheet');
console.log('🔄 Auto-refresh setiap 5 menit');
