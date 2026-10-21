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

        // 1. AUTOKLIKKERI LINNUKESE LÜLITAMINE (ID: autoClickerCheckBox)
        const autoClickCb = document.getElementById('autoClickerCheckBox');
        if (autoClickCb && !autoClickCb.checked) {
            autoClickCb.click();
            log('✅ Lülitasin Autoklikkeri märkeruudu sisse!');
        }

        // 2. MAAVARADE OTSIMINE LEHELT
        const buttons = document.querySelectorAll('button.maavaranupp');
        let targetRuut = null;

        if (buttons && buttons.length > 0) {
            for (const btn of buttons) {
                const oreName = btn.getAttribute('maavara');
                const ruutNr = btn.getAttribute('ruutnr');

                if (oreName && oreName.toLowerCase().includes(targetOre.toLowerCase())) {
                    targetRuut = ruutNr;
                    break;
                }
            }
        }

        // Kui kaardilt leiti otsitav ressurss
        if (targetRuut !== null) {
            isProcessing = true;
            log(`🎯 Leitud ${targetOre} ruudul ${targetRuut}! Saadan korjamise päringu...`);

            try {
                const res1 = await fetch(`/10xpickupmaavara.php?ruutnr=${targetRuut}&kaarttyyp=tavakaart`);
                log(`-> Pickup vastuse kood: ${res1.status}`);
            } catch (e) {
                log(`-> Pickup viga: ${e.message}`, true);
            }

            await new Promise(r => setTimeout(r, 400));

            // Vajutame "Otsi" nuppu uue kaardi laadimiseks
            clickOtsiButton();

            setTimeout(() => {
                isProcessing = false;
            }, 1800);

        } else {
            // Kui kaardil pole soovitud maavara, klõpsame "Otsi" nuppu (ID: otsimv)
            log(`Soovitud ressurssi (${targetOre}) kaardil pole. Klõpsan "Otsi" nuppu...`);
            isProcessing = true;

            clickOtsiButton();

            setTimeout(() => {
                isProcessing = false;
            }, 1500);
        }
    }

    // TÄPNE "OTSI" NUPU (ID: otsimv) VAJUTAMINE
    function clickOtsiButton() {
        const otsiBtn = document.getElementById('otsimv');

        if (otsiBtn) {
            log('🔍 Klõpsasin nuppu "Otsi" (id="otsimv")!');
            otsiBtn.click();
        } else {
            log('⚠️ Nuppu "otsimv" ei leitud lehelt!', true);
            if (typeof window.jalusrefresh === 'function') {
                window.jalusrefresh();
            }
        }
    }

    const currentUrl = window.location.href;
    if (currentUrl.includes('asukoht=10xkaevandus')) {
        log('Kaevanduse skript laetud (Täpsed elementide ID-d seadistatud).');

        setInterval(() => {
            runMiningAutomation();
        }, 2000);
    }
})();
