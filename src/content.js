/**
 * Takes in a node, and returns the node's content as text.
 * @param {Node} node
 * @returns {string}
 */
function nodeText(node) {
	if (node.nodeName === 'script') {
		return '';
	}

	switch (node.nodeType) {
		case node.COMMENT_NODE: {
			return '';
		}

		case node.TEXT_NODE: {
			return node.textContent;
		}

		default: {
			return Array.from(node.childNodes).map(child => nodeText(child)).join('');
		}
	}
}

/**
 * Takes in a string, and returns a dollar amount, and the percentage of the node that was a dollar amount.
 * @param {Node} node
 * @param {string} currencySymbol
 * @returns {false | {"amount": number, "proportion": number}}
 */
function nodeDollarAmount(node, currencySymbol) {
	if (node.nodeName === 'script') {
		return false;
	}

	const text = nodeText(node);
	if (text.length > 20) {
		// Too long, we probably shouldn't replace it
		return false;
	}

	const regex = new RegExp(`${currencySymbol}[A-z]*\\s?(\\d+)(?:[\\.,](\\d{1,2}))?`, 'g');
	const matches = text.matchAll(regex);
	let unmatched = text.length;
	let output;
	for (const [matchedString, whole, decimal] of matches) {
		const newOutput = Number.parseFloat(`${whole}.${decimal || 0}`);
		unmatched -= matchedString.length;
		output = output || newOutput;
	}

	if (output === undefined) {
		return false;
	}

	return {
		proportion: 1 - (unmatched / text.length),
		amount: output,
	};
}

/**
 * Finds nodes with dollar proportions above the threshold and returns their dollar amounts
 * @param {Node} node
 * @param {string} currencySymbol
 * @param {number} threshold
 * @returns {Array<{node: Node, amount: number}>}
 */
function findDollarAmounts(node, currencySymbol, threshold) {
	const maybeCurrency = nodeDollarAmount(node, currencySymbol);
	if (maybeCurrency === false || maybeCurrency.proportion < threshold) {
		return Array.from(node.childNodes).flatMap(node => findDollarAmounts(node, currencySymbol, threshold));
	}

	const {amount} = maybeCurrency;
	return [{
		node,
		amount,
	}];
}

/**
 * @type {Array<{node: Node, amount: number}>}
 */
const ourNodes = [];
let timer = 250;

function go() {
	console.log('Running!');
	const found = findDollarAmounts(document, '\\$', 0.4);
	for (const {node, amount} of found) {
		for (const child of Array.from(node.childNodes)) {
			child.remove();
		}

		node.textContent = `${Math.floor(amount)}d ${Math.floor((amount % 1) * 100)}c`;
		ourNodes.push({node, amount});
	}

	timer *= 1.5;
	timer = Math.min(6000, timer);
	window.setTimeout(go, timer);
	console.log(`Waiting ${timer}ms until next run`);
}

go();
