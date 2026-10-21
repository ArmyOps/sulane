(function () {
    'use strict';

    function log(msg, isError = false) {
        if (typeof window.sulaneLogMessage === 'function') {
            window.sulaneLogMessage(`[Kaevandamine] ${msg}`, isError);
        }
    }

    let isProcessing = false;

    async function runMiningAutomation() {
        const isRunning = localStorage.getItem('sulane_running') === 'true';
        const primarySkill = localStorage.getItem('sulane_primary_skill') || 'mets';
        const targetOre = localStorage.getItem('sulane_selected_ore') || 'Plaatina';

        if (!isRunning || primarySkill !== 'kaevandus' || isProcessing) return;

        const currentUrl = window.location.href;
        if (!currentUrl.includes('asukoht=10xkaevandus')) return;

        // 1. TÄPNE AUTOKLIKKERI MÄRKERUUDU SISSALÜLITAMINE
        const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
        const autoClickCb = checkboxes.find(cb => {
            const parentText = (cb.parentElement?.textContent || '').toLowerCase();
            const labelText = (cb.nextSibling?.textContent || cb.previousSibling?.textContent || '').toLowerCase();
            return parentText.includes('autoklikker') || labelText.includes('autoklikker') || parentText.includes('autoklikk');
        });

        if (autoClickCb && !autoClickCb.checked) {
            autoClickCb.click();
            log('✅ Lülitasin Autoklikkeri märkeruudu sisse!');
        }

        // 2. MAAVARA RESSURSI OTSIMINE JA VAJUTAMINE
        const buttons = document.querySelectorAll('button.maavaranupp, input.maavaranupp, [maavara]');
        let targetRuut = null;

        if (buttons && buttons.length > 0) {
            for (const btn of buttons) {
                const oreName = btn.getAttribute('data-maavara') || btn.getAttribute('maavara') || btn.textContent.trim();
                const ruutNr = btn.getAttribute('data-ruutnr') || btn.getAttribute('ruutnr');

                if (oreName && oreName.toLowerCase().includes(targetOre.toLowerCase())) {
                    targetRuut = ruutNr;
                    break;
                }
            }
        }

        // Kui leidsime kaardilt soovitud ressursi
        if (targetRuut !== null) {
            isProcessing = true;
            log(`🎯 Leitud ressurss (${targetOre}) ruudul ${targetRuut}! Korjan...`);

            try {
                const res1 = await fetch(`/10xpickupmaavara.php?ruutnr=${targetRuut}&kaarttyyp=tavakaart`);
                log(`-> Pickup vastuse kood: ${res1.status}`);
            } catch (e) {
                log(`-> Pickup viga: ${e.message}`, true);
            }

            await new Promise(r => setTimeout(r, 400));

            // Pärast korjamist vajutame kindluse mõttes "Otsi" või värskendame kaarti
            clickOtsiButton();

            setTimeout(() => {
                isProcessing = false;
            }, 1800);

        } else {
            // Kui kaardil pole soovitud maavara, klikime "Otsi" nuppu!
            log(`Soovitud ressurssi (${targetOre}) kaardil pole. Klikin "Otsi" nuppu...`);
            isProcessing = true;
            
            clickOtsiButton();

            setTimeout(() => {
                isProcessing = false;
            }, 1500);
        }
    }

    // TÄPNE "OTSI" NUPU LEIDMINE JA KLIKKIMINE
    function clickOtsiButton() {
        const allButtons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));
        
        // Otsime nuppu, mille tekst või väärtus on täpselt "Otsi"
        const otsiBtn = allButtons.find(el => {
            const txt = (el.value || el.textContent || '').trim().toLowerCase();
            return txt === 'otsi';
        });

        if (otsiBtn) {
            log('🔍 Klikkisin nuppu "Otsi"!');
            otsiBtn.click();
        } else {
            log('⚠️ Nuppu "Otsi" ei leitud lehelt!', true);
            // Tagavaralahendus: kui nuppu ei leita, teeme fetch refreshi
            if (typeof window.jalusrefresh === 'function') {
                window.jalusrefresh();
            }
        }
    }

    const currentUrl = window.location.href;
    if (currentUrl.includes('asukoht=10xkaevandus')) {
        log('Kaevanduse skript laetud (Uuendatud "Otsi" nupu ja "Autoklikker" tuvastus).');
        
        setInterval(() => {
            runMiningAutomation();
        }, 2000);
    }
})();
