"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var FileView =
/*#__PURE__*/
function () {
  function FileView(record, org, repo, prId) {
    _classCallCheck(this, FileView);

    this.record = record || {};
    this.checksumToFileName = {};
    this.org = org;
    this.repo = repo;
    this.prId = prId;
  }

  _createClass(FileView, [{
    key: "init",
    value: function init() {
      var allContent = this.getAllContent();

      for (var fileName in allContent) {
        // content is dynamically scraped from DOM
        var content = allContent[fileName];
        var checksum = this.checksum(content);

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
  }, {
    key: "checksum",
    value: function checksum(content) {
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
  }, {
    key: "getAllContent",
    value: function getAllContent() {
      var targets = document.querySelectorAll("[data-qa=pr-diff-file-styles]");
      var mem = {};

      for (var idx = 0; idx < targets.length; idx++) {
        var current = targets[idx];
        var fileName = current.getAttribute("aria-label").replace("Diff of file ", "");
        var codeDiffs = current.querySelectorAll(".code-diff");
        var currentDiff = "";

        for (var innerIdx = 0; innerIdx < codeDiffs.length; innerIdx++) {
          currentDiff += codeDiffs[innerIdx].textContent;
        }

        mem[fileName] = currentDiff;
      }

      return mem;
    }
  }, {
    key: "injectCheckBox",
    value: function injectCheckBox() {
      var _this = this;

      var _loop = function _loop(fileName) {
        var sumifyFileName = _this.record[fileName].checksum;

        if (document.querySelector("#fileViewed-".concat(sumifyFileName)) != undefined) {
          console.log("UI for #fileViewed-".concat(sumifyFileName, " has been rendered. Skip."));
          return "continue";
        }

        var targetDom = _this.getDiffDomByFileName(fileName);

        if (targetDom == undefined) {
          return "continue";
        }

        var viewed = _this.record[fileName].viewed;
        var template = "<div>Viewed <input type=\"checkbox\" id=\"fileViewed-".concat(sumifyFileName, "\" ").concat(viewed ? "checked" : "", " /></div>");
        targetDom.innerHTML += template;

        _this.changeStyleByViewed(targetDom, viewed);

        document.querySelector("#fileViewed-".concat(sumifyFileName)).addEventListener("click", function (e) {
          e.stopPropagation();
          var fileName = _this.checksumToFileName[sumifyFileName];

          _this.onCheckExec(fileName);
        });
      };

      for (var fileName in this.record) {
        var _ret = _loop(fileName);

        if (_ret === "continue") continue;
      }
    }
  }, {
    key: "getDiffDomByFileName",
    value: function getDiffDomByFileName(fileName) {
      if (typeof window != "undefined") {
        var targetArticle = document.querySelector("[aria-label='Diff of file ".concat(fileName, "']"));

        if (targetArticle == undefined) {
          return null;
        }

        return targetArticle.querySelector("[data-qa=bk-file__header]");
      }

      return null;
    }
  }, {
    key: "onCheckExec",
    value: function onCheckExec(fileName) {
      this.record[fileName].viewed = !this.record[fileName].viewed;
      var targetDom = this.getDiffDomByFileName(fileName);
      this.changeStyleByViewed(targetDom, this.record[fileName].viewed);
      this.saveToChromeSync();
    }
  }, {
    key: "changeStyleByViewed",
    value: function changeStyleByViewed(dom, viewed) {
      if (viewed) {
        dom.style.backgroundColor = "#A5D6A7";
        return;
      } // Bitbucket default bgcolor


      dom.style.backgroundColor = "rgb(244, 245, 247)";
    }
  }, {
    key: "saveToChromeSync",
    value: function saveToChromeSync() {
      var storageKey = "".concat(this.org, "-").concat(this.repo, "-").concat(this.prId, "-file-viewed-status");
      chrome.storage.sync.set(_defineProperty({}, storageKey, this.record), function () {
        console.log("current file viewed status has been saved to chrome storage.");
      });
    }
  }, {
    key: "clearChromeStorage",
    value: function clearChromeStorage() {
      chrome.storage.sync.clear();
      console.log("all file viewed status has been remoed");
    }
  }]);

  return FileView;
}();