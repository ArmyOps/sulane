(function () {
    'use strict';

    function log(msg, isError = false) {
        if (typeof window.sulaneLogMessage === 'function') {
            window.sulaneLogMessage(`[Kaevandamine] ${msg}`, isError);
        }
    }

    let isProcessing = false;

    // Funktsioon riidekappi suunamiseks ja vajaliku tööriista märkimiseks
    function redirectToWardrobe() {
        const currentUrl = window.location.href;
        if (currentUrl.includes('asukoht=riided')) return;
        
        localStorage.setItem('sulane_missing_tool', 'kirka');
        log('⚠️ Kirka sai otsa! Suundume Riidekappi uut võtma...', true);
        window.location.href = 'https://www.sulane.net/avaleht.php?asukoht=riided';
    }

    async function runMiningAutomation() {
        // Parandatud: muudetud kandiline sulg ümmarguseks
        const isRunning = localStorage.getItem('sulane_running') === 'true';
        const primarySkill = localStorage.getItem('sulane_primary_skill') || 'mets';
        const targetOre = localStorage.getItem('sulane_selected_ore') || 'Plaatina';

        if (!isRunning || primarySkill !== 'kaevandus') return;

        const currentUrl = window.location.href;
        if (!currentUrl.includes('asukoht=10xkaevandus')) return;

        // Kontrollime kirka olemasolu lehe tekstist
        const pageText = document.body.innerText.toLowerCase();
        if (pageText.includes('sa ei kasuta hetkel kirkat') || pageText.includes('kirve saad kasutusele võtta')) {
            redirectToWardrobe();
            return;
        }

        if (isProcessing) return;

        const autoClickCb = document.getElementById('autoClickerCheckBox');
        if (autoClickCb && !autoClickCb.checked) {
            autoClickCb.click();
            log('✅ Lülitasin Autoklikkeri märkeruudu sisse!');
        }

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

        if (targetRuut !== null) {
            isProcessing = true;
            log(`🎯 Leitud ${targetOre} ruudul ${targetRuut}! Korjan...`);

            try {
                const res1 = await fetch(`/10xpickupmaavara.php?ruutnr=${targetRuut}&kaarttyyp=tavakaart`);
                log(`-> Pickup vastuse kood: ${res1.status}`);
            } catch (e) {
                log(`-> Pickup viga: ${e.message}`, true);
            }

            await new Promise(r => setTimeout(r, 400));
            triggerOtsiKaart();

            setTimeout(() => {
                isProcessing = false;
            }, 1500);

        } else {
            log(`Soovitud ressurssi (${targetOre}) kaardil pole. Otsin uut kaarti...`);
            isProcessing = true;
            triggerOtsiKaart();

            setTimeout(() => {
                isProcessing = false;
            }, 1500);
        }
    }

    function triggerOtsiKaart() {
        $.ajax({
            data: 'type=tava',
            url: '10xkaevanduskaartotsi852.php',
            method: 'GET',
            success: function () {
                $.ajax({
                    data: 'type=tava',
                    url: '10xkaevanduskaart852.php',
                    method: 'GET',
                    success: function (mapRes) {
                        const kaartSisu = document.getElementById('kaartsisu');
                        if (kaartSisu) {
                            kaartSisu.innerHTML = mapRes;
                            log('✅ Kaart uuendatud uute ruutudega!');
                        }
                    }
                });
            },
            error: function() {
                const otsiBtn = document.getElementById('otsimv');
                if (otsiBtn) {
                    otsiBtn.click();
                }
            }
        });
    }

    const currentUrl = window.location.href;
    if (currentUrl.includes('asukoht=10xkaevandus')) {
        log('Kaevanduse skript initsialiseeritud.');

        setInterval(() => {
            runMiningAutomation();
        }, 2000);

        setInterval(() => {
            const isRunning = localStorage.getItem('sulane_running') === 'true';
            const primarySkill = localStorage.getItem('sulane_primary_skill') || 'mets';
            if (!isRunning || primarySkill !== 'kaevandus') return;

            const pageText = document.body.innerText.toLowerCase();
            if (pageText.includes('sa ei kasuta hetkel kirkat') || pageText.includes('kirve saad kasutusele võtta')) {
                redirectToWardrobe();
            }
        }, 5000);
    }
})();
