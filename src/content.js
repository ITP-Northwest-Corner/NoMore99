/**
 * Takes in a node, and returns the node's content as text.
 * @param {Node} node
 * @returns {string}
 */
function to_text_visitor(node) {
	if (node.nodeName === "script") {
		return "";
	}
	switch (node.nodeType) {
		case node.COMMENT_NODE:
			return "";
		case node.TEXT_NODE:
			return node.textContent;
		default:
			return Array.from(node.childNodes).map((child) => to_text_visitor(child)).join("");
	}
}

/**
 * Takes in a string, and returns a dollar amount, and the percentage of the node that was a dollar amount.
 * @param {Node} node
 * @param {string} currency_symbol
 * @returns {false | {"amount": number, "proportion": number}}
 */
function get_dollar_amount(node, currency_symbol) {
	if (node.nodeName === "script") {
		return false;
	}
	const text = to_text_visitor(node);
	if (text.length > 20) {
		// Too long, we probably shouldn't replace it
		return false;
	}
	const regex = new RegExp(`${currency_symbol}[A-z]*\\s?(\\d+)(?:[\\.,](\\d{1,2}))?`, 'g');
	const matches = text.matchAll(regex);
	let unmatched = text.length;
	let output = undefined;
	for (const [matched_str, whole, decimal] of matches) {
		const new_output = Number.parseFloat(`${whole}.${decimal || 0}`);
		unmatched -= matched_str.length;
		output = output || new_output;
	}

	if (output === undefined) {
		return false
	}

	return {
		proportion: 1 - (unmatched / text.length),
		amount: output
	}
}

/** 
 * Finds nodes with dollarnesses above the threshold and returns their dollar amounts
 * @param {Node} node
 * @param {string} currency_symbol
 * @param {number} threshold
 * @returns {Array<{node: Node, amount: number}>}
 */
function dollar_search(node, currency_symbol, threshold) {
	const maybe_currency = get_dollar_amount(node, currency_symbol);
	if (maybe_currency === false || maybe_currency.proportion < threshold) {
		return Array.from(node.childNodes).flatMap((node) => dollar_search(node, currency_symbol, threshold))
	}
	const { amount, proportion } = maybe_currency;
	return [{
		node,
		amount,
	}]
}

/**
 * @type {Array<{node: Node, amount: number}>}
 */
var our_nodes = [];
var timer = 250;

function go() {
	console.log("Running!");
	const found = dollar_search(document, '\\$', 0.4);
	for (const { node, amount } of found) {
		Array.from(node.childNodes).forEach((child) => node.removeChild(child));
		node.textContent = `${Math.floor(amount)}d ${Math.floor((amount % 1) * 100)}c`;
		our_nodes.push({ node, amount });
	}
	timer *= 1.5;
	timer = Math.min(6000.0, timer)
	window.setTimeout(go, timer)
	console.log(`Waiting ${timer}ms until next run`);
}

go()