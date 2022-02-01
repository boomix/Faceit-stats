chrome.runtime.onMessage.addListener(
    function(url, sender, onSuccess) {
        fetch(url)
            .then(response => response.json())
            .then(responseJson => onSuccess(responseJson.payload ?? responseJson))
        
        return true;  // Will respond asynchronously.
    }
);