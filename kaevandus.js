(function () {
    'use strict';

    function log(msg, isError = false) {
        if (typeof window.sulaneLogMessage === 'function') {
            window.sulaneLogMessage(`[Kaevandamine] ${msg}`, isError);
        } else {
            console.log(`[Kaevandamine] ${msg}`);
        }
    }

    let isProcessing = false;

    function runMiningAutomation() {
        const isRunning = localStorage.getItem('sulane_running') === 'true';
        const primarySkill = localStorage.getItem('sulane_primary_skill') || 'mets';
        const targetOre = localStorage.getItem('sulane_selected_ore') || 'Plaatina';

        if (!isRunning || primarySkill !== 'kaevandus' || isProcessing) return;

        const currentUrl = window.location.href;
        if (!currentUrl.includes('asukoht=10xkaevandus')) return;

        // 1. OOTAME JA KONTROLLIME AUTOKLIKKERIT
        const autoClickCb = document.getElementById('autoClickerCheckBox');
        if (autoClickCb) {
            if (!autoClickCb.checked) {
                autoClickCb.click();
                log('✅ Autoklikkeri märkeruut leitud ja lülitati sisse!');
            }
        } else {
            // Elementi pole veel laetud, ootame järgmise tsüklini
            return;
        }

        // 2. OTSIME MAAVARASID KAARDILT
        const buttons = document.querySelectorAll('button.maavaranupp');
        if (!buttons || buttons.length === 0) {
            // Kaarti pole veel laetud, proovime otsida uut kaarti
            return;
        }

        let targetRuut = null;
        for (const btn of buttons) {
            const oreName = btn.getAttribute('maavara');
            const ruutNr = btn.getAttribute('ruutnr');

            if (oreName && oreName.toLowerCase().includes(targetOre.toLowerCase())) {
                targetRuut = ruutNr;
                break;
            }
        }

        // Kui leidsime soovitud ressursi
        if (targetRuut !== null) {
            isProcessing = true;
            log(`🎯 Leitud ${targetOre} ruudul ${targetRuut}! Korjan...`);

            $.ajax({
                url: `/10xpickupmaavara.php?ruutnr=${targetRuut}&kaarttyyp=tavakaart`,
                method: 'GET',
                success: function (msg) {
                    log('-> Pickup edukas, uuendan kaarti...');
                    triggerOtsiKaart();
                },
                error: function (err) {
                    log('-> Pickup viga, proovin uuesti...', true);
                },
                complete: function() {
                    setTimeout(() => {
                        isProcessing = false;
                    }, 1500);
                }
            });

        } else {
            // Kui soovitud ressurssi polnud, otsime uut kaarti
            log(`Soovitud ressurssi (${targetOre}) kaardil pole. Otsin uut kaarti...`);
            isProcessing = true;

            triggerOtsiKaart();

            setTimeout(() => {
                isProcessing = false;
            }, 1500);
        }
    }

    // KAARDI VÄRSKENDAMINE MÄGUS SISEMISE AJAX KUTSUGA
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
                // Tagavaralahendus: kui AJAX ei toimi, klikime otse nupule
                const otsiBtn = document.getElementById('otsimv');
                if (otsiBtn) {
                    otsiBtn.click();
                    log('🔍 Klikitud otsi nupule tagavarameetodiga.');
                }
            }
        });
    }

    // Käivitame kontrolli kohe, kui leht on avatud, ja hoiame seda töös intervalliga
    const currentUrl = window.location.href;
    if (currentUrl.includes('asukoht=10xkaevandus')) {
        log('Kaevanduse skript initsialiseeritud (Ootab elementide laadimist).');

        // Kontrollime iga 1,5 sekundi järel ega elemendid pole tekkinud ja kas saab kaevata
        setInterval(() => {
            runMiningAutomation();
        }, 1500);
    }
})();
