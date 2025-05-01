// ==UserScript==
// @name         BlueSky Handle Cleaner
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Removes the ".bsky.social" part from handles visually while preserving functionality
// @author       mopolo
// @match        *.bsky.app*
// @match        *.bsky.dev*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // Function to process text nodes
    function processTextNode(node) {
        // Skip processing for nodes inside style or script tags
        if (node.parentNode && (node.parentNode.nodeName === 'STYLE' || node.parentNode.nodeName === 'SCRIPT')) {
            return;
        }

        const originalText = node.nodeValue;
        // Replace handles but keep a non-breaking space for clarity
        const newText = originalText.replace(/(@[\w-]+)\.bsky\.social/g, '$1\u00A0');
        if (originalText !== newText) {
            node.nodeValue = newText;
        }
    }

    // Process all existing text nodes
    function processExistingNodes() {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        textNodes.forEach(processTextNode);
    }

    // Set up a mutation observer to process any new nodes
    function observeDOMChanges() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                // Process added nodes
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    for (let i = 0; i < mutation.addedNodes.length; i++) {
                        const addedNode = mutation.addedNodes[i];
                        // Process text nodes directly
                        if (addedNode.nodeType === Node.TEXT_NODE) {
                            processTextNode(addedNode);
                        }
                        // Process text nodes within the added node
                        if (addedNode.nodeType === Node.ELEMENT_NODE) {
                            const walker = document.createTreeWalker(addedNode, NodeFilter.SHOW_TEXT, null, false);
                            let textNode;
                            while (textNode = walker.nextNode()) {
                                processTextNode(textNode);
                            }
                        }
                    }
                }
                // Process character data changes
                if (mutation.type === 'characterData') {
                    processTextNode(mutation.target);
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    // Run our functions when the page is loaded
    function init() {
        console.log('BlueSky Handle Cleaner: Script started');
        processExistingNodes();
        observeDOMChanges();
    }

    // If the document is already loaded, initialize the script
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 1000); // Small delay to make sure the page is fully loaded
    } else {
        // Otherwise wait for page to load
        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(init, 1000);
        });
    }
})();
