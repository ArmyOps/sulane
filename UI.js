// ==UserScript==
// @name         Sulane Bot UI & Overlay Haldur
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Puhas ja modulaarne UI liides botile (põhiskill, kõrvalskillid, alamröövimised, debug logi ja ESC stoppmefanism)
// @author       Sina
// @match        *://sulane.net/avaleht.php*
// @match        *://www.sulane.net/avaleht.php*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- SEADETE SALVESTAMINE JA LUGEMINE (LocalStorage) ---
    let isRunning = localStorage.getItem('sulane_running') === 'true';
    let debugEnabled = localStorage.getItem('sulane_debug_enabled') === 'true';
    let primarySkill = localStorage.getItem('sulane_primary_skill') || 'mets';
    
    let sideFishing = localStorage.getItem('sulane_side_fishing') !== 'false';
    let sideStealing = localStorage.getItem('sulane_side_stealing') !== 'false';
    let sideRobbery = localStorage.getItem('sulane_side_robbery') !== 'false';

    // Alamröövimised
    let robPrygikast = localStorage.getItem('sulane_rob_prygikast') !== 'false';
    let robSeif = localStorage.getItem('sulane_rob_seif') !== 'false';
    let robKirst = localStorage.getItem('sulane_rob_kirst') !== 'false';
    let robHpSeif = localStorage.getItem('sulane_rob_hpseif') !== 'false';
    let robHpKirst = localStorage.getItem('sulane_rob_hpkirst') !== 'false';

    // Hädaseiskamine ESC klahviga
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isRunning) {
            isRunning = false;
            localStorage.setItem('sulane_running', 'false');
            updateUIState();
            logMessage('⚠️ BOT PEATATUD HÄDASEISKAMISEGA (ESC)!', true);
            alert('Bot peatati hädaseiskamisega (ESC)!');
        }
    });

    // --- UI LOOMINE ---
    function createUI() {
        if (document.getElementById('bot-overlay-container')) return;

        // 1. Vasak ülaserv: Taimerite overlay (karkass tuleviku jaoks)
        const timerOverlay = document.createElement('div');
        timerOverlay.id = 'bot_timer_overlay';
        timerOverlay.style.position = 'fixed';
        timerOverlay.style.top = '10px';
        timerOverlay.style.left = '10px';
        timerOverlay.style.zIndex = '999999';
        timerOverlay.style.backgroundColor = 'rgba(30, 30, 30, 0.95)';
        timerOverlay.style.color = '#ffffff';
        timerOverlay.style.padding = '10px';
        timerOverlay.style.borderRadius = '8px';
        timerOverlay.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';
        timerOverlay.style.fontFamily = 'monospace';
        timerOverlay.style.fontSize = '11px';
        timerOverlay.style.width = '280px';
        timerOverlay.style.border = '1px solid #444';
        timerOverlay.innerHTML = `
            <div style="font-weight:bold;border-bottom:1px solid #444;padding-bottom:3px;margin-bottom:4px;color:#4CAF50;">⏳ Sulane Taimerid</div>
            <div style="color:#00ff00;">Valmis ootel...</div>
        `;
        document.body.appendChild(timerOverlay);

        // 2. Parempoolne main overlay (Juhtpaneel)
        const overlay = document.createElement('div');
        overlay.id = 'bot-overlay-container';
        overlay.style.position = 'fixed';
        overlay.style.top = '10px';
        overlay.style.right = '10px';
        overlay.style.zIndex = '999999';
        overlay.style.backgroundColor = '#1e1e1e';
        overlay.style.color = '#ffffff';
        overlay.style.padding = '12px';
        overlay.style.borderRadius = '8px';
        overlay.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';
        overlay.style.fontFamily = 'sans-serif';
        overlay.style.fontSize = '12px';
        overlay.style.width = '260px';

        overlay.innerHTML = `
            <div style="font-weight:bold;border-bottom:1px solid #444;padding-bottom:4px;margin-bottom:8px;color:#4CAF50;">🎲 Sulane Bot UI</div>
            <div style="font-size:11px;color:#aaa;margin-bottom:8px;">(Peatamiseks vajuta <b>ESC</b>)</div>

            <!-- Põhiskill -->
            <div style="margin-bottom:8px;background:#2a2a2a;padding:6px;border-radius:4px;">
                <label style="font-weight:bold;display:block;margin-bottom:4px;color:#ddd;">Põhiskill:</label>
                <select id="bot_primary_skill" style="width:100%;padding:4px;background:#333;color:#fff;border:1px solid #555;border-radius:4px;">
                    <option value="mets" ${primarySkill === 'mets' ? 'selected' : ''}>Puuraidumine</option>
                </select>
            </div>

            <!-- Valikskillid -->
            <div style="margin-bottom:4px;background:#2a2a2a;padding:6px;border-radius:4px;display:flex;align-items:center;justify-content:space-between;">
                <label style="color:#ddd;cursor:pointer;font-size:11px;">Kalastamine</label>
                <input type="checkbox" id="bot_side_fishing" ${sideFishingEnabled() ? 'checked' : ''} style="cursor:pointer;">
            </div>

            <div style="margin-bottom:4px;background:#2a2a2a;padding:6px;border-radius:4px;display:flex;align-items:center;justify-content:space-between;">
                <label style="color:#ddd;cursor:pointer;font-size:11px;">Vargus</label>
                <input type="checkbox" id="bot_side_stealing" ${sideStealingEnabled() ? 'checked' : ''} style="cursor:pointer;">
            </div>

            <div style="margin-bottom:4px;background:#2a2a2a;padding:6px;border-radius:4px;display:flex;align-items:center;justify-content:space-between;">
                <label style="color:#ddd;cursor:pointer;font-size:11px;">Röövimine</label>
                <input type="checkbox" id="bot_side_robbery" ${sideRobberyEnabled() ? 'checked' : ''} style="cursor:pointer;">
            </div>

            <!-- Röövimise alamvalikud (nähtavad või peidetud vastavalt Röövimise checkboxile) -->
            <div id="bot_robbery_subcontainer" style="margin-bottom:8px;background:#252525;padding:6px;border-radius:4px;border-left:3px solid #4CAF50;display:${sideRobberyEnabled() ? 'block' : 'none'};">
                <div style="font-size:10px;color:#aaa;margin-bottom:4px;font-weight:bold;">Röövimise kohad:</div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;font-size:11px;">
                    <label style="color:#ccc;cursor:pointer;">Prügikast</label>
                    <input type="checkbox" id="bot_rob_prygikast" ${robPrygikast ? 'checked' : ''} style="cursor:pointer;">
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;font-size:11px;">
                    <label style="color:#ccc;cursor:pointer;">Seif</label>
                    <input type="checkbox" id="bot_rob_seif" ${robSeif ? 'checked' : ''} style="cursor:pointer;">
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;font-size:11px;">
                    <label style="color:#ccc;cursor:pointer;">Kirst</label>
                    <input type="checkbox" id="bot_rob_kirst" ${robKirst ? 'checked' : ''} style="cursor:pointer;">
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;font-size:11px;">
                    <label style="color:#ccc;cursor:pointer;">HP seif</label>
                    <input type="checkbox" id="bot_rob_hpseif" ${robHpSeif ? 'checked' : ''} style="cursor:pointer;">
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;font-size:11px;">
                    <label style="color:#ccc;cursor:pointer;">HP kirst</label>
                    <input type="checkbox" id="bot_rob_hpkirst" ${robHpKirst ? 'checked' : ''} style="cursor:pointer;">
                </div>
            </div>

            <!-- Debug Checkbox -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;background:#2a2a2a;padding:6px;border-radius:4px;">
                <label style="cursor:pointer;color:#ddd;font-size:11px;">Debug logi:</label>
                <input type="checkbox" id="bot_debug_check" ${debugEnabled ? 'checked' : ''} style="cursor:pointer;">
            </div>

            <!-- Start/Stop Nupp -->
            <button id="bot_toggle_btn" style="width:100%;padding:8px;background-color:${isRunning ? '#dc3545' : '#28a745'};color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">
                ${isRunning ? 'Peata Bot' : 'Käivita Bot'}
            </button>
        `;

        document.body.appendChild(overlay);

        // 3. Vasak alusnurk: Debug logi kast
        const logBox = document.createElement('div');
        logBox.id = 'bot_debug_log';
        logBox.style.position = 'fixed';
        logBox.style.bottom = '10px';
        logBox.style.left = '10px';
        logBox.style.zIndex = '999999';
        logBox.style.backgroundColor = 'rgba(0,0,0,0.9)';
        logBox.style.color = '#00ff00';
        logBox.style.padding = '10px';
        logBox.style.borderRadius = '6px';
        logBox.style.fontFamily = 'monospace';
        logBox.style.fontSize = '11px';
        logBox.style.width = '350px';
        logBox.style.maxHeight = '160px';
        logBox.style.overflowY = 'auto';
        logBox.style.border = '1px solid #333';
        logBox.style.display = debugEnabled ? 'block' : 'none';

        logBox.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #444;padding-bottom:3px;margin-bottom:5px;">
                <span style="font-weight:bold;color:#4CAF50;">🐛 Debug Logi</span>
                <button id="bot_clear_log_btn" style="background:#555;color:#fff;border:none;border-radius:3px;font-size:10px;padding:2px 6px;cursor:pointer;">Tühjenda</button>
            </div>
            <div id="bot_log_content">${localStorage.getItem('sulase_debug_log_html') || '<b>[Logi valmis]</b><br>'}</div>
        `;
        document.body.appendChild(logBox);

        // --- SÜNDMUSTE KUULAJAD (EventListeners) ---
        
        // Põhiskilli muutmine
        document.getElementById('bot_primary_skill').addEventListener('change', (e) => {
            localStorage.setItem('sulane_primary_skill', e.target.value);
            logMessage(`Põhiskill muudetud: ${e.target.value}`);
        });

        // Kõrvalskillid
        document.getElementById('bot_side_fishing').addEventListener('change', (e) => {
            localStorage.setItem('sulane_side_fishing', e.target.checked);
            logMessage(`Kalastamine: ${e.target.checked ? 'SEES' : 'VÄLJAS'}`);
        });

        document.getElementById('bot_side_stealing').addEventListener('change', (e) => {
            localStorage.setItem('sulane_side_stealing', e.target.checked);
            logMessage(`Vargus: ${e.target.checked ? 'SEES' : 'VÄLJAS'}`);
        });

        const robberyCb = document.getElementById('bot_side_robbery');
        const robSubcontainer = document.getElementById('bot_robbery_subcontainer');

        robberyCb.addEventListener('change', (e) => {
            localStorage.setItem('sulane_side_robbery', e.target.checked);
            robSubcontainer.style.display = e.target.checked ? 'block' : 'none';
            logMessage(`Röövimine: ${e.target.checked ? 'SEES' : 'VÄLJAS'}`);
        });

        // Alamröövimiste kuulajad
        const subRobbingKeys = [
            { id: 'bot_rob_prygikast', key: 'sulane_rob_prygikast', name: 'Prügikast' },
            { id: 'bot_rob_seif', key: 'sulane_rob_seif', name: 'Seif' },
            { id: 'bot_rob_kirst', key: 'sulane_rob_kirst', name: 'Kirst' },
            { id: 'bot_rob_hpseif', key: 'sulane_rob_hpseif', name: 'HP seif' },
            { id: 'bot_rob_hpkirst', key: 'sulane_rob_hpkirst', name: 'HP kirst' }
        ];

        subRobbingKeys.forEach(item => {
            document.getElementById(item.id).addEventListener('change', (e) => {
                localStorage.setItem(item.key, e.target.checked);
                logMessage(`Alamrööv [${item.name}]: ${e.target.checked ? 'SEES' : 'VÄLJAS'}`);
            });
        });

        // Debug logi checkbox
        document.getElementById('bot_debug_check').addEventListener('change', (e) => {
            debugEnabled = e.target.checked;
            localStorage.setItem('sulane_debug_enabled', debugEnabled);
            logBox.style.display = debugEnabled ? 'block' : 'none';
            if (debugEnabled) logMessage('Debug logi sisse lülitatud.');
        });

        // Logi tühjendamise nupp
        document.getElementById('bot_clear_log_btn').addEventListener('click', () => {
            localStorage.removeItem('sulase_debug_log_html');
            document.getElementById('bot_log_content').innerHTML = '<b>[Logi tühjendatud]</b><br>';
        });

        // Start / Stop nupp
        document.getElementById('bot_toggle_btn').addEventListener('click', () => {
            isRunning = !isRunning;
            localStorage.setItem('sulane_running', String(isRunning));
            updateUIState();
            logMessage(`Bot on nüüd: ${isRunning ? 'AKTIIVNE' : 'PEATATUD'}`);
        });
    }

    function sideFishingEnabled() { return localStorage.getItem('sulane_side_fishing') !== 'false'; }
    function sideStealingEnabled() { return localStorage.getItem('sulane_side_stealing') !== 'false'; }
    function sideRobberyEnabled() { return localStorage.getItem('sulane_side_robbery') !== 'false'; }

    function updateUIState() {
        const toggleBtn = document.getElementById('bot_toggle_btn');
        if (toggleBtn) {
            toggleBtn.textContent = isRunning ? 'Peata Bot' : 'Käivita Bot';
            toggleBtn.style.backgroundColor = isRunning ? '#dc3545' : '#28a745';
        }
    }

    function logMessage(msg, isError = false) {
        if (!debugEnabled) return;
        const logContent = document.getElementById('bot_log_content');
        if (!logContent) return;

        const timeStr = new Date().toLocaleTimeString();
        const color = isError ? '#FF5555' : '#00ff00';
        logContent.innerHTML += `<span style="color:${color}">[${timeStr}] ${msg}</span><br>`;

        if (logContent.innerHTML.length > 3000) {
            logContent.innerHTML = logContent.innerHTML.substring(logContent.innerHTML.length - 3000);
        }

        try {
            localStorage.setItem('sulase_debug_log_html', logContent.innerHTML);
        } catch (e) {}

        const logBox = document.getElementById('bot_debug_log');
        if (logBox) logBox.scrollTop = logBox.scrollHeight;
    }

    // Käivitame UI
    createUI();

})();
