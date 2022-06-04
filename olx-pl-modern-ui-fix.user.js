// ==UserScript==
// @name         OLX.pl Modern UI Fix
// @namespace    http://malcom.pl/
// @version      0.1.2
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

	function OnHeadReady(handler) {
		if (document.head) { handler(); return; }
		(new MutationObserver((mutations, observer) => {
			if (document.head) { handler(); observer.disconnect(); }
		})).observe(document, {childList: true, subtree: true});
	}

	const style = document.createElement('style');
	style.textContent = `
		body {
			zoom: 0.8 !important;
		}
		div[data-cy="l-card"] > a > div > div > div > div {
			display: block !important;
		}
		p[data-testid="ad-price"] {
			font-size: 20px;
			padding: 0;
			text-align: left !important;
			-webkit-box-pack: initial !important;
			-webkit-justify-content: initial !important;
			-ms-flex-pack: initial !important;
			justify-content: initial !important;
		}
	`;
	OnHeadReady(() => {
		document.head.appendChild(style);
	});

	let cssLinkFixed = false;

	function FixNextPrevLinks() {
		const links = document.getElementsByClassName('pageNextPrev');
		if (links.length != 2)
			return;

		if (!cssLinkFixed) {
			style.textContent += `
				.prev .pageNextPrev .omuif-link::before { content: ${getComputedStyle(links[0], ':before').getPropertyValue('content')} }
				.next .pageNextPrev .omuif-link::after { content: ${getComputedStyle(links[1], ':before').getPropertyValue('content')}; }
		`;
			cssLinkFixed = true;
		}

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