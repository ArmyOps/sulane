(function () {
    'use strict';

    function log(msg, isError = false) {
        if (typeof window.sulaneLogMessage === 'function') {
            window.sulaneLogMessage(`[Röövimine] ${msg}`, isError);
        }
    }

    const currentUrl = window.location.href;

    if (currentUrl.includes('asukoht=roovikoht')) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const isRunning = localStorage.getItem('sulane_running') === 'true';
                if (!isRunning) return;

                const urlParams = new URLSearchParams(window.location.search);
                const koht = urlParams.get('koht'); // prygikast, seif, kirst, hpseif, hpkirst

                // 1. Kontrollime lehelt, kas keegi teine on juba röövinud (element #kohttaeg)
                const kohtAegEl = document.getElementById('kohttaeg');
                const pageText = document.body.innerText.toLowerCase();
                let waitSeconds = 180; // Vaikimisi cooldown

                const timeMatch = (kohtAegEl ? kohtAegEl.innerText : pageText).match(/(\d+)\s*sekundi pärast/i);
                if (timeMatch) {
                    waitSeconds = parseInt(timeMatch[1], 10) + 3; // Lisame 3 sekundi puhveraja
                    log(`⏳ Kohal "${koht}" on juba rööv pooleli! Ootame ${waitSeconds} sekundit...`, true);
                    
                    if (koht) {
                        const expiryTime = Date.now() + waitSeconds * 1000;
                        localStorage.setItem(`sulane_roov_${koht}_expiry`, expiryTime);
                    }

                    // Suuname kohe tagasi põhiskilli juurde
                    setTimeout(() => {
                        const activeSkill = localStorage.getItem('sulane_primary_skill') || 'mets';
                        if (typeof window.sulaneReturnToLocation === 'function') {
                            window.sulaneReturnToLocation(activeSkill);
                        }
                    }, 500);
                    return;
                }

                // 2. Kui leht on vaba, otsime nuppu ja sooritame röövi
                const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));
                let targetBtn = null;

                for (const btn of buttons) {
                    const txt = (btn.textContent || btn.value || '').toLowerCase();
                    if (koht === 'prygikast' && txt.includes('prügikastist')) { targetBtn = btn; break; }
                    if (koht === 'seif' && txt.includes('seifist') && !txt.includes('härjapõlvlase')) { targetBtn = btn; break; }
                    if (koht === 'kirst' && txt.includes('kirstust') && !txt.includes('härjapõlvlase')) { targetBtn = btn; break; }
                    if (koht === 'hpseif' && txt.includes('härjapõlvlase seifist')) { targetBtn = btn; break; }
                    if (koht === 'hpkirst' && txt.includes('härjapõlvlase kirstust')) { targetBtn = btn; break; }
                }

                if (!targetBtn) {
                    targetBtn = document.getElementById('roovikoht') || buttons.find(el => (el.textContent || '').toLowerCase().includes('varasta'));
                }

                if (targetBtn) {
                    log(`🎯 Leitud röövimise nupp kohas "${koht}". Sooritan tegevuse...`);
                    targetBtn.click();

                    if (koht) {
                        const expiryTime = Date.now() + 180 * 1000;
                        localStorage.setItem(`sulane_roov_${koht}_expiry`, expiryTime);
                    }

                    setTimeout(() => {
                        const activeSkill = localStorage.getItem('sulane_primary_skill') || 'mets';
                        if (typeof window.sulaneReturnToLocation === 'function') {
                            window.sulaneReturnToLocation(activeSkill);
                        }
                    }, 1500);

                } else {
                    log(`⚠️ Röövimise nuppu ei leitud lehelt (koht: ${koht}).`, true);
                    setTimeout(() => {
                        const activeSkill = localStorage.getItem('sulane_primary_skill') || 'mets';
                        if (typeof window.sulaneReturnToLocation === 'function') {
                            window.sulaneReturnToLocation(activeSkill);
                        }
                    }, 2000);
                }
            }, 800);
        });
    }
})();
