// ==UserScript==
// @name         Allegro Seller Info
// @namespace    http://malcom.pl/
// @version      0.1.15
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

	function getReactInst(dom) {
		var item = dom[Object.keys(dom).find(key => key.startsWith('__reactInternalInstance$'))];
		return item && item.return ? item.return : null;
	}

	// strona z lista aukcji
	const listing = Array.prototype.filter.call(
		document.getElementsByClassName('opbox-listing'),
		e => e.getElementsByTagName('article').length > 0
	).pop();

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

		function UpdateOffer(node) {

			// updated?
			if (node.getElementsByTagName(tagName).length != 0)
				return;

			// get item props
			var item = getReactInst(node);
			if (!item || !item.pendingProps || !item.pendingProps.item)
				return;
			item = item.pendingProps.item;

			// jesli uzytkownik ma za malo ocen to rating nie jest dostepny
			var rating = item.seller.positiveFeedbackPercent != undefined ? item.seller.positiveFeedbackPercent + '%' : '---';

			node = node.children[0].children[1].children[0];
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

		// obserwuj zmiany na liscie ofert i uaktualniaj dodawane nowe elementy
		var mutationObserver = new MutationObserver(function (mutations) {
			for (var mutation of mutations) {
				for (var node of mutation.addedNodes) {
					if (node.nodeName == 'ARTICLE')
						UpdateOffer(node);
				}
			}
		});
		mutationObserver.observe(listNode, { childList: true, subtree: true });

		// zaktualizuj obecne oferty na liscie, na wypadek gdyby powyzszy
		// MutationObserver zostal uruchomiony juz po zmianach...
		for (var node of listNode.getElementsByTagName('article'))
			UpdateOffer(node);

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
			var node = document.getElementsByClassName('opbox-showoffer-delivery')[0].firstElementChild;

			// get item props
			var item = getReactInst(node);
			if (!item || !item.pendingProps || !item.pendingProps.offerLocation)
				return;
			var loc = item.pendingProps.offerLocation;

			if (loc.endsWith(', Polska'))
				loc = loc.substr(0, loc.length - 8);

			// wstawiamy nad wierszem z wyszczegolnionymi info o dostawie
			// dlatego szukamy poprzednika diva zawierajacego pierwsza linie
			node = itemNode.getElementsByTagName('hr')[0].parentElement.previousElementSibling;

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
