// ==UserScript==
// @name         Allegro Seller Info
// @namespace    http://malcom.pl/
// @version      0.1.11
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
				${tagName} > span.rating { font-weight: bold; }
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

				// jesli uzytkownik ma za malo ocen to rating nie jest dostepny
				var rating = item.seller.positiveFeedbackPercent != undefined ? item.seller.positiveFeedbackPercent + '%' : '---';

				node = node.children[0].children[0].children[1].children[0];
				node.style.position = 'relative';

				node.insertAdjacentHTML('beforeend', `
					<${tagName}>
						<span class="seller"><a href="${item.seller.userListingUrl}">${item.seller.login}</a></span>
						<span class="rating">${rating}</span>
						<span class="location">${item.location.city}</span>
					</${tagName}>
				`);

				// jesli sprzedawca 'brand'-owy to pierwsze dziecko zawiera logo i/lub nazwe sklepu
				// przenosimy do naszego kontenera, zeby wyswietlalo sie pod nasza wstawka...
				if (item.seller.brandzone)
					node.lastElementChild.appendChild(node.firstElementChild);

				// dla ofert z allegro.lokalnie wyswietlana jest lokalizacja
				// ktora usuwamy, bo nasza przeciez lepsza i bardziej spojna ;)
				if (item.vendor == 'allegro_lokalnie')
					node.parentElement.removeChild(node.parentElement.lastChild.previousElementSibling);

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
					line-height: 21px;
					margin-bottom: 8px;
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
			var node = document.getElementsByName('shippinginfoshow')[0].nextElementSibling;

			var loc;
			for (var e of node.getElementsByTagName('*')) {
				var m = e.innerText.match("^Wysy\u0142ka z: (.*)\n");
				if (m && m.length == 2) {
					var i = m[1].lastIndexOf(', Polska');
					loc = i != -1 ? m[1].substr(0, i) : m[1];
					break;
				}
			}
			if (!loc) return;

			// wstawiamy nad wierszem z wyszczegolnionymi info o dostawie
			// dlatego szukamy poprzednika pierwszego dziecka z border
			node = [...itemNode.children].filter(n => {
				return n.computedStyleMap().get('border-top-width').value != 0;
			})[0].previousElementSibling;

			// zaleznie od aukcji i jej stanu/konfiguracji, rozne komorki w layoucie
			// sa wypenione roznymi danymi, a ilosc wierszy i dzieci moze byc rozna

			// gdy wiersz pelny, dodajemy nowy
			if (node.childElementCount > 1) {
				node.insertAdjacentHTML('afterend', `<div class="${node.className}"></div>`);
				node = node.nextElementSibling;
			}

			// gdy wiersz pusty dodajemy pusty kontener jako pierwsza komorka
			if (node.childElementCount == 0) {
				node.insertAdjacentHTML('beforeend', `<div></div>`);
			}

			node.insertAdjacentHTML('beforeend', `<${tagName}><span>Lokalizacja:</span> ${loc}</${tagName}>`);
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
