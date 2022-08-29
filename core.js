class FileView {
  constructor(record, org, repo, prId) {
    this.record = record || {};
    this.checksumToFileName = {};
    this.org = org;
    this.repo = repo;
    this.prId = prId;
  }

  init() {
    var allContent = this.getAllContent();
    for (const fileName in allContent) {
      // content is dynamically scraped from DOM
      let content = allContent[fileName];
      let checksum = this.checksum(content);

      if (this.record[fileName] == undefined) {
        this.record[fileName] = {};
        this.record[fileName]["checksum"] = checksum;
        this.record[fileName]["viewed"] = false;
        this.checksumToFileName[checksum] = fileName;
        continue;
      }

      if (this.record[fileName].checksum != checksum) {
        this.record[fileName]["viewed"] = false;
        this.record[fileName]["checksum"] = checksum;
        this.checksumToFileName[checksum] = fileName;
      } else {
        this.checksumToFileName[checksum] = fileName;
      }
    }

    this.injectCheckBox();
  }

  checksum(content) {
    var hash = 0,
      i,
      chr;
    if (content.length === 0) return hash;
    for (i = 0; i < content.length; i++) {
      chr = content.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  getAllContent() {
    const targets = document.querySelectorAll("[data-qa=pr-diff-file-styles]");
    const mem = {};
    for (var idx = 0; idx < targets.length; idx++) {
      let current = targets[idx];
      let fileName = current
        .getAttribute("aria-label")
        .replace("Diff of file ", "");
      let codeDiffs = current.querySelectorAll(".code-diff");
      let currentDiff = "";
      for (var innerIdx = 0; innerIdx < codeDiffs.length; innerIdx++) {
        currentDiff += codeDiffs[innerIdx].textContent;
      }
      mem[fileName] = currentDiff;
    }
    return mem;
  }

  injectCheckBox() {
    for (const fileName in this.record) {
      let sumifyFileName = this.record[fileName].checksum;
      if (
        document.querySelector(`#fileViewed-${sumifyFileName}`) != undefined
      ) {
        console.log(
          `UI for #fileViewed-${sumifyFileName} has been rendered. Skip.`
        );
        continue;
      }

      let targetDom = this.getDiffDomByFileName(fileName);
      if (targetDom == undefined) {
        continue;
      }

      let viewed = this.record[fileName].viewed;
      let template = `<div style="display: flex;">Viewed <input type="checkbox" id="fileViewed-${sumifyFileName}" ${
        viewed ? "checked" : ""
      } /></div>`;

      let uiNode = this.createDomNodeFromHtmlString(template);

      targetDom.appendChild(uiNode);

      this.changeStyleByViewed(targetDom, viewed);

      document
        .querySelector(`#fileViewed-${sumifyFileName}`)
        .addEventListener("click", (e) => {
          e.stopPropagation();
          let fileName = this.checksumToFileName[sumifyFileName];
          this.onCheckExec(fileName);
        });
    }
  }

  getDiffDomByFileName(fileName) {
    if (typeof window != "undefined") {
      let targetArticle = document.querySelector(
        `[aria-label='Diff of file ${fileName}']`
      );
      if (targetArticle == undefined) {
        return null;
      }

      return targetArticle.querySelector(`[data-qa=bk-file__header]`);
    }

    return null;
  }

  onCheckExec(fileName) {
    this.record[fileName].viewed = !this.record[fileName].viewed;
    let targetDom = this.getDiffDomByFileName(fileName);
    this.changeStyleByViewed(targetDom, this.record[fileName].viewed);
    this.saveToChromeSync();
  }

  changeStyleByViewed(dom, viewed) {
    if (viewed) {
      dom.style.backgroundColor = "#A5D6A7";
      return;
    }

    // Bitbucket default bgcolor
    dom.style.backgroundColor = "rgb(244, 245, 247)";
  }

  saveToChromeSync() {
    let storageKey = `${this.org}-${this.repo}-${this.prId}-file-viewed-status`;
    chrome.storage.sync.set({ [storageKey]: this.record }, function () {
      console.log(
        "current file viewed status has been saved to chrome storage."
      );
    });
  }

  clearChromeStorage() {
    chrome.storage.sync.clear();
    console.log("all file viewed status has been removed");
  }

  createDomNodeFromHtmlString(htmlString) {
    let tmp = document.createElement("div");
    tmp.innerHTML = htmlString.trim();
    return tmp.firstChild;
  }
}
