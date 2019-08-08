// ==UserScript==
// @name         Allegro Seller Info
// @namespace    http://malcom.pl/
// @version      0.1.4
// @description  Show the seller's name and location on the offers lists and summary pages
// @author       Malcom <me@malcom.pl>
// @license      The MIT License; http://opensource.org/licenses/MIT
// @downloadURL  https://github.com/malcom/UserScripts/raw/master/allegro-seller-info.user.js
// @match        allegro.pl/*
// @grant        none
// ==/UserScript==

(function () {
	'use strict';

	function randomClassName() {
		return 'asi' + (+new Date).toString(36);
	}

	// strona z lista aukcji
	if (window.__listing_StoreState_base) {

		const cssName = randomClassName();
		document.body.insertAdjacentHTML('beforeend', `
			<style type="text/css">
				div.${cssName} { position: absolute; top: 0; right: 0; }
				div.${cssName} > span { display: block; text-align: right; }
				div.${cssName} > span.seller a { color: #00a790; text-decoration: none; }
				div.${cssName} > span.seller a: link { color: #00a790; }
				div.${cssName} > span.seller a: visited { color: #006456; }
				div.${cssName} > span.location { margin-bottom: 10px; }
			</style>
		`);

		const listNode = document.getElementsByClassName('opbox-listing--base')[0].firstElementChild;

		function UpdateList() {

			for (var node of listNode.getElementsByTagName('article')) {

				var item;
				for (var i in node) {
					if (i.startsWith('__reactEventHandlers')) {
						item = node[i].children.props.item;
						break;
					}
				}
				if (!item) return;

				node = node.children[0].children[0].children[1].children[0];
				node.style.position = 'relative';

				node.insertAdjacentHTML('beforeend', `
					<div class="${cssName}">
						<span class="seller"><a href="${item.seller.userListingUrl}">${item.seller.login}</a></span>
						<span class="location">${item.location}</span>
					</div>
				`);

				// jesli jest logo sklepu to przenies je do naszego kontenera,
				// zeby wyswietlalo sie pod nasza wstawka...
				if (node.firstElementChild.nodeName != 'H2')
					node.lastElementChild.appendChild(node.firstElementChild);

			}
		}

		// na czas aktualizacji/odswiezania listy, element 'listNode'
		// posiada dodatkowa klase stylow, wiec jej usuniecie jest
		// rownoznaczne z zakonczeniem operacji przebudowania listy
		// class: '_1e83564' -> '_1e83564 d101523' ->  '_1e83564'

		var mutationObserver = new MutationObserver(function (mutations) {
			var updEvt = mutations.findIndex(m => m.attributeName == 'class' && m.target.className.indexOf(' ') == -1) != -1;
			if (updEvt)
				UpdateList();
		});
		mutationObserver.observe(listNode, { attributes: true });

		UpdateList();
		return;
	}

	// strona z opisem aukcji
	if (window.__PROPS__ALLEGRO_SHOWOFFER_SUMMARY__) {

		const cssName = randomClassName();
		document.body.insertAdjacentHTML('beforeend', `
			<style type="text/css">
				div.${cssName} {
					font-size: 13px;
					color: #767676;
					margin-bottom: 8px;
					line-height: 21px;
				}
			</style>
		`);

		const itemNode = document.querySelector('div[itemprop="offers"]').parentElement;

		function UpdateOffer() {

			// pobierz lokalizacje z Opcji dostawy
			var node = document.getElementsByName('delivery')[0].nextElementSibling;

			var loc;
			for (var e of node.getElementsByTagName('*')) {
				if (e.innerText.startsWith('Wysy\u0142ka z:')) {
					var i = e.innerText.lastIndexOf(', Polska');
					loc = e.innerText.substr(10, i != -1 ? i - 10 : undefined).trim();
					break;
				}
			}
			if (!loc) return;

			// zaleznie od aukcji i jej stanu/konfiguracji, rozne komorki w layoucie
			// sa wypenione roznymi danymi, a ilosc wierszy i dzieci moze byc rozna,
			// dlatego szukam pierwszego dziecka z border i lapiemy jego poprzednika
			node = [...itemNode.children].filter(n => {
				return n.computedStyleMap().get('border-top-width').value != 0;
			})[0].previousElementSibling;

			// gdy wiersz jest pelny, dodajemy nowy
			if (node.childElementCount > 1) {
				node.insertAdjacentHTML('afterend', `<div class="${node.className}"></div>`);
				node = node.nextElementSibling;
			}

			// gdy wiersz pusty dodajemy pusty kontener jako pierwsza komorka
			if (node.childElementCount == 0) {
				node.insertAdjacentHTML('beforeend', `<div></div>`);
			}

			// a jako druga komorka leci nasza wstawka
			node.insertAdjacentHTML('beforeend', `<div class="${cssName}">Lokalizacja: ${loc}</div>`);
		}

		// informacje o aukcji bywaja odswiezane/przebudowane po zaladowaniu
		// strony przez co nasza wstawka moze zostac usunieta, wiec w razie
		// potrzeby ponawiamy aktualizacje danych o lokalizacji w aukcji

		var mutationObserver = new MutationObserver(function (mutations) {
			var delEvt = mutations.findIndex(m => m.removedNodes.length != 0) != -1;
			if (delEvt && itemNode.getElementsByClassName(cssName).length == 0)
				UpdateOffer();
		});
		mutationObserver.observe(itemNode, { childList: true, subtree: true });

		UpdateOffer();
		return;
	}

})();