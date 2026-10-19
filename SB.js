// ==UserScript==
// @name         Sulane Levelite ja Efektide Haldur (SRH)
// @version      2.2.0
// @description  Ainult levelite, raha ja efektide taustakontrolli loop (5 sek)
// ==/UserScript==

(function() {
    'use strict';

    window.SulaneStatsManager = {
        // Tagastab konkreetse skilli leveli numbri
        getSkillLevel(skillNameKey) {
            const idMap = {
                'raidumine': 'raidumiselv',
                'varastamine': 'varastamiselv',
                'kalastamine': 'kalastamiselv',
                'kaevandamine': 'kaevandamiselv',
                'joogimeister': 'joogimeistrilv',
                'sulatamine': 'sulatamiselv',
                'ehitamine': 'ehitamiselv',
                'kasitoo': 'kasitoolv',
                'sepandus': 'sepanduslv',
                'aiandus': 'aianduselv',
                'kokandus': 'kokanduselv',
                'keemik': 'keemikulv',
                'juveliir': 'juveliirlv',
                'maagia': 'maagialv',
                'jahindus': 'jahinduslv',
                'loomakasvatus': 'loomakasvatuslv',
                'mehaanika': 'mehaanikalv',
                'total': 'totallv'
            };

            const elementId = idMap[skillNameKey.toLowerCase()];
            if (!elementId) return 1;

            const el = document.getElementById(elementId);
            if (el) {
                const val = parseInt(el.textContent.trim(), 10);
                return isNaN(val) ? 1 : val;
            }
            return 1;
        },

        // Tagastab mängija raha numbri kujul
        getMoney() {
            const rahaEl = document.getElementById('Raha');
            if (rahaEl) {
                const cleanStr = rahaEl.textContent.replace(/\s+/g, '');
                const val = parseInt(cleanStr, 10);
                return isNaN(val) ? 0 : val;
            }
            return 0;
        },

        // Loeb ja parsib efektide kasti teksti ning salvestab taimerid LocalStorage'isse
        parseEffectsAndStoreTimers(pageBodyText = '', pageUrl = '') {
            const efektDiv = document.getElementById('efekt');
            const efektText = efektDiv ? efektDiv.textContent.trim().toLowerCase() : '';
            const bodyText = (pageBodyText || document.body?.innerText || '').toLowerCase();
            const now = Date.now();

            // Kalastuse aeg
            const fishMatch = efektText.match(/kalal\s*veel\s*(\d+)\s*min.*?(\d+)\s*sek/i) ||
                efektText.match(/kalal.*?(\d+)\s*min/i);
            if (fishMatch) {
                const min = parseInt(fishMatch[1], 10) || 0;
                const sec = fishMatch[2] ? parseInt(fishMatch[2], 10) : 0;
                localStorage.setItem('sulane_fish_expiry', now + (min * 60 + sec + 3) * 1000);
            }

            // Vangla aeg
            const prisonMatch = efektText.match(/vangis\s*veel\s*(\d+)\s*min.*?(\d+)\s*sek/i) ||
                efektText.match(/vangis.*?(\d+)\s*min/i) ||
                bodyText.match(/karistuseks\s*(\d+)\s*sekundit\s*vangis/i);
            if (prisonMatch) {
                const min = prisonMatch[1] && bodyText.includes('min') ? parseInt(prisonMatch[1], 10) : 0;
                const sec = bodyText.includes('sekundit') ? parseInt(prisonMatch[1], 10) : (prisonMatch[2] ? parseInt(prisonMatch[2], 10) : 0);
                localStorage.setItem('sulane_prison_expiry', now + (min * 60 + sec + 3) * 1000);
            }

            // Röövide ajad (prügikast / seif)
            const kohtaegEl = document.getElementById('kohtaeg');
            const kohtaegText = kohtaegEl ? kohtaegEl.innerText.toLowerCase() : bodyText;

            const matchSec = kohtaegText.match(/(\d+)\s*sekundi\s*pärast/i);
            const matchMinSec = kohtaegText.match(/(\d+)\s*min.*?(\d+)\s*sek/i);

            let expiryTime = 0;
            if (matchSec) {
                const sec = parseInt(matchSec[1], 10) || 0;
                expiryTime = now + (sec + 3) * 1000;
            } else if (matchMinSec) {
                const min = parseInt(matchMinSec[1], 10) || 0;
                const sec = parseInt(matchMinSec[2], 10) || 0;
                expiryTime = now + (min * 60 + sec + 3) * 1000;
            }

            if (expiryTime > 0) {
                if (pageUrl.includes('koht=prygikast')) {
                    localStorage.setItem('sulane_prygikast_expiry', expiryTime);
                } else if (pageUrl.includes('koht=seif')) {
                    localStorage.setItem('sulane_seif_expiry', expiryTime);
                }
            }

            return {
                efektText,
                isFishing: this.isTimerActive('fish') || efektText.includes('kalal'),
                isPrison: this.isTimerActive('prison') || efektText.includes('vangis') || bodyText.includes('vangis veeta') || bodyText.includes('sekundit vangis'),
                isPrygikastCooldown: this.isTimerActive('prygikast') || (pageUrl.includes('koht=prygikast') && bodyText.includes('röövi sooritaja selgub')),
                isSeifCooldown: this.isTimerActive('seif') || (pageUrl.includes('koht=seif') && bodyText.includes('röövi sooritaja selgub'))
            };
        },

        isTimerActive(type) {
            const expiry = parseInt(localStorage.getItem(`sulane_${type}_expiry`) || '0', 10);
            return Boolean(expiry && Date.now() < expiry);
        },

        // Käivitab taustakontrolli loopi (vaikimisi iga 5 sekundi tagant)
        startBackgroundMonitor(callback, intervalMs = 5000) {
            setInterval(() => {
                const states = this.parseEffectsAndStoreTimers(document.body?.innerText || '', window.location.href);
                if (typeof callback === 'function') {
                    callback(states);
                }
            }, intervalMs);
        }
    };
})();
