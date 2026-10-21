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

        // 1. Kontrollime ja paneme autokliku / linnukese sisse, kui see on lehel olematu või tegemata
        const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
        const autoClickCb = document.getElementById('autoClickChecker') ||
            checkboxes.find(cb => {
                const labelText = cb.parentElement?.textContent?.toLowerCase() || '';
                return labelText.includes('autoklikk') || labelText.includes('auto') || cb.id.toLowerCase().includes('auto');
            });

        if (autoClickCb && !autoClickCb.checked) {
            autoClickCb.click();
            log('Lülitasin kaevanduses autokliki checkboxi sisse.');
        }

        // 2. Otsime maavara nuppe
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

        if (targetRuut !== null) {
            isProcessing = true;
            log(`🎯 Leitud ${targetOre} ruudul ${targetRuut}! Saadan korjamise päringu...`);

            try {
                const res1 = await fetch(`/10xpickupmaavara.php?ruutnr=${targetRuut}&kaarttyyp=tavakaart`);
                log(`-> Pickup vastus: ${res1.status}`);
            } catch (e) {
                log(`-> Pickup viga: ${e.message}`, true);
            }

            // Ootame natuke ja teeme täieliku kaardi uuendamise / uue kaardi otsingu
            await new Promise(r => setTimeout(r, 500));
            await fetchAndRefreshMap();

            setTimeout(() => {
                isProcessing = false;
            }, 2000);

        } else {
            // Kui soovitud maavara pole kaardil, otsime nuppu "Otsi uut kaarti" või uuendame kaarti
            log(`Soovitud ressurssi (${targetOre}) ei leitud. Otsin uut kaarti...`);
            await fetchAndRefreshMap();
        }
    }

    // Abifunktsioon uue kaardi fetchimiseks ja refreshimiseks
    async function fetchAndRefreshMap() {
        try {
            // Otsime lehelt nuppu, mis võib vastutada uue kaardi otsimise eest (nt "Otsi", "Uus kaart" vms)
            const actionButtons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));
            const otsiKaartiBtn = actionButtons.find(el => {
                const txt = (el.value || el.textContent || '').toLowerCase();
                return txt.includes('otsi') || txt.includes('kaart') || txt.includes('värskenda');
            });

            if (otsiKaartiBtn) {
                log('Klikin lehel leitud kaardi otsimise/värskendamise nuppu.');
                otsiKaartiBtn.click();
            } else {
                // Kui nuppu ei leia, teeme serveripoolse fetch refreshi
                const res = await fetch('/jalusrefreshnew.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });
                log(`-> Kaardi refresh fetch kood: ${res.status}`);
            }

            // Kui mängul on sisemine refresh funktsioon, käivitame selle samuti
            if (typeof window.jalusrefresh === 'function') {
                window.jalusrefresh();
            } else {
                // Kui funktsiooni pole, teeme lehele kiire automaatse soft-reload'i või laseme skriptil jätkata
                window.location.reload();
            }
        } catch (e) {
            log(`Kaardi uuendamise viga: ${e.message}`, true);
        }
    }

    const currentUrl = window.location.href;
    if (currentUrl.includes('asukoht=10xkaevandus')) {
        log('Kaevanduse skript initsialiseeritud koos autokliki ja kaardi värskendusega.');
        
        setInterval(() => {
            runMiningAutomation();
        }, 3000);
    }
})();
