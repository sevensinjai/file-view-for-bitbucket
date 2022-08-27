console.log("chrome extension is running....");
let currentPathname = window.location.pathname;
let splited = currentPathname.split("/");
let org = splited[1];
let repo = splited[2];
let prId = splited[4];
let storageKey = `${org}-${repo}-${prId}-file-viewed-status`;
console.log("storage key", storageKey);

chrome.storage.sync.get([storageKey], function (result) {
  console.log("chrome extension is getting storage...");
  let fileStatus = result[storageKey];

  fileViewer = new FileView(fileStatus, org, repo, prId);
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (!mutation.addedNodes) {
        return;
      }
      for (var i = 0; i < mutation.addedNodes.length; i++) {
        let currentMutation = mutation.addedNodes[i];
        if (currentMutation.attributes == undefined) {
          continue;
        }
        if (currentMutation.attributes["data-qa"] == undefined) {
          continue;
        }
        if (
          currentMutation.attributes["data-qa"].value != "pr-diff-file-styles"
        ) {
          continue;
        }
        fileViewer.init();
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
});
