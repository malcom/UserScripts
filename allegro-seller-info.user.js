// ==UserScript==
// @name         Allegro Seller Info
// @namespace    http://malcom.pl/
// @version      0.1.27
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
		return dom[Object.keys(dom).find(key => key.startsWith('__reactInternalInstance$'))]?.return;
	}

	function getPageSubtreeData(id, callback) {
		var req = new XMLHttpRequest();
		req.open('GET', location.pathname, true);
		req.setRequestHeader("Accept" , "application/vnd.opbox-web.subtree+json");
		req.setRequestHeader("x-box-id", id);
		req.onreadystatechange = function (evt) {
			if (req.readyState == 4 && req.status == 200)
				callback(id, JSON.parse(req.response));
		};
		req.send(null);
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
				${tagName} > span { display: block; text-align: right; }
				${tagName} > span.seller a { color: #00a790; text-decoration: none; }
				${tagName} > span.seller a: link { color: #00a790; }
				${tagName} > span.seller a: visited { color: #006456; }
				${tagName} > span.rating { font-weight: bold; }
			</style>
		`);

		const listNode = listing;

		function UpdateOffer(node) {

			// updated?
			if (node.getElementsByTagName(tagName).length != 0)
				return;

			// get item props
			var item = getReactInst(node)?.return?.pendingProps?.item;
			if (!item)
				return;

			// aukcje z allegro.lokalnie nie maja nazwy/url sprzedajacego tylko id
			var seller = item.seller.login ? `<a href="${item.seller.userListingUrl}">${item.seller.login}</a>` : item.seller.id;

			// jesli uzytkownik ma za malo ocen to rating nie jest dostepny
			var rating = item.seller.positiveFeedbackPercent ? item.seller.positiveFeedbackPercent + '%' : '---';

			// zdarzalo sie, ze city znikalo, ale w popover pozostawal sformatowany ciag w stylu "<dostawa z>: <city>"
			// wystepuja tez sytuacje ze w ofertach z allegro_loklanie w ogole nie ma location
			var location = 
				item.location?.city ||
				item.location?.popover?.text.match(/.*:\s*(.*)/)[1] ||
				''
			;

			// jesli element nie jest w pelni zbudowany to ignoruj
			node = node.children[0]?.children[1]?.children[0]?.children[0];
			if (!node)
				return;

			node.insertAdjacentHTML('afterbegin', `
				<${tagName}>
					<span class="seller">${seller}</span>
					<span class="rating">${rating}</span>
					<span class="location">${location}</span>
				</${tagName}>
			`);

			// jesli sprzedawca 'brand'-owy to pierwsze dziecko zawiera logo i/lub nazwe sklepu
			// przenosimy do naszego kontenera, zeby wyswietlalo sie pod nasza wstawka...
		//	if (item.seller.brandzone)
		//		node.firstElementChild.appendChild(node.children[1]);

			// dla ofert z allegro.lokalnie wyswietlana jest lokalizacja
			// ktora usuwamy, bo nasza przeciez lepsza i bardziej spojna ;)
		//	if (item.vendor == 'allegro_lokalnie')
		//		node.parentElement.removeChild(node.parentElement.lastChild.previousElementSibling);

		}

		// obserwuj zmiany na liscie ofert i uaktualniaj dodawane i modyfikowane elementy
		var mutationObserver = new MutationObserver(function (mutations) {
			for (var mutation of mutations) {

				for (var node of mutation.addedNodes) {
					if (node.nodeName == 'ARTICLE')
						UpdateOffer(node);
				}

				var node = mutation.target;
				if (node.nodeName == 'ARTICLE')
					UpdateOffer(node);

			}
		});
		mutationObserver.observe(listNode, { childList: true, subtree: true });

		// zaktualizuj obecne oferty na liscie, na wypadek gdyby powyzszy
		// MutationObserver zostal uruchomiony juz po zmianach...

		// zdarza sie ze czasem dane 'bazowe' nie sa jeszcze dostepne, dlatego
		// sprawdzamy co 100ms czy 'opbox' nie dodal juz reactowych smieci
		function UpdateListBase() {
			if (listing._reactRootContainer) {
				for (var node of listNode.getElementsByTagName('article'))
					UpdateOffer(node);
				return;
			}
			setTimeout(UpdateListBase, 100);
		}

		UpdateListBase();
		return;
	}

	// strona z opisem aukcji
	const offers = document.querySelector('div[itemprop="offers"]');
	if (offers) {

		const tagName = randomName();

		const itemNode = offers.parentElement;
		var processing = 0;

		function UpdateOffer() {

			processing = 1;
			var node = document.getElementsByName('shippinginfoshowspinner')[0].parentElement;
			var id = node.getAttribute("data-placeholder-for");

			getPageSubtreeData(id, (id, data) => {

				var item = data.assets.scripts.find(m => m.code.search("offerLocation") != -1);
				item = JSON.parse(item.code);
				var loc = item.offerLocation;
				if (loc.endsWith(', Polska'))
					loc = loc.substr(0, loc.length - 8);

				// wstawiamy nad tytulem aukcji w sasiedztwie atrybutu 'Stan"
				var node = offers.nextElementSibling.firstElementChild;

				// lapiemy style z atrybutu 'Stan'
				var pcls = node.querySelector('p').className;
				var scls = node.querySelector('span').className;

				node.style.justifyContent = 'space-between';
				node.insertAdjacentHTML('beforeend', `
					<${tagName}><p class="${pcls}">
						Lokalizacja: <span class="${scls}">${loc}</span>
					</p></${tagName}>
				`);
				processing = 0;
			});
		}

		// informacje o aukcji bywaja odswiezane/przebudowane po zaladowaniu
		// strony przez co nasza wstawka moze zostac usunieta, wiec w razie
		// potrzeby ponawiamy aktualizacje danych o lokalizacji w aukcji

		var mutationObserver = new MutationObserver(function (mutations) {
			var delEvt = mutations.findIndex(m => m.removedNodes.length != 0) != -1;
			if (delEvt && itemNode.getElementsByTagName(tagName).length == 0 && processing == 0)
				UpdateOffer();
		});
		mutationObserver.observe(itemNode, { childList: true, subtree: true });

		UpdateOffer();
		return;
	}

})();
