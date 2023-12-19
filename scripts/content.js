let currentGrade;

chrome.runtime.sendMessage({ url: window.location.href }, function(response) {
    currentGrade = response.grade;
    console.log("The grade of the current website is: " + currentGrade);
	const checkAndRemoveIfMalicious = async (element) => {
		const style = getComputedStyle(element);
		const isFullSize =
			element.offsetWidth >= window.innerWidth && element.offsetHeight >= window.innerHeight;
		const isOffScreen =
			parseInt(style.left, 10) < -100 ||
			parseInt(style.top, 10) < -100 ||
			parseInt(style.bottom, 10) < -100 ||
			parseInt(style.right, 10) < -100;
		const zIndex = parseInt(style.zIndex, 10);
		const hasVeryHighZIndex = zIndex > 1000;
		const hasTrackerTypeField = element.getAttribute('trackertype') !== null;
	
		if ((isFullSize && hasVeryHighZIndex) || isOffScreen || hasTrackerTypeField) {
			if (currentGrade && ['A+', 'A', 'A-'].includes(currentGrade)) {
				console.log("Due to high grade, there will be no removing of elements.");
				return; 
			} else {
				console.log("Grade is not high, out of precaution suspicious elements will be removed.");
				const logDetails = {
					isFullSize,
					isOffScreen,
					hasVeryHighZIndex,
					hasTrackerTypeField,
					position: { left: style.left, top: style.top, bottom: style.bottom, right: style.right },
				};
	
				console.log('Detected a potentially malicious element:', element);
				console.log('Details:', logDetails);
	
				element.remove();
			}
		}
	};
	
	chrome.storage.sync.get('removeElementsState', function (data) {
		const removeElementsEnabled = data.removeElementsState === true;
	
		if (removeElementsEnabled) {
			console.log('Remove elements is ENABLED.');
	
			document.querySelectorAll('*').forEach(checkAndRemoveIfMalicious);
	
			const config = { attributes: true, childList: true, subtree: true };
	
			const callback = (mutationList, observer) => {
				for (const mutation of mutationList) {
					if (mutation.type === 'childList') {
						mutation.addedNodes.forEach((addedNode) => {
							if (addedNode instanceof Element) {
								checkAndRemoveIfMalicious(addedNode);
							}
						});
					}
				}
			};
	
			const observer = new MutationObserver(callback);
	
			observer.observe(document.body, config);
	
		} else {
			console.log('Remove elements is DISABLED.');
		}
	});
});

