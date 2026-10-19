// ==UserScript==
// @name         Sulane Riidekapiriistade Haldur
// @version      1.0.0
// @description  Haldab automaatselt parima kirve, kirka ja kalapüügivahendi valimist ja peale panemist
// ==/UserScript==

(function() {
    'use strict';

    // Universaalne abimees varustuse vahetamiseks Riidekapis
    window.SulaneEquipmentManager = {
        // Kategooriad ja nende ID-d lehel
        categories: {
            kirves: { tabId: 'kirvednupp', containerId: 'kirved', btnText: 'Pane peale' },
            kirka: { tabId: 'kirkadnupp', containerId: 'kirkad', btnText: 'Pane peale' },
            kalastus: { tabId: 'ongednupp', containerId: 'kalapyygivahendid', btnText: 'Pane peale' }
        },

        // Peamine funktsioon parima eseme leidmiseks ja peale panemiseks
        equipBestItem(categoryKey) {
            const cat = this.categories[categoryKey];
            if (!cat) return false;

            const tab = document.getElementById(cat.tabId);
            const container = document.getElementById(cat.containerId);

            // Kui kategooria vaheleht on olemas, aga pole aktiivne, klikime sellele
            if (tab && (!container || container.style.display === 'none')) {
                tab.click();
            }

            // Ootame hetke DOM-i uuendumist ja otsime parimat eseme rida
            setTimeout(() => {
                const rows = document.querySelectorAll(`#${cat.containerId} tr, #${cat.containerId} tr#tablerida`);
                let bestRowToClick = null;

                // Käime read läbi alt üles (kuna tugevamad/paremad esemed on tabeli allosas)
                for (let i = rows.length - 1; i >= 0; i--) {
                    const row = rows[i];
                    const text = row.innerText.toLowerCase();

                    // Otsime nuppu "Pane peale"
                    const equipBtn = Array.from(row.querySelectorAll('button, input[type="submit"], input[type="button"]'))
                        .find(el => (el.value || el.textContent || '').trim().toLowerCase() === 'pane peale');

                    if (equipBtn) {
                        const tds = row.querySelectorAll('td');
                        if (tds.length >= 3) {
                            const kogus = parseInt(tds[2]?.textContent?.trim() || '0', 10);
                            const levelCell = tds[3];

                            // Kontrollime, kas level on piisav (ei sisalda "Väike level" ega punast värvi)
                            const isTooLow = levelCell && (
                                levelCell.textContent.toLowerCase().includes('väike level') || 
                                window.getComputedStyle(levelCell).color.includes('rgb(255')
                            );

                            // Kui kogus on olemas ja level on sobiv, siis see on parim kandidaat
                            if (kogus > 0 && !isTooLow) {
                                bestRowToClick = equipBtn;
                                break; // Leidsime tugevaima, väljume tsüklist
                            }
                        }
                    }
                }

                if (bestRowToClick) {
                    console.log(`[Riidekapiriistad] Leidsime parima eseme kategoorias [${categoryKey}], paneme peale!`);
                    bestRowToClick.click();
                } else {
                    console.log(`[Riidekapiriistad] Kategoorias [${categoryKey}] ei leitud uut sobivat eset, mida peale panna.`);
                }
            }, 600);
        }
    };
})();  
