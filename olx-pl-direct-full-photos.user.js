// ==UserScript==
// @name         OLX.pl Direct Full Photos
// @namespace    http://malcom.pl/
// @version      0.1.0
// @description  Directly open raw photos in full resolution on OLX.pl
// @author       Malcom <me@malcom.pl>
// @license      The MIT License; http://opensource.org/licenses/MIT
// @downloadURL  https://github.com/malcom/UserScripts/raw/master/olx-pl-direct-full-photos.user.js
// @match        www.olx.pl/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
	'use strict';

	function ImageClickHandler(e) {
		let path = e.srcElement.src.replace(/\/image;s=(\d+)x(\d+)/, "/image;s=9999x9999");
		window.open(path, "_blank");
		e.stopPropagation();
	}

	document.addEventListener("DOMContentLoaded", function() {
		let mutationObserver = new MutationObserver(() => {
			for (const img of document.querySelectorAll("div.swiper-zoom-container > img")) {
				if (!img.ich) {
					img.addEventListener('click', ImageClickHandler, true)
					img.ich = true;
				}
			}
		});
		mutationObserver.observe(document.body, { subtree: true, childList: true });
	});

})();