var accessControlRequestHeaders;
var exposedHeaders;

var requestListener = function(details){
	var flag = false,
		rule = {
			name: "Origin",
			value: "http://evil.com/"
		};
	var i;

	for (i = 0; i < details.requestHeaders.length; ++i) {
		if (details.requestHeaders[i].name.toLowerCase() === rule.name.toLowerCase()) {
			flag = true;
			details.requestHeaders[i].value = rule.value;
			break;
		}
	}
	if(!flag) details.requestHeaders.push(rule);
	
	for (i = 0; i < details.requestHeaders.length; ++i) {
		if (details.requestHeaders[i].name.toLowerCase() === "access-control-request-headers") {
			accessControlRequestHeaders = details.requestHeaders[i].value	
			// prepare for prelight request
		}
	}	
	
	return {requestHeaders: details.requestHeaders};
};

var responseListener = function(details){
	var flag = false,
	rule = {
			"name": "Access-Control-Allow-Origin",
			"value": "*"
		};

	for (var i = 0; i < details.responseHeaders.length; ++i) {
		if (details.responseHeaders[i].name.toLowerCase() === rule.name.toLowerCase()) {
			flag = true;
			details.responseHeaders[i].value = rule.value;
			break;
		}
	}
	if(!flag) details.responseHeaders.push(rule);
	// always add the header so that infinete can access any cross orign resource 

	if (accessControlRequestHeaders) {

		details.responseHeaders.push({"name": "Access-Control-Allow-Headers", "value": accessControlRequestHeaders});

	}

	if(exposedHeaders) {
		details.responseHeaders.push({"name": "Access-Control-Expose-Headers", "value": exposedHeaders});
	}

	details.responseHeaders.push({"name": "Access-Control-Allow-Methods", "value": "GET, PUT, POST, DELETE, HEAD, OPTIONS"});
	//allow prelight request if reuqest is prelight
	return {responseHeaders: details.responseHeaders};
	
};

/*On install*/
chrome.runtime.onInstalled.addListener(function(){
	chrome.storage.local.set({'active': true});
	chrome.storage.local.set({'urls': ["http://api.nsf.gov/services/*",
	 "http://api.elsevier.com/content/search/scopus*", "http://dblp.uni-trier.de/*", "http://patents.justia.com/*",
	 "http://api.elsevier.com/content/search/*", "https://scholar.google.com/*"]});
	chrome.storage.local.set({'exposedHeaders': ''});
	reload();
});

/*Reload settings*/
function reload() {
	chrome.storage.local.get({'active': true, 'urls': ["http://api.nsf.gov/services/*",
	 "http://api.elsevier.com/content/search/scopus*", "http://dblp.uni-trier.de/*", "http://patents.justia.com/*",
	 "http://api.elsevier.com/content/search/*", "https://scholar.google.com/*"], 'exposedHeaders': ''}, function(result) {

		exposedHeaders = result.exposedHeaders;

		/*Remove Listeners*/
		chrome.webRequest.onHeadersReceived.removeListener(responseListener);
		chrome.webRequest.onBeforeSendHeaders.removeListener(requestListener);

		if(result.active) {
			chrome.browserAction.setIcon({path: "on.png"});

			if(result.urls.length) {

				/*Add Listeners*/
				chrome.webRequest.onHeadersReceived.addListener(responseListener, {
					urls: result.urls
				},["blocking", "responseHeaders"]);
				//blocking means that the request is blocked until the callback function returns
				//header received effect finished --> callback listener function --> request response delivered
				// --> security check  ---> generated html and javascript 

				chrome.webRequest.onBeforeSendHeaders.addListener(requestListener, {
					urls: result.urls
				},["blocking", "requestHeaders"]);
			}
		} else {
			chrome.browserAction.setIcon({path: "off.png"});
		}
	});
}
