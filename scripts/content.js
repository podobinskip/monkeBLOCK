var currentGrade;

// Since SSL Labs api can at times be unreliable, remove potentially malicious elements by default (if Remove malicious elements is enabled, ofc)
let removeElements;



chrome.storage.sync.get('removeElementsState', function (data) {
    if (data.removeElementsState === true) {
        removeElements = true;
    }
    //startCheckAndRemoval();
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("Received response in content script:", request);
    
    if (request.grade || currentGrade !== undefined){
        currentGrade = request.grade;
        console.log("GOT GRADE.");
        console.log("The grade of the current website is: " + currentGrade);
        if (['A+', 'A', 'A-'].includes(currentGrade)){
            console.log("Due to high grade, there will be no removing of elements.");
            //removeElements = false;
        }
        else{
            console.log("Grade is not high, out of precaution suspicious elements will be removed.");
            //removeElements = true;
            startCheckAndRemoval();
        }
    }
    else{
        console.log("Grade hasn't been obtained yet, out of precaution, just remove suspicious elements...");
        //removeElements = true;
        startCheckAndRemoval();
    }
});


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
};

function startCheckAndRemoval() {
    if (removeElements && !(['A+', 'A', 'A-'].includes(currentGrade))) {
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
}

