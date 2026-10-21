(function () {
    'use strict';

    function log(msg, isError = false) {
        if (typeof window.sulaneLogMessage === 'function') {
            window.sulaneLogMessage(`[Kaevandus] ${msg}`, isError);
        }
    }

    async function runMiningAutomation() {
        const isRunning = localStorage.getItem('sulane_running') === 'true';
        const primarySkill = localStorage.getItem('sulane_primary_skill') || 'mets';
        const targetOre = localStorage.getItem('sulane_selected_ore') || 'Plaatina';

        if (!isRunning || primarySkill !== 'kaevandus') return;

        const currentUrl = window.location.href;
        if (!currentUrl.includes('asukoht=kaevandus')) return;

        log(`Otsin kaardilt ressurssi: ${targetOre}...`);

        const buttons = document.querySelectorAll('button.maavaranupp');
        let targetRuut = null;

        for (const btn of buttons) {
            if (btn.getAttribute('maavara') === targetOre) {
                targetRuut = btn.getAttribute('ruutnr');
                break;
            }
        }

        if (targetRuut !== null) {
            log(`Leitud! Saadan korjamise päringu ruudule ${targetRuut}...`);

            try {
                const res1 = await fetch(`/10xpickupmaavara.php?ruutnr=${targetRuut}&kaarttyyp=tavakaart`);
                log(`-> Pickup vastuse kood: ${res1.status}`);
            } catch (e) {
                log(`-> Pickup viga: ${e.message}`, true);
            }

            await new Promise(r => setTimeout(r, 300));

            log(`Saadan kaardi värskenduse (jalusrefreshnew.php)...`);

            try {
                const res2 = await fetch('/jalusrefreshnew.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                const htmlText = await res2.text();
                log(`-> Refresh kood: ${res2.status} (pikkus: ${htmlText.length} baiti)`);

                if (typeof window.jalusrefresh === 'function') {
                    window.jalusrefresh();
                    log(`-> Kutsuti välja window.jalusrefresh()`);
                }
            } catch (e) {
                log(`-> Refresh viga: ${e.message}`, true);
            }

        } else {
            log(`Kaardilt ei leitud ühtegi ${targetOre} nuppu! Ootame hetke...`);
        }
    }

    // Käivitame automaatse tsükli, kui asume kaevanduses ja bot on aktiivne
    window.addEventListener('load', () => {
        const currentUrl = window.location.href;
        if (currentUrl.includes('asukoht=kaevandus')) {
            log('Kaevanduse skript initsialiseeritud (Automaatrežiim).');
            setInterval(() => {
                runMiningAutomation();
            }, 2000); // Kontrollib ja kaevab iga 2 sekundi järel
        }
    });
})();
