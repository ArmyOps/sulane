(function () {
    'use strict';

    function log(msg, isError = false) {
        if (typeof window.sulaneLogMessage === 'function') {
            window.sulaneLogMessage(`[Kaevandamine] ${msg}`, isError);
        }
    }

    let isProcessing = false;

    async function runMiningAutomation() {
        const isRunning = localStorage.getItem('sulane_running'] === 'true';
        const primarySkill = localStorage.getItem('sulane_primary_skill') || 'mets';
        const targetOre = localStorage.getItem('sulane_selected_ore') || 'Plaatina';

        if (!isRunning || primarySkill !== 'kaevandus' || isProcessing) return;

        const currentUrl = window.location.href;
        if (!currentUrl.includes('asukoht=10xkaevandus')) return;

        // 1. AUTOKLIKKERI LINNUKESE KONTROLL JA SISSALÜLITAMINE
        const autoClickCb = document.getElementById('autoClickerCheckBox');
        if (autoClickCb && !autoClickCb.checked) {
            autoClickCb.click();
            log('✅ Lülitasin Autoklikkeri märkeruudu sisse!');
        }

        // 2. MAAVARADE OTSIMINE KAARDILT
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

        // Kui leidsime soovitud ressursi
        if (targetRuut !== null) {
            isProcessing = true;
            log(`🎯 Leitud ${targetOre} ruudul ${targetRuut}! Korjan...`);

            try {
                // Kasutame mängu oma õiget kaardi tüüpi (tava)
                const res1 = await fetch(`/10xpickupmaavara.php?ruutnr=${targetRuut}&kaarttyyp=tavakaart`);
                log(`-> Pickup vastuse kood: ${res1.status}`);
            } catch (e) {
                log(`-> Pickup viga: ${e.message}`, true);
            }

            await new Promise(r => setTimeout(r, 400));

            // Uuendame kaarti mängu sisemise AJAX päringuga
            triggerOtsiKaart();

            setTimeout(() => {
                isProcessing = false;
            }, 1500);

        } else {
            // Kui maavara pole, teeme uue kaardi otsingu AJAX päringu (nagu mäng ise teeb)
            log(`Soovitud ressurssi (${targetOre}) kaardil pole. Otsin uut kaarti...`);
            isProcessing = true;

            triggerOtsiKaart();

            setTimeout(() => {
                isProcessing = false;
            }, 1500);
        }
    }

    // MÄNGU OMA AJAX OTSINGU KUTSUMINE (10xkaevanduskaartotsi852.php)
    async function triggerOtsiKaart() {
        try {
            log('🔍 Saadan uue kaardi otsingu päringu...');
            const res = await $.ajax({
                data: 'type=tava',
                url: '10xkaevanduskaartotsi852.php',
                method: 'GET'
            });

            // Värskendame kaardi sisu
            const mapRes = await $.ajax({
                data: 'type=tava',
                url: '10xkaevanduskaart852.php',
                method: 'GET'
            });

            const kaartSisu = document.getElementById('kaartsisu');
            if (kaartSisu) {
                kaartSisu.innerHTML = mapRes;
                log('✅ Kaart edukalt uuendatud!');
            }
        } catch (e) {
            log(`Kaardi otsingu viga: ${e.message}`, true);
            // Tagavaralahendus: kui AJAX ebaõnnestub, klõpsame nuppu otse
            const otsiBtn = document.getElementById('otsimv');
            if (otsiBtn) otsiBtn.click();
        }
    }

    const currentUrl = window.location.href;
    if (currentUrl.includes('asukoht=10xkaevandus')) {
        log('Kaevanduse skript initsialiseeritud (Täpne lähtekoodi tugi).');

        setInterval(() => {
            runMiningAutomation();
        }, 2000);
    }
})();
