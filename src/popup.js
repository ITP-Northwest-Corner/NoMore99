const qs = s => document.querySelector(s);
const g = k => browser.storage.local.get(k);
// Const s = (k, v) => browser.storage.local.set(k, v);

qs('#rerun').addEventListener('click', async _event => {
	const query = await browser.tabs.query({currentWindow: true, active: true});
	for (const tab of query) {
		browser.tabs.sendMessage(tab.id, {});
	}
});

// Browser.storage.local.onChanged.addListener(pullFromStorage);

qs('#do_replace').addEventListener('change', pushToStorage);

// eslint-disable-next-line unicorn/prefer-top-level-await
pullFromStorage();

async function pullFromStorage() {
	qs('#do_replace').checked = await g('doReplace');
}

function pushToStorage() {
	browser.storage.local.set({
		doReplace: qs('#do_replace').checked,
	});
}
