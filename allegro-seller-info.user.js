// ==UserScript==
// @name         Allegro Seller Info
// @namespace    http://malcom.pl/
// @version      0.1.7
// @description  Show the seller's name and location on the offers lists and summary pages
// @author       Malcom <me@malcom.pl>
// @license      The MIT License; http://opensource.org/licenses/MIT
// @downloadURL  https://github.com/malcom/UserScripts/raw/master/allegro-seller-info.user.js
// @match        allegro.pl/*
// @grant        none
// ==/UserScript==

(function () {
	'use strict';

	function randomName() {
		return 'asi' + (+new Date).toString(36);
	}

	// strona z lista aukcji
	const listing = document.getElementById('opbox-listing--base');
	if (listing) {

		const tagName = randomName();
		document.body.insertAdjacentHTML('beforeend', `
			<style type="text/css">
				${tagName} { position: absolute; top: 0; right: 0; }
				${tagName} > span { display: block; text-align: right; }
				${tagName} > span.seller a { color: #00a790; text-decoration: none; }
				${tagName} > span.seller a: link { color: #00a790; }
				${tagName} > span.seller a: visited { color: #006456; }
				${tagName} > span.location { margin-bottom: 10px; }
			</style>
		`);

		const listNode = listing.firstElementChild;

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
					<${tagName}>
						<span class="seller"><a href="${item.seller.userListingUrl}">${item.seller.login}</a></span>
						<span class="location">${item.location.city}</span>
					</${tagName}>
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

		// zdarza sie ze czasem dane 'bazowe' nie sa jeszcze dostepne, dlatego
		// sprawdzamy co 100ms czy 'opbox' nie dodal juz reactowych smieci
		function UpdateListBase() {
			if (listing._reactRootContainer)
				UpdateList();
			else
				setTimeout(UpdateListBase, 100);
		}

		UpdateListBase();
		return;
	}

	// strona z opisem aukcji
	const offers = document.querySelector('div[itemprop="offers"]');
	if (offers) {

		const tagName = randomName();
		document.body.insertAdjacentHTML('beforeend', `
			<style type="text/css">
				${tagName} {
					font-size: 13px;
					line-height: 16px;
					float: right;
					margin-top: 12px;
					margin-bottom: 12px;
					color: #222;
				}
				${tagName} span {
					color: #767676;
				}
			</style>
		`);

		const itemNode = offers.parentElement;

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

			// wstawiamy w wiersz z wyszczegolnionymi info o dostawie
			// dlatego szukam pierwszego dziecka z border i wrzucamy do srodka
			node = [...itemNode.children].filter(n => {
				return n.computedStyleMap().get('border-top-width').value != 0;
			})[0];
			node.insertAdjacentHTML('afterbegin', `<${tagName}><span>Lokalizacja:</span> ${loc}</${tagName}>`);
		}

		// informacje o aukcji bywaja odswiezane/przebudowane po zaladowaniu
		// strony przez co nasza wstawka moze zostac usunieta, wiec w razie
		// potrzeby ponawiamy aktualizacje danych o lokalizacji w aukcji

		var mutationObserver = new MutationObserver(function (mutations) {
			var delEvt = mutations.findIndex(m => m.removedNodes.length != 0) != -1;
			if (delEvt && itemNode.getElementsByTagName(tagName).length == 0)
				UpdateOffer();
		});
		mutationObserver.observe(itemNode, { childList: true, subtree: true });

		UpdateOffer();
		return;
	}

})();