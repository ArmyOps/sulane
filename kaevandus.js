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

        // 1. Kontrollime ja paneme autoklikeri / linnukese peale, kui see on olemas
        const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
        const autoClickCb = document.getElementById('autoClickChecker') ||
            checkboxes.find(cb => cb.parentElement?.textContent?.toLowerCase().includes('autoklikk') || cb.id?.toLowerCase().includes('auto'));

        if (autoClickCb && !autoClickCb.checked) {
            autoClickCb.click();
            log('Lülitasin kaevanduses autokliki / linnukese sisse.');
        }

        // 2. Otsime kõiki kaevanduse nuppe
        const buttons = document.querySelectorAll('button.maavaranupp, input.maavaranupp, [maavara]');
        
        if (!buttons || buttons.length === 0) {
            log('⚠️ Hoiatus: Kaardilt ei leitud ühtegi maavara nuppu (klassiga .maavaranupp või atribuudiga maavara)!', true);
            return;
        }

        let foundOres = [];
        let targetRuut = null;

        buttons.forEach(btn => {
            const oreName = btn.getAttribute('data-maavara') || btn.getAttribute('maavara') || btn.textContent.trim();
            const ruutNr = btn.getAttribute('data-ruutnr') || btn.getAttribute('ruutnr');
            if (oreName) foundOres.push(`${oreName} (ruut: ${ruutNr || 'puudub'})`);

            if (oreName && oreName.toLowerCase().includes(targetOre.toLowerCase())) {
                targetRuut = ruutNr;
            }
        });

        // Logime korra leidudest, et näha debug aknas mis nuppudega tegemist on
        log(`Leitud maavarad kaardil: [ ${foundOres.join(', ')} ] | Otsitav: ${targetOre}`);

        if (targetRuut !== null) {
            log(`🎯 Leitud sihtressurss (${targetOre}) ruudul ${targetRuut}! Saadan korjamise päringu...`);

            try {
                const res1 = await fetch(`/10xpickupmaavara.php?ruutnr=${targetRuut}&kaarttyyp=tavakaart`);
                log(`-> Pickup vastuse kood: ${res1.status}`);
            } catch (e) {
                log(`-> Pickup viga: ${e.message}`, true);
            }

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
            log(`Kaardilt ei leitud täpset vastet ressursile "${targetOre}". Ootame uut tsüklit...`);
        }
    }

    const currentUrl = window.location.href;
    if (currentUrl.includes('asukoht=10xkaevandus')) {
        log('Kaevanduse skript initsialiseeritud ja alustab skannimist.');
        
        // Lülita debug logi automaatselt sisse, et näeksid kohe infot
        localStorage.setItem('sulane_debug_enabled', 'true');

        setInterval(() => {
            runMiningAutomation();
        }, 2000);
    }
})();
