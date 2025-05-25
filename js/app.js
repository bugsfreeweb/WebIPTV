function updateLocalTime() {
    const el = document.getElementById('localTime');
    const d = new Date();
    let hour = d.getHours();
    let min = d.getMinutes();
    let ampm = hour >= 12 ? 'PM' : 'AM';
    let hour12 = hour % 12 || 12;
    let day = String(d.getDate()).padStart(2, '0');
    let month = String(d.getMonth()+1).padStart(2, '0');
    let year = d.getFullYear();
    let timeStr = `${hour12}:${min.toString().padStart(2, '0')} ${ampm} (${day}-${month}-${year})`;
    el.textContent = timeStr;
}
setInterval(updateLocalTime, 1000); updateLocalTime();

function refreshFeather() {
    try { if (document.querySelector('[data-feather]')) feather.replace(); } catch (e) {}
}
refreshFeather();

const player = document.getElementById('player');
const status = document.getElementById('status');
const fileInput = document.getElementById('fileInput');
const urlInput = document.getElementById('urlInput');
const loadUrlBtn = document.getElementById('loadUrl');
const toggleThemeBtn = document.getElementById('toggleTheme');
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const sidebar = document.querySelector('.sidebar');
const searchInput = document.getElementById('searchInput');
const channelList = document.getElementById('channelList');
const historyList = document.getElementById('historyList');
const favoritesList = document.getElementById('favoritesList');
const analysisText = document.getElementById('analysisText');
const analysisChart = document.getElementById('analysisChart');
const sidebarFooter = document.getElementById('sidebarFooter');
const analysisStatusSummary = document.getElementById('analysisStatusSummary');
const manualCheckBtn = document.getElementById('manualCheckBtn');
const exportFavoritesBtn = document.getElementById('exportFavoritesBtn');
let dashPlayer = null;
let allChannels = [];
let history = JSON.parse(localStorage.getItem('history')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentChannelUrl = null;
let analysisLast = { total: 0, online: 0, offline: 0, list: [], onlineList: [], offlineList: [] };
let analysisMode = 'total';
let analysisInProgress = false;

// --- Player Notification ---
function showPlayerNotification(msg, duration = 2600) {
    let note = document.getElementById('playerNotification');
    if (!note) {
        note = document.createElement('div');
        note.className = 'player-notification';
        note.id = 'playerNotification';
        document.body.appendChild(note);
    }
    note.innerHTML = msg;
    note.classList.add('show');
    if (note._timeout) clearTimeout(note._timeout);
    note._timeout = setTimeout(() => {
        note.classList.remove('show');
    }, duration);
}

// --- Duplicate Upload Check ---
function isDuplicateUpload({type, name, url}) {
    if (type === 'url') {
        return history.some(h => h.type === 'url' && (h.url === url || h.name === name));
    }
    if (type === 'file') {
        return history.some(h => h.type === 'file' && (h.name === name));
    }
    return false;
}

// --- Mouse Idle UI Toggle Logic ---
let idleTimeout = null;
let idleHideMs = 2200;
function setUiIdle(yes) {
    ['toggleTheme','toggleSidebar','localTime'].forEach(id=>{
        const el = document.getElementById(id);
        if (el) el.classList.toggle('idle', !!yes);
    });
}
function mouseActiveHandler() {
    setUiIdle(false);
    if (idleTimeout) clearTimeout(idleTimeout);
    idleTimeout = setTimeout(()=>setUiIdle(true), idleHideMs);
}
['mousemove','keydown','mousedown','touchstart'].forEach(ev=>{
    window.addEventListener(ev, mouseActiveHandler, {passive:true});
});
mouseActiveHandler();
['toggleTheme','toggleSidebar','localTime'].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.classList.add('hide-on-idle');
});

function updateSidebarFooter() {
    const year = new Date().getFullYear();
    sidebarFooter.innerHTML = `&copy; ${year} Copyrights Bugsfree studio All rights reserved.`;
}
updateSidebarFooter();

function getThemePref() {
    return localStorage.getItem('theme') === 'light';
}
function setTheme(isLight) {
    document.body.classList.toggle('light', isLight);
    toggleThemeBtn.classList.toggle('light', isLight);
    sidebar.classList.toggle('light', isLight);
    toggleSidebarBtn.classList.toggle('light', isLight);
    document.querySelectorAll('.tab, .upload-panel input, .upload-panel button, .search-panel input, .channel-list button, .history-list button, .favorites-list button, #urlInput').forEach(el => {
        el.classList && el.classList.toggle('light', isLight);
    });
    toggleThemeBtn.innerHTML = `<i data-feather="${isLight ? 'sun' : 'moon'}" class="w-6 h-6"></i>`;
    refreshFeather();
}
setTheme(getThemePref());
toggleThemeBtn.addEventListener('click', () => {
    const isLight = !document.body.classList.contains('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    setTheme(isLight);
});

function setSidebarVisible(visible) {
    sidebar.classList.toggle('hidden', !visible);
    toggleSidebarBtn.innerHTML = `<i data-feather="${visible ? 'x' : 'menu'}" class="w-6 h-6"></i>`;
    refreshFeather();
}
toggleSidebarBtn.addEventListener('click', () => {
    setSidebarVisible(sidebar.classList.contains('hidden'));
});
setSidebarVisible(true);

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
        if (tab.dataset.tab === 'analysis') showAnalysisInitial();
        document.querySelectorAll('.analysis-buttons button').forEach(b=>b.classList.remove('active'));
        if(tab.dataset.tab==="analysis") {
            if(analysisMode==="total") document.getElementById('showTotal').classList.add('active');
            else if(analysisMode==="online") document.getElementById('showOnline').classList.add('active');
            else if(analysisMode==="offline") document.getElementById('showOffline').classList.add('active');
        }
    });
});

document.getElementById('showTotal').onclick = () => { analysisMode = 'total'; updateAnalysisList(); highlightAnalysisBtn(); };
document.getElementById('showOnline').onclick = () => { analysisMode = 'online'; updateAnalysisList(); highlightAnalysisBtn(); };
document.getElementById('showOffline').onclick = () => { analysisMode = 'offline'; updateAnalysisList(); highlightAnalysisBtn(); };
function highlightAnalysisBtn() {
    document.querySelectorAll('.analysis-buttons button').forEach(b=>b.classList.remove('active'));
    if(analysisMode==="total") document.getElementById('showTotal').classList.add('active');
    else if(analysisMode==="online") document.getElementById('showOnline').classList.add('active');
    else if(analysisMode==="offline") document.getElementById('showOffline').classList.add('active');
}
analysisStatusSummary.addEventListener('click', e => {
    if (analysisMode === 'total') analysisMode = 'online';
    else if (analysisMode === 'online') analysisMode = 'offline';
    else analysisMode = 'total';
    updateAnalysisList();
    highlightAnalysisBtn();
});

manualCheckBtn.addEventListener('click', async () => {
    if (analysisInProgress) return;
    analysisInProgress = true;
    analysisText.textContent = "Checking (manual)...";
    await analyzePlaylist(true);
    analysisInProgress = false;
});

function showAnalysisInitial() {
    if (analysisLast.total === 0 && allChannels.length > 0) {
        analysisText.textContent = "Click the ✔ icon to check status";
        analysisChart.style.display = 'none';
    } else {
        analysisText.textContent = `Total: ${analysisLast.total||0} | Online: ${analysisLast.online||0} | Offline: ${analysisLast.offline||0}`;
        analysisChart.style.display = analysisLast.total ? 'block' : 'none';
        updateAnalysisList();
    }
}

function sanitizeString(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    let result = div.innerHTML
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    result = result.replace(/['"]/g, '');
    if (str.match(/^(http|https):\/\//)) {
        try { new URL(str); return str; } catch { return ''; }
    }
    return result;
}

function playStream(url, retry = false) {
    if (!url) {
        status.textContent = "Bugsfree Studio";
        return;
    }
    status.innerHTML = `
        <svg class="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading Stream...
    `;
    currentChannelUrl = url;
    highlightPlaylist();
    try {
        if (dashPlayer) {
            dashPlayer.reset(); dashPlayer = null;
        }
        const setError = (message) => {
            status.innerHTML = `<div class="status-error"><span>❌ ${message}</span>
                <button class="retry-btn" onclick="playStream('${sanitizeString(url)}', true)">Retry</button></div>`;
        };
        if (url.includes('.m3u8') || url.includes('.ts')) {
            if (Hls.isSupported()) {
                const hls = new Hls({ enableWorker: false });
                hls.loadSource(url);
                hls.attachMedia(player);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    player.play().then(() => { player.muted = false; status.style.display = 'none'; }).catch(() => { setError("Autoplay failed. Please press play."); });
                });
                hls.on(Hls.Events.ERROR, (event, data) => {
                    setError(data.type === Hls.ErrorTypes.NETWORK_ERROR ? "Network error loading stream" : "Stream could not be loaded");
                });
            } else { setError("HLS is not supported in this browser"); }
        } else if (url.includes('.mpd')) {
            dashPlayer = dashjs.MediaPlayer().create();
            dashPlayer.initialize(player, url, true);
            dashPlayer.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
                player.play().then(() => { player.muted = false; status.style.display = 'none'; }).catch(() => { setError("Autoplay failed. Please press play."); });
            });
            dashPlayer.on(dashjs.MediaPlayer.events.ERROR, () => { setError("Stream could not be loaded"); });
        } else if (url.includes('.mp4') || url.match(/^(http|https|rtmp):\/\//)) {
            player.src = url;
            player.oncanplay = () => {
                player.play().then(() => { status.style.display = 'none'; }).catch(() => { setError("Autoplay failed. Please press play."); });
            };
            player.onerror = () => { setError("Stream could not be loaded"); };
        } else {
            setError("Unsupported stream format");
        }
    } catch (e) {
        status.innerHTML = `<div class="status-error"><span>❌ Failed to load stream due to an error.</span>
            <button class="retry-btn" onclick="playStream('${sanitizeString(url)}', true)">Retry</button></div>`;
    }
}

function parseM3U(content) {
    try {
        const lines = content.split('\n');
        const channels = [];
        let currentChannel = null;
        lines.forEach(line => {
            line = line.trim();
            if (line.startsWith('#EXTINF')) {
                const nameMatch = line.match(/,(.+)$/);
                const logoMatch = line.match(/tvg-logo="([^"]+)"/);
                currentChannel = {
                    name: nameMatch ? nameMatch[1] : 'Unknown Channel',
                    logo: logoMatch ? logoMatch[1] : null
                };
            } else if (line && !line.startsWith('#') && currentChannel) {
                currentChannel.url = line;
                channels.push(currentChannel);
                currentChannel = null;
            }
        });
        allChannels = channels;
        localStorage.setItem('lastPlaylist', JSON.stringify(channels));
        displayChannels(channels);
        if (channels.length > 0) {
            playStream(channels[0].url);
        }
    } catch (e) { status.textContent = "❌ Failed to parse M3U playlist"; }
}

function highlightPlaylist() {
    channelList.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('playlist-current', 'playlist-favorite');
        const url = btn.getAttribute('data-url');
        if (!url) return;
        if (url === currentChannelUrl) btn.classList.add('playlist-current');
        if (favorites.some(f => f.url === url)) btn.classList.add('playlist-favorite');
    });
    favoritesList.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('playlist-current', 'playlist-favorite');
        const url = btn.getAttribute('data-url');
        if (!url) return;
        if (url === currentChannelUrl) btn.classList.add('playlist-current');
        if (favorites.some(f => f.url === url)) btn.classList.add('playlist-favorite');
    });
}

function shortenUrl(url) {
    try {
        const u = new URL(url);
        let host = u.host.replace(/^www\./, '');
        let path = u.pathname.length > 20 ? u.pathname.slice(0, 16) + '…' : u.pathname;
        return `${host}${path}`;
    } catch {
        return url.length > 24 ? url.slice(0, 20) + '…' : url;
    }
}

function displayChannels(channels) {
    channelList.innerHTML = channels.map(ch => {
        const sanitizedUrl = sanitizeString(ch.url);
        const sanitizedName = sanitizeString(ch.name);
        const sanitizedLogo = ch.logo ? sanitizeString(ch.logo) : '';
        const isFavorited = favorites.some(f => f.url === ch.url);
        const isCurrent = sanitizedUrl === currentChannelUrl;
        return `
            <button data-url="${sanitizedUrl}" class="${isCurrent ? 'playlist-current' : ''} ${isFavorited ? 'playlist-favorite' : ''}" onclick="playStream('${sanitizedUrl}')">
                ${sanitizedLogo ? `<img src="${sanitizedLogo}" alt="${sanitizedName}" onerror="this.style.display='none'">` : ''}
                <i data-feather="tv" class="w-5 h-5"></i> ${sanitizedName}
                <span style="margin-left:auto;display:flex;align-items:center;">
                    <i data-feather="heart" class="favorite-btn w-5 h-5 ${isFavorited ? 'text-red-500' : ''}" onclick="event.stopPropagation(); window.toggleFavorite('${sanitizedUrl}', '${sanitizedName}', '${sanitizedLogo}')"></i>
                </span>
            </button>
        `;
    }).join('');
    refreshFeather();
    highlightPlaylist();
}

window.toggleFavorite = function(url, name, logo) {
    const index = favorites.findIndex(f => f.url === url);
    if (index === -1) {
        favorites.push({ url, name, logo });
    } else {
        favorites.splice(index, 1);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    displayFavorites();
    displayChannels(allChannels);
}

function displayFavorites() {
    favoritesList.innerHTML = favorites.length > 0 ? favorites.map(f => {
        const sanitizedUrl = sanitizeString(f.url);
        const sanitizedName = sanitizeString(f.name);
        const sanitizedLogo = f.logo ? sanitizeString(f.logo) : '';
        const isCurrent = sanitizedUrl === currentChannelUrl;
        return `
            <button data-url="${sanitizedUrl}" class="playlist-favorite${isCurrent ? ' playlist-current' : ''}" onclick="playStream('${sanitizedUrl}')">
                ${sanitizedLogo ? `<img src="${sanitizedLogo}" alt="${sanitizedName}" onerror="this.style.display='none'">` : ''}
                <i data-feather="tv" class="w-5 h-5"></i> ${sanitizedName}
                <span style="margin-left:auto;display:flex;align-items:center;">
                    <i data-feather="heart" class="favorite-btn w-5 h-5 text-red-500" onclick="event.stopPropagation(); window.toggleFavorite('${sanitizedUrl}', '${sanitizedName}', '${sanitizedLogo}')"></i>
                </span>
            </button>
        `;
    }).join('') : '<p>No favorites added.</p>';
    refreshFeather();
    highlightPlaylist();
}

function displayHistory() {
    historyList.innerHTML = history.length > 0 ? history.map((h, i) => {
        let label = h.name;
        if (h.type === "url" && h.name && /^https?:\/\//.test(h.name)) {
            label = shortenUrl(h.name);
        }
        const sanitizedLabel = sanitizeString(label);
        return `
            <button>
                <span class="history-label"><i data-feather="${h.type === 'file' ? 'file' : 'link'}" class="w-5 h-5"></i> ${sanitizedLabel}</span>
                <span style="margin-left:auto;display:flex;align-items:center;">
                    <i data-feather="refresh-cw" class="action-btn w-5 h-5" title="Resync" onclick="event.stopPropagation(); window.loadHistoryFile(${i})"></i>
                    <i data-feather="trash-2" class="delete-btn w-5 h-5" title="Delete" onclick="event.stopPropagation(); window.deleteHistory(${i})"></i>
                </span>
            </button>
        `;
    }).join('') : '<p>No history available.</p>';
    refreshFeather();
}

window.loadHistoryFile = function(index) {
    const item = history[index];
    if (item.type === 'file' && item.content) {
        if (item.name.endsWith('.m3u')) {
            parseM3U(item.content);
        } else if (item.name.endsWith('.json')) {
            try {
                const json = JSON.parse(item.content);
                if (json.url) {
                    playStream(json.url);
                    localStorage.removeItem('lastPlaylist');
                    channelList.innerHTML = '';
                    allChannels = [];
                }
            } catch {
                status.textContent = "❌ Invalid JSON file";
            }
        } else if (item.name.endsWith('.txt')) {
            if (item.content.trim()) {
                playStream(item.content.trim());
                localStorage.removeItem('lastPlaylist');
                channelList.innerHTML = '';
                allChannels = [];
            }
        }
    } else if (item.type === 'url' && item.url) {
        playStream(item.url);
    }
}

window.deleteHistory = function(index) {
    history.splice(index, 1);
    localStorage.setItem('history', JSON.stringify(history));
    displayHistory();
}

async function analyzePlaylist(manual=false) {
    analysisText.textContent = manual ? "Checking status..." : "Checking...";
    analysisChart.style.display = 'block';
    if (!allChannels.length) {
        analysisText.textContent = "No playlist loaded";
        analysisChart.style.display = 'none';
        analysisLast = { total: 0, online: 0, offline: 0, list: [], onlineList: [], offlineList: [] };
        updateAnalysisList();
        return;
    }
    let onlineList = [], offlineList = [];
    let online = 0, total = allChannels.length;
    await Promise.all(allChannels.map(async channel => {
        let ok = false;
        try {
            if (channel.url.endsWith('.m3u8') || channel.url.endsWith('.ts')) {
                let r = await fetch(channel.url, {method:'GET', mode:'no-cors', cache:'no-store'});
                ok = (r.status === 200 || r.type === 'opaque');
            } else if (channel.url.endsWith('.mpd') || channel.url.endsWith('.mp4')) {
                let r = await fetch(channel.url, {method:'HEAD', mode:'cors', cache:'no-store'});
                ok = r.ok && r.headers.get('content-type') && r.headers.get('content-type').includes('video');
            } else if (/^http(s)?:\/\//.test(channel.url)) {
                let r = await fetch(channel.url, {method:'HEAD', mode:'no-cors', cache:'no-store'});
                ok = (r.status === 200 || r.type === 'opaque');
            }
        } catch {}
        if(ok) { online++; onlineList.push(channel); }
        else offlineList.push(channel);
    }));
    const offline = total - online;
    analysisLast = {total, online, offline, list: allChannels, onlineList, offlineList};
    analysisText.textContent = `Total: ${total} | Online: ${online} | Offline: ${offline}`;
    const ctx = analysisChart.getContext('2d');
    ctx.clearRect(0, 0, analysisChart.width, analysisChart.height);
    const centerX = analysisChart.width / 2;
    const centerY = analysisChart.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const onlineAngle = (online / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, onlineAngle, false);
    ctx.lineTo(centerX, centerY);
    ctx.fillStyle = '#28a745';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, onlineAngle, 2 * Math.PI, false);
    ctx.lineTo(centerX, centerY);
    ctx.fillStyle = '#dc3545';
    ctx.fill();
    updateAnalysisList();
}

function updateAnalysisList() {
    let list = [];
    if (analysisMode === 'total') list = analysisLast.list || [];
    else if (analysisMode === 'online') list = analysisLast.onlineList || [];
    else if (analysisMode === 'offline') list = analysisLast.offlineList || [];
    displayChannels(list.length ? list : []);
}

searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const filteredChannels = allChannels.filter(ch => ch.name.toLowerCase().includes(query));
    displayChannels(filteredChannels);
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (isDuplicateUpload({type:'file', name:file.name})) {
        showPlayerNotification("Duplicate file upload detected!");
        return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target.result;
        history.push({ type: 'file', name: file.name, content });
        localStorage.setItem('history', JSON.stringify(history));
        displayHistory();
        if (file.name.endsWith('.m3u')) {
            parseM3U(content);
        } else if (file.name.endsWith('.json')) {
            try {
                const json = JSON.parse(content);
                if (json.url) {
                    playStream(json.url);
                    localStorage.removeItem('lastPlaylist');
                    channelList.innerHTML = '';
                    allChannels = [];
                }
            } catch {
                status.textContent = "❌ Invalid JSON file";
            }
        } else if (file.name.endsWith('.txt')) {
            if (content.trim()) {
                playStream(content.trim());
                localStorage.removeItem('lastPlaylist');
                channelList.innerHTML = '';
                allChannels = [];
            }
        }
        showPlayerNotification("File uploaded and loaded successfully.");
    };
    reader.readAsText(file);
});

loadUrlBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (!url) return;
    if (isDuplicateUpload({type:'url', name:url, url})) {
        showPlayerNotification("Duplicate URL upload detected!");
        return;
    }
    history.push({ type: 'url', name: url, url });
    localStorage.setItem('history', JSON.stringify(history));
    displayHistory();
    if (url.endsWith('.m3u')) {
        fetch(url)
            .then(res => res.text())
            .then(parseM3U)
            .catch(() => { status.textContent = "❌ Failed to load M3U playlist"; });
    } else {
        playStream(url);
        localStorage.removeItem('lastPlaylist');
        channelList.innerHTML = '';
        allChannels = [];
    }
    showPlayerNotification("URL loaded successfully.");
});

exportFavoritesBtn.addEventListener('click', () => {
    if (!favorites.length) return;
    let m3u = "#EXTM3U\n";
    favorites.forEach(f => {
        m3u += `#EXTINF:-1${f.logo ? ` tvg-logo="${f.logo}"` : ""},${f.name || "Favorite"}\n${f.url}\n`;
    });
    const blob = new Blob([m3u], {type: 'audio/x-mpegurl'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'favorites.m3u';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { document.body.removeChild(link); }, 200);
    showPlayerNotification("Favorites playlist exported!");
});

const lastPlaylist = localStorage.getItem('lastPlaylist');
if (lastPlaylist) {
    allChannels = JSON.parse(lastPlaylist);
    displayChannels(allChannels);
    if (allChannels.length > 0) {
        playStream(allChannels[0].url);
    }
}

displayHistory();
displayFavorites();

const url = new URLSearchParams(window.location.search).get('url');
if (url) {
    playStream(url);
    localStorage.removeItem('lastPlaylist');
    channelList.innerHTML = '';
    allChannels = [];
}

window.playStream = playStream;
window.toggleFavorite = window.toggleFavorite;
window.loadHistoryFile = window.loadHistoryFile;
window.deleteHistory = window.deleteHistory;