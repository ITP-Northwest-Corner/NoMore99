// Const g = storage.local.get;
// const s = storage.local.set;

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

/***
 * @type {Object.<string, number>}
 */
const units = {DOLLARS: 1, ...browser.storage.local.get('units').units};

function convertBetween(quantity, from, to) {
	return (quantity * from) / to;
}

/***
 * @type {Object.<string, {applicable: (number) => boolean, convert: (number) => string}}
 */
const conversions = {
	pickAUnit: {
		applicable(_price) {
			return Object.keys(units)
				.some(name => !['DOLLARS', 'hours'].includes(name));
		},
		get convert() {
			const strangeUnits = Object.keys(units)
				.filter(name => !['DOLLARS', 'hours'].includes(name));
			const unit = strangeUnits[Math.floor(Math.random() * strangeUnits.length)];
			return price => {
				const converted = convertBetween(price, units.DOLLARS, units[unit]);
				if (Math.abs(converted % 1) < 0.2) {
					return `${Math.round(price)} ${unit}`;
				}

				return `${price} ${unit}`;
			};
		},
	},
	fallback: {
		applicable: _ => false,
		convert(price) {
			const cost = convertBetween(price, units.DOLLARS, units.hours || 20);
			const hours = Math.floor(cost);
			const minutes = Math.floor((cost * 60) - (hours * 60));
			if (Math.abs(convertBetween(price, units.DOLLARS, units.hours || 20) % 1) < 0.2) {
				return `${Math.round(hours)}`;
			}

			return `${hours}:${minutes}`;
		},
	},
};

function pickConvert(price) {
	const functions = Object
		.keys(conversions)
		.filter(name => conversions[name].applicable(price))
		.map(name => conversions[name].convert);

	if (functions.length === 0) {
		return conversions.fallback;
	}

	return functions[Math.floor(Math.random() * functions.length())];
}

/**
 * @type {Array<{node: Node, amount: number, convert: (number) => string}>}
 */
const ourNodes = [];
let timer = 250;

async function go(doTimer = true) {
	console.log('Running!');
	Object.assign(units, browser.storage.local.get('units').units);
	const found = findDollarAmounts(document, '\\$', 0.4);
	for (const {node, amount} of found) {
		const existing = ourNodes.some(({node: otherNode, amount: _, convert: __}) => node === otherNode);
		if (!existing) {
			ourNodes.push({node, amount, convert: pickConvert(amount)});
		}

		for (const child of Array.from(node.childNodes)) {
			child.remove();
		}
	}

	const {doReplace} = await browser.storage.local.get('doReplace');
	console.log(doReplace);
	for (const {node, amount, convert} of ourNodes) {
		node.textContent = doReplace
			? convert(amount)
			: `$${Math.floor(amount)}.${Math.floor((amount % 1) * 100)}`;
	}

	if (doTimer) {
		timer *= 2;
		timer = Math.min(6000, timer);
		window.setTimeout(go, timer);
		console.log(`Waiting ${timer}ms until next run`);
	}
}

// eslint-disable-next-line unicorn/prefer-top-level-await
go();

browser.runtime.onMessage.addListener((_message, _sender, _response) => {
	go(false);
});

browser.storage.local.onChanged.addListener(() => {
	go(false);
});
