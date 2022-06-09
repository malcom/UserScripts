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
		a[data-testid="pagination-back"]:after {
		content: "poprzednia";
			display: inline-block;
			vertical-align: middle;
			height: 24px;
			padding-right: 10px;
		}
		a[data-testid="pagination-forward"]:before {
			content: "następna";
			display: inline-block;
			vertical-align: middle;
			height: 24px;
			padding-left: 10px;
		}
		a[data-testid="pagination-back"],
		a[data-testid="pagination-forward"] {
			text-decoration: none;
			color: #002F34;
			letter-spacing: 2px;
			text-transform: uppercase;
			border-radius: 5px;
			padding: 5px 0;
			margin: 0 5px;
		}
		a[data-testid="pagination-back"] > svg,
		a[data-testid="pagination-forward"] > svg {
			color: inherit !important;
		}
		a[data-testid="pagination-back"]:hover,
		a[data-testid="pagination-forward"]:hover {
			color: #fff;
			background-color: #002F34;
		}
	`;
	OnHeadReady(() => {
		document.head.appendChild(style);
	});

	function FixListing() {

		if (document.visibilityState !== 'visible')
			return;

		let preload = false;

		for (let e of document.querySelectorAll('[data-testid="listing-grid"]')) {
			if (!e.omuif) {
				preload = true;
				e.omuif = 1;
			}
		}

		if (!preload)
			return;

		// force preload images ;)
		let node = document.getElementsByClassName('listing-grid-container')[0];

		let sx = window.scrollX;
		let sy = window.scrollY;
		let style = node.style;

		window.scroll(0, 0);
		node.style.zoom = '0.1%';
		node.style.position = 'absolute';
		node.style.top = 0;

		setTimeout(() => {
			node.style = style;
			window.scroll(sx, sy);
		}, 500);

	}

	document.addEventListener('DOMContentLoaded', function() {
		let mutationObserver = new MutationObserver(FixListing);
		mutationObserver.observe(document.body, { childList: true, subtree: true });
		document.addEventListener("visibilitychange", FixListing);
		FixListing();
	});

})();