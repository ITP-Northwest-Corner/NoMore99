document.querySelector('#rerun').addEventListener('click', async _event => {
	const {id} = browser.tabs.getCurrent();
	if (!id) {
		return;
	}

	await browser.tabs.sendMessage(id, {});
});
