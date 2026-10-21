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
        const primarySkill = localStorage.getItem('sulane_primary_skill'] || 'mets';
        const targetOre = localStorage.getItem('sulane_selected_ore') || 'Plaatina';

        if (!isRunning || primarySkill !== 'kaevandus' || isProcessing) return;

        const currentUrl = window.location.href;
        if (!currentUrl.includes('asukoht=10xkaevandus')) return;

        const buttons = document.querySelectorAll('button.maavaranupp, input.maavaranupp, [maavara]');
        
        if (!buttons || buttons.length === 0) {
            return;
        }

        let targetRuut = null;

        for (const btn of buttons) {
            const oreName = btn.getAttribute('data-maavara') || btn.getAttribute('maavara') || btn.textContent.trim();
            const ruutNr = btn.getAttribute('data-ruutnr') || btn.getAttribute('ruutnr');

            if (oreName && oreName.toLowerCase().includes(targetOre.toLowerCase())) {
                targetRuut = ruutNr;
                break;
            }
        }

        if (targetRuut !== null) {
            isProcessing = true;
            log(`🎯 Leitud ressurss (${targetOre}) ruudul ${targetRuut}! Korjan...`);

            try {
                const res1 = await fetch(`/10xpickupmaavara.php?ruutnr=${targetRuut}&kaarttyyp=tavakaart`);
                log(`-> Pickup vastus: ${res1.status}`);
            } catch (e) {
                log(`-> Pickup viga: ${e.message}`, true);
            }

            // Ootame hetke ja teeme lehele värskenduse või laeme lehe uuesti, et kaart uueneks
            await new Promise(r => setTimeout(r, 600));

            log(`Värskendan kaarti...`);
            
            // Proovime käivitada mängu sisemise kaardi uuenduse või laadime lehe uuesti, et vältida sama ruudi tagumist
            if (typeof window.jalusrefresh === 'function') {
                try {
                    window.jalusrefresh();
                } catch(err) {}
            }

            // Lühike paus ja vabastame luku, et järgmine kaevandamine saaks uue kaardiga alata
            setTimeout(() => {
                isProcessing = false;
            }, 2000);

        } else {
            // Kui soovitud ressurssi polnud, uuendame kaarti, et saada uus kaart/paigutus
            log(`Soovitud ressursi (${targetOre}) ruutu ei leitud. Värskendan kaarti...`);
            try {
                const res2 = await fetch('/jalusrefreshnew.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });
                if (typeof window.jalusrefresh === 'function') {
                    window.jalusrefresh();
                }
            } catch (e) {}
        }
    }

    const currentUrl = window.location.href;
    if (currentUrl.includes('asukoht=10xkaevandus')) {
        log('Kaevanduse skript initsialiseeritud ja töötab.');
        
        setInterval(() => {
            runMiningAutomation();
        }, 3000); // 3 sekundiline intervall annab serverile ja kaardile hingamisruumi
    }
})();
