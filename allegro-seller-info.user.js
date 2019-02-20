// ==UserScript==
// @name         Allegro Seller Info
// @namespace    http://malcom.pl/
// @version      0.0.9
// @description  Show the seller's name and location on the offers lists
// @author       Malcom <me@malcom.pl>
// @match        allegro.pl/*
// @grant        none
// ==/UserScript==

(function () {
	'use strict';

	if (!window.__listing_StoreState_base)
		return;

	const cssName = 'mX6tzke5';
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
		mutations.forEach(function (m) {
			if (m.attributeName == 'class' && m.target.className.indexOf(' ') == -1)
				UpdateList();
		});
	});
	mutationObserver.observe(listNode, { attributes: true });

	UpdateList();

})();