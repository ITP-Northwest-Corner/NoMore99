/* eslint-disable no-await-in-loop */
const qs = s => document.querySelector(s);
const g = k => browser.storage.local.get(k)[k];
// Const s = (k, v) => browser.storage.local.set(k, v);

const DEFAULT_SETTINGS = {
	units: {hours: 18},
	doReplace: true,
};

// eslint-disable-next-line unicorn/prefer-top-level-await
browser.storage.local.get('units').then(units => {
	if (units === undefined) {
		browser.storage.local.set(DEFAULT_SETTINGS);
	}
});

qs('#rerun').addEventListener('click', async _event => {
	const query = await browser.tabs.query({currentWindow: true, active: true});
	for (const tab of query) {
		browser.tabs.sendMessage(tab.id, {});
	}
});

qs('#do_replace, .unit').addEventListener('change', pushToStorage);

// eslint-disable-next-line unicorn/prefer-top-level-await
pullFromStorage();

async function pullFromStorage() {
	qs('#do_replace').checked = await g('doReplace');
	for (const element of document.querySelectorAll('.unit')) {
		const units = await g('units') || DEFAULT_SETTINGS.units;
		const name = element.attributes['data-unit-name'].value;
		let amt = units[name] || 1;
		if (name === 'hours') {
			amt = 1 / amt;
		}

		element.nodeValue = amt;
	}
}

function pushToStorage() {
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

		const units = g('units') || DEFAULT_SETTINGS.units;
		units[name] = amt;
		browser.storage.local.set({units});
	}
}
