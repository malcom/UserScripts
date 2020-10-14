// ==UserScript==
// @name         YouTube Block Popups (SignIn/GDPR)
// @namespace    http://malcom.pl/
// @version      0.1.0
// @description  Dismiss annoying SignIn/GDPR popups and prevent from pausing the videos
// @author       Malcom <me@malcom.pl>
// @license      The MIT License; http://opensource.org/licenses/MIT
// @downloadURL  https://github.com/malcom/UserScripts/raw/master/youtube-block-popups.user.js
// @match        www.youtube.com/*
// @grant        none
// ==/UserScript==

(function () {
	'use strict';

	// disable SignIn popup / yt-upsell-dialog-renderer
	// based on https://github.com/uBlockOrigin/uAssets/issues/7842
	// btw this object is available only on first video material in
	// current browser session, so use in try-catch to avoid errors
	try {
		window.ytInitialPlayerResponse.auxiliaryUi.messageRenderers.upsellDialogRenderer.isVisible = false;
	} catch (e) {}

	// disable GDPR/cookie/privacy popup / ytd-consent-bump-renderer
	var mutationObserver = new MutationObserver(function (mutations) {

		let obj = document.querySelector('ytd-consent-bump-renderer');
		if (obj) {
			obj.handlePopupClose_ = function(){};
			this.disconnect();
		}
	});

	mutationObserver.observe(document.querySelector('ytd-app'), { childList: true });

})();