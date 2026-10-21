(function () {
    'use strict';

    function log(msg, isError = false) {
        if (typeof window.sulaneLogMessage === 'function') {
            window.sulaneLogMessage(`[Kaevandamine] ${msg}`, isError);
        }
    }

    async function runMiningAutomation() {
        const isRunning = localStorage.getItem('sulane_running') === 'true';
        const primarySkill = localStorage.getItem('sulane_primary_skill') || 'mets';
        const targetOre = localStorage.getItem('sulane_selected_ore') || 'Plaatina';

        if (!isRunning || primarySkill !== 'kaevandus') return;

        const currentUrl = window.location.href;
        if (!currentUrl.includes('asukoht=10xkaevandus')) return;

        const buttons = document.querySelectorAll('button.maavaranupp');
        
        // Kui nuppe pole veel laetud, ootame järgmise tsüklini
        if (!buttons || buttons.length === 0) {
            return;
        }

        let targetRuut = null;

        for (const btn of buttons) {
            const oreName = btn.getAttribute('maavara');
            if (oreName && oreName.toLowerCase() === targetOre.toLowerCase()) {
                targetRuut = btn.getAttribute('ruutnr');
                break;
            }
        }

        if (targetRuut !== null) {
            log(`Leitud ressurss (${targetOre}) ruudul ${targetRuut}! Saadan korjamise päringu...`);

            try {
                const res1 = await fetch(`/10xpickupmaavara.php?ruutnr=${targetRuut}&kaarttyyp=tavakaart`);
                log(`-> Pickup vastuse kood: ${res1.status}`);
            } catch (e) {
                log(`-> Pickup viga: ${e.message}`, true);
            }

            // Väike viivitus enne kaardi uuendamist
            await new Promise(r => setTimeout(r, 400));

            log(`Saadan kaardi värskenduse (jalusrefreshnew.php)...`);

            try {
                const res2 = await fetch('/jalusrefreshnew.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                const htmlText = await res2.text();
                log(`-> Refresh kood: ${res2.status}`);

                if (typeof window.jalusrefresh === 'function') {
                    window.jalusrefresh();
                    log(`-> Kutsuti välja window.jalusrefresh()`);
                }
            } catch (e) {
                log(`-> Refresh viga: ${e.message}`, true);
            }

        } else {
            // Logime harvemini, et mitte debug logi üle koormata, kui ressurssi pole kohe saadaval
            log(`Kaardilt ei leitud hetkel soovitud ressurssi (${targetOre})! Otsin uuesti...`);
        }
    }

    // Käivitame kaevanduse kontrolli tsükli kohe, kui skript laetakse kaevanduse lehele
    const currentUrl = window.location.href;
    if (currentUrl.includes('asukoht=10xkaevandus')) {
        log('Kaevanduse skript initsialiseeritud ja alustab kaevandamist.');
        
        // Käivitame tsükli iga 1.5 sekundi järel
        setInterval(() => {
            runMiningAutomation();
        }, 1500);
    }
})();
