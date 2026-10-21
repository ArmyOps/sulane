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

                // Otsime sobivat nuppu tekstijärgi, kuna ID on kõigil sama (#roovikoht)
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

                // Fallback: kui spetsiifilist ei leidnud, võta esimene vaba röövimise nupp
                if (!targetBtn) {
                    targetBtn = document.getElementById('roovikoht') || buttons.find(el => (el.textContent || '').toLowerCase().includes('varasta'));
                }

                if (targetBtn) {
                    log(`🎯 Leitud röövimise nupp kohas "${koht}". Sooritan tegevuse...`);
                    targetBtn.click();

                    // Seadistame 180 sekundi cooldowni localStorage'isse
                    if (koht) {
                        const expiryTime = Date.now() + 180 * 1000;
                        localStorage.setItem(`sulane_roov_${koht}_expiry`, expiryTime);
                    }

                    // Tagasipöördumine: kasutame põhiskripti globaalset tagasisuunamise funktsiooni
                    setTimeout(() => {
                        const activeSkill = localStorage.getItem('sulane_primary_skill') || 'mets';
                        if (typeof window.sulaneReturnToLocation === 'function') {
                            window.sulaneReturnToLocation(activeSkill);
                        } else {
                            // Fallback, kui globaalset funktsiooni pole
                            if (activeSkill === 'kaevandus') {
                                window.location.href = 'https://www.sulane.net/avaleht.php?asukoht=10xkaevandus';
                            } else if (activeSkill === 'sulatamine') {
                                window.location.href = 'https://www.sulane.net/avaleht.php?asukoht=sulatamine';
                            } else {
                                window.location.href = 'https://www.sulane.net/avaleht.php?asukoht=10xmets&metstype=mets';
                            }
                        }
                    }, 1500);

                } else {
                    log(`⚠️ Röövimise nuppu ei leitud lehelt (koht: ${koht}).`, true);
                    // Püüame ikka tagasi liikuda, et bot ei jääks kinni
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
