(function () {
    'use strict';

    const TARGET_ORE = 'Plaatina';
    let isPaused = localStorage.getItem('mine_bot_paused') === 'true';

    function createMiningOverlay() {
        if (document.getElementById('mine-debug-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'mine-debug-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '10px';
        overlay.style.right = '280px'; // Nihutatud veidi vasakule, et ei kataks põhiskilli UI-d
        overlay.style.zIndex = '999999';
        overlay.style.background = 'rgba(0, 0, 0, 0.95)';
        overlay.style.color = '#00ff00';
        overlay.style.padding = '12px';
        overlay.style.fontFamily = 'monospace';
        overlay.style.fontSize = '11px';
        overlay.style.borderRadius = '8px';
        overlay.style.width = '360px';
        overlay.style.border = '2px solid #00ff00';
        overlay.style.boxShadow = '0 4px 15px rgba(0,0,0,0.7)';

        overlay.innerHTML = `
            <div style="font-weight:bold; border-bottom:1px solid #444; padding-bottom:4px; margin-bottom:6px; color:#ffcc00;">
                === 10x KAEVANDUSE BOT (v14.8) ===
            </div>
            <div id="bot-status-text" style="margin-bottom:8px; line-height: 1.4;">Valmis 2-etapiliseks testiks...</div>
            <div id="bot-log-box" style="background:#111; padding:6px; border:1px solid #333; height:110px; overflow-y:auto; font-size:10px; margin-bottom:8px; color:#aaa;"></div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 9px; color: #888;" id="bot-current-loc">Kaevanduses</span>
                <div>
                    <button id="bot-fetch-btn" style="background: #0088ff; color: #fff; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px; font-weight: bold; margin-right: 5px;">Fetch & Refresh</button>
                    <button id="bot-toggle-btn" style="background: ${isPaused ? '#44ff44' : '#ff4444'}; color: ${isPaused ? '#000' : '#fff'}; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px; font-weight: bold;">
                        ${isPaused ? 'Jätka' : 'Paus'}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const savedLogs = sessionStorage.getItem('bot_persistent_logs');
        if (savedLogs) {
            document.getElementById('bot-log-box').innerHTML = savedLogs;
        }

        // 2-ETAPILINE FETCH & REFRESH NUPP
        document.getElementById('bot-fetch-btn').addEventListener('click', async () => {
            const buttons = document.querySelectorAll('button.maavaranupp');
            let targetRuut = null;

            for (const btn of buttons) {
                if (btn.getAttribute('maavara') === TARGET_ORE) {
                    targetRuut = btn.getAttribute('ruutnr');
                    break;
                }
            }

            if (targetRuut !== null) {
                logToOverlay(`1. Saadan korjamise päringu ruudule ${targetRuut}...`);

                try {
                    const res1 = await fetch(`/10xpickupmaavara.php?ruutnr=${targetRuut}&kaarttyyp=tavakaart`);
                    logToOverlay(`-> Pickup vastuse kood: ${res1.status}`);
                } catch(e) {
                    logToOverlay(`-> Pickup viga: ${e.message}`);
                }

                await new Promise(r => setTimeout(r, 300));

                logToOverlay(`2. Saadan kaardi värskenduse (jalusrefreshnew.php)...`);

                try {
                    const res2 = await fetch('/jalusrefreshnew.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    });
                    const htmlText = await res2.text();
                    logToOverlay(`-> Refresh kood: ${res2.status} (pikkus: ${htmlText.length} baiti)`);

                    if (typeof window.jalusrefresh === 'function') {
                        window.jalusrefresh();
                        logToOverlay(`-> Kutsusin välja window.jalusrefresh()`);
                    }
                } catch(e) {
                    logToOverlay(`-> Refresh viga: ${e.message}`);
                }

            } else {
                logToOverlay('Kaardilt ei leitud ühtegi Plaatina nuppu!');
            }
        });

        document.getElementById('bot-toggle-btn').addEventListener('click', () => {
            isPaused = !isPaused;
            localStorage.setItem('mine_bot_paused', isPaused);
            const btn = document.getElementById('bot-toggle-btn');
            if (isPaused) {
                btn.innerText = 'Jätka';
                btn.style.background = '#44ff44';
                btn.style.color = '#000';
            } else {
                btn.innerText = 'Paus';
                btn.style.background = '#ff4444';
                btn.style.color = '#fff';
            }
        });
    }

    function logToOverlay(msg) {
        createMiningOverlay();
        const logBox = document.getElementById('bot-log-box');
        if (logBox) {
            const time = new Date().toLocaleTimeString();
            logBox.innerHTML += `[${time}] ${msg}<br>`;
            logBox.scrollTop = logBox.scrollHeight;
            sessionStorage.setItem('bot_persistent_logs', logBox.innerHTML);
        }
    }

    // Käivitame kaevanduse loogika, kui asume kaevanduse lehel ja põhiskript on aktiivne
    const currentUrl = window.location.href;
    if (currentUrl.includes('asukoht=kaevandus') && localStorage.getItem('sulane_running') === 'true') {
        window.addEventListener('DOMContentLoaded', createMiningOverlay);
        window.addEventListener('load', createMiningOverlay);
    }
})();
