// ==UserScript==
// @name         OLX.pl Modern UI Fix
// @namespace    http://malcom.pl/
// @version      0.1.0
// @description  Make OLX.pl UI more readable ;)
// @author       Malcom <me@malcom.pl>
// @license      The MIT License; http://opensource.org/licenses/MIT
// @downloadURL  https://github.com/malcom/UserScripts/raw/master/olx-pl-modern-ui-fix.user.js
// @match        www.olx.pl/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
	'use strict';

	const style = document.createElement('style');
	style.textContent = `
		body {
			zoom: 0.8 !important;
		}
		.pageNextPrev::before,
		.pageNextPrev::after {
				display: none;
		}
		.omuif-link {
			display: inline-flex !important;
			letter-spacing: 2px;
			text-transform: uppercase;
			border-radius: 5px;
			padding: 5px;
			margin: 0 -5px;
		}
		.prev .pageNextPrev .omuif-link::before,
		.next .pageNextPrev .omuif-link::after {
			font-family: iconfont;
			font-size: 18px;
		}
		.prev .pageNextPrev .omuif-link::before { content: "\\E04E"; }
		.next .pageNextPrev .omuif-link::after { content: "\\E062"; }
		/* wylaczenie hovera, jesli nie ma poprzedniej/nastepnej strony */
		span.pageNextPrev:hover > * {
			color: initial;
			background-color: initial;
		}
		table.offers h3 {
			font-size: 22px !important;
		}
		table.offers .price {
			text-align: initial !important;
			font-size: 30px !important;
		}
		table.offers span {
			font-size: 15px !important;
		}
	`;
	document.head.appendChild(style);

	function FixNextPrevLinks() {
		const links = document.getElementsByClassName('pageNextPrev');
		if (links.length != 2)
			return;
		links[0].insertAdjacentHTML('beforeend', `<span class="omuif-link">poprzednia</span>`);
		links[1].insertAdjacentHTML('beforeend', `<span class="omuif-link">następna</span>`);
	}

	function FixListing() {

		for (const node of document.getElementsByClassName("photo-cell")) {

			// td: photo-cell title-cell td-price
			var title = node.nextElementSibling;
			var price = title.nextElementSibling;

			// move price div into title div
			var div = title.firstElementChild.appendChild(price.firstElementChild);
			div.removeAttribute('class');
			// minimalize td width
			price.setAttribute('width', 30);
		}
	}

	function FixUI() {
		FixListing();
		FixNextPrevLinks();
	}

	document.addEventListener('DOMContentLoaded', function() {

		// the #listContainer has class 'loaderActive' on loading new data
		var mutationObserver = new MutationObserver(function (mutations) {
			var updEvt = mutations.findIndex(m => m.attributeName == 'class' && m.target.className == '') != -1;
			if (updEvt)
				FixUI();
		});
		mutationObserver.observe(document.getElementById('listContainer'), { attributes: true });

		FixUI();
	});

})();