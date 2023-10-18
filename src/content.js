/**
 * Takes in a node, and returns the node's content as text.
 * @param {Node} node
 * @returns {string}
 */
function to_text_visitor(node) {
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
	const text = to_text_visitor(node);
	const regex = new RegExp(`/${currency_symbol}\\w*\\s?(\\d+)(?:[\\.,](\\d{1,2}))?/`, 'g');
	const matches = text.matchAll(regex);
	let unmatched = text.length;
	let output = undefined;
	for (const [matched_str, index, input, groups] of matches) {
		const whole = groups[0];
		const decimal = groups.at(1) || "0";
		const new_output = Number.parseFloat(`${whole}.${decimal}`);
		if (new_output != output) {
			unmatched = text.length;
		}
		unmatched -= input.length;
		output = new_output;
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
	const maybe_currency = get_dollar_amount(node);
	if (!maybe_currency) {
		return Array.from(node.childNodes).flatMap((node) => dollar_search(node, currency_symbol, threshold))
	}
	const { amount, proportion } = maybe_currency;
	if (proportion < threshold) {
		return []
	}
	return [{
		node,
		amount,
	}]
}

console.log("Running!");
console.log(dollar_search(document, '$', 0.4))