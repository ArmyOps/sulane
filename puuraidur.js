// ==UserScript==
// @name         Sulane Bot Abifunktsioonid ja Logistika (SB)
// @version      1.0.0
// @description  Metsa automaatika, raiumine, autoklikker ja kirve oleku kontroll
// ==/UserScript==

(function() {
    'use strict';

    window.SulaneBotLogic = {
        // Suunab mängija metsa, kui ta pole seal
        redirectToMets() {
            const currentUrl = window.location.href;
            if (!currentUrl.includes('asukoht=10xmets') && !currentUrl.includes('asukoht=metsvalik')) {
                console.log('[SB] Suundume metsa puid raiuma...');
                window.location.href = 'https://www.sulane.net/avaleht.php?asukoht=10xmets&metstype=mets';
            }
        },

        // Kontrollib, kas kirves on otsa saanud
        hasNoAxe() {
            const pageText = (document.body?.innerText || '').toLowerCase();
            return pageText.includes('sa ei kasuta hetkel kirvest') ||
                   pageText.includes('kirve saad kasutusele võtta') ||
                   pageText.includes('kirves puudub');
        },

        // Teostab puuraidumise tsükli metsa lehel
        runWoodcutting(customInterval = 50, onNoAxeCallback) {
            const pageText = (document.body?.innerText || '').toLowerCase();

            // 1. Kontrollime, kas kirves on otsas
            if (this.hasNoAxe()) {
                console.log('[SB] Kirves sai otsa!');
                if (typeof onNoAxeCallback === 'function') {
                    onNoAxeCallback();
                }
                return;
            }

            // 2. Otsime ja lülitame sisse autoklikkeri checkboxi, kui see pole märgitud
            const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
            const autoClickCb = document.getElementById('autoClickChecker') ||
                checkboxes.find(cb => cb.parentElement?.textContent?.toLowerCase().includes('autoklikk'));

            if (autoClickCb && !autoClickCb.checked) {
                autoClickCb.click();
                autoClickCb.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // 3. Otsime "Raiu" nupu ja klikime sellele
            const raiuBtn = document.getElementById('raiu') ||
                document.querySelector('.TenClickButton') ||
                Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'))
                    .find(el => (el.value || el.textContent || '').toLowerCase().includes('raiu'));

            if (raiuBtn) {
                raiuBtn.click();
            }
        }
    };
})();
