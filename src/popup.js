/* eslint-disable no-await-in-loop */
const qs = s => document.querySelector(s);
const g = g => browser.storage.local.get(g).then(v => v[g]);

const DEFAULT_SETTINGS = {
	units: {hours: 1 / 20},
	doReplace: true,
};

function convertBetween(quantity, from, to) {
	return (quantity * to) / from;
}

// eslint-disable-next-line unicorn/prefer-top-level-await
browser.storage.local.get('units').then(units => {
	if (units === undefined) {
		browser.storage.local.set(DEFAULT_SETTINGS);
	}
});

qs('#rerun').addEventListener('click', async _event => {
	await pushToStorage();
	const query = await browser.tabs.query({currentWindow: true, active: true});
	console.log('Sending...');
	for (const tab of query) {
		console.log(tab.id);
		browser.tabs.sendMessage(tab.id, {});
	}
});

// eslint-disable-next-line unicorn/prefer-top-level-await
pullFromStorage();

async function pullFromStorage() {
	console.log('Loading menu state from storage');
	qs('#do_replace').checked = await g('doReplace');
	for (const element of document.querySelectorAll('.unit')) {
		const units = await g('units') || DEFAULT_SETTINGS.units;
		console.log(`Got units ${JSON.stringify(units)}`);
		const name = element.attributes['data-unit-name'].value;
		let amt = units[name] || 1;
		if (name === 'hours') {
			amt = 1 / amt;
		}

		element.value = amt;
	}
}

async function pushToStorage() {
	const doReplace = qs('#do_replace').checked;
	browser.storage.local.set({
		doReplace,
	});
	for (const element of document.querySelectorAll('.unit')) {
		let amt = Number.parseInt(element.value, 10);
		const name = element.attributes['data-unit-name'].value;
		if (name === 'hours') {
			amt = 1 / amt;
		}

		const units = await g('units') || DEFAULT_SETTINGS.units;
		units[name] = amt;
		browser.storage.local.set({units});
	}
}
