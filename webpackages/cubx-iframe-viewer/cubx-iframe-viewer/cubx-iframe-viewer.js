(function () {
  'use strict';
  /**
   * Get help:
   * > Lifecycle callbacks:
   * https://www.polymer-project.org/1.0/docs/devguide/registering-elements.html#lifecycle-callbacks
   *
   * Access the Cubbles-Component-Model:
   * > Access slot values:
   * slot 'a': this.getA(); | this.setA(value)
   */
  CubxPolymer({
    is: 'cubx-iframe-viewer',

    /**
     * Manipulate an element’s local DOM when the element is created.
     */
    created: function () {
    },

    /**
     * Manipulate an element’s local DOM when the element is created and initialized.
     */
    ready: function () {
    },

    /**
     * Manipulate an element’s local DOM when the element is attached to the document.
     */
    attached: function () {
      this._updateIframeReferences();
    },

    /**
     * Manipulate an element’s local DOM when the cubbles framework is initialized and ready to work.
     */
    cubxReady: function () {
    },

    /**
     *  Observe the Cubbles-Component-Model: If value for slot 'webpackageId' has changed ...
     */
    modelArtifactInfoChanged: function (artifactInfo) {
      this.setArtifactId(artifactInfo.artifactId);
      this.setWebpackageId(artifactInfo.webpackageId);
      this._createAppendComponent();
    },

    /**
     * Update references to the iframe document and window to then interact with the iframe.
     * @private
     */
    _updateIframeReferences: function () {
      this._iframeWindow = this.$$('iframe').contentWindow;
      this._iframeDocument = this.$$('iframe').contentDocument || this._iframeWindow.document;
    },

    /**
     * Reload the iframe and call the 'afterLoadFunction' if it is defined
     * @param {function} [afterLoadFunction] - Function to be called when the iframe loads.
     * @private
     */
    _reloadIframe: function (afterLoadFunction) {
      this._iframeWindow.location.reload(true);
      this.$$('iframe').onload = function () {
        this._updateIframeReferences();
        if (afterLoadFunction) {
          afterLoadFunction();
        }
      }.bind(this);
    },

    /**
     * Create and append a script element
     * @param {Array} attributes - Attributes to be set to the script element
     * @param {function} cb - Callback function to be called when script has loaded
     * @returns {Element} Created script element
     */
    _createAppendScriptElement: function (attributes, cb) {
      var scriptElement = document.createElement('script');
      if (attributes) {
        for (var at in attributes) {
          scriptElement.setAttribute(at, attributes[at]);
        }
      }
      if (cb) {
        scriptElement.onload = function () {
          cb.call(this);
        }.bind(this);
      }
      scriptElement.async = false;
      scriptElement.type = 'text/javascript';
      this._iframeDocument.head.appendChild(scriptElement);
      return scriptElement;
    },

    /**
     * Inject the crcLoader and webcomponents-lite scripts to the head
     * @param {function} [onLoadCrc] - Function to be called after main script loads
     * @param {function} [onLoadWebcomponents] - Function to be called after webcomponents-lite
     * loads
     */
    _injectHeadScripts: function (onLoadCrc, onLoadWebcomponents) {
      var rteUrl = 'https://cubbles.world/sandbox/cubx.core.rte@2.3.1';
      this._createAppendScriptElement(
        {
          'src': rteUrl + '/webcomponents-lite/webcomponents-lite.js'
        },
        onLoadWebcomponents
      );
      this._createAppendScriptElement(
        {
          'src': rteUrl + '/crc-loader/js/main.js',
          'data-crcinit-loadcif': 'true',
          'data-cubx-startevent': 'componentAppend'
        },
        onLoadCrc
      );
    },

    /**
     * Create and append the associated html element for a component
     */
    _createAppendComponent: function () {
      if (this._validComponentIds()) {
        this._reloadIframe(function () {
          this._initRootDependenciesArray();
          this._addRootDependency(
            {
              artifactId: this.getArtifactInfo().artifactId,
              webpackageId: this.getArtifactInfo().webpackageId
            }
          );
          var component = this._iframeDocument.createElement(this.getArtifactInfo().artifactId);
          if (this.getInits()) {
            component.appendChild(this._createCoreInitElement(this.getInits()));
          }
          this._injectHeadScripts(function () {
            this._iframeDocument.body.appendChild(component);
            this._dispatchComponentAppendEvent();
          }.bind(this));
        }.bind(this));
      }
    },

    /**
     * Indicates whether the webpackageId and the artifactId provided as url parameters have the
     * correct syntax
     * @returns {boolean}
     */
    _validComponentIds: function () {
      var validParameters = true;
      if (this.getArtifactInfo().webpackageId && this.getArtifactInfo().artifactId) {
        var pattern = new RegExp('^([a-z0-9]+||([a-z0-9]+[a-z0-9-][a-z0-9]+)*)(\\.([a-z0-9]+||([a-z0-9]+[a-z0-9-][a-z0-9]+)*))*[@](\\d+)(\\.[\\d]+)*(-SNAPSHOT)?');
        if (!pattern.test(this.getArtifactInfo().webpackageId)) {
          console.error('The webpackage-id is invalid. It should follow the pattern "webpackageName@webpackageVersion", eg. my-webpackage@3.1.1-SNAPSHOT');
          validParameters = false;
        }
        pattern = new RegExp('^[a-z0-9]+(-[a-z0-9]+)+$');
        if (!pattern.test(this.getArtifactInfo().artifactId)) {
          console.error('The artifact-id is invalid. It should be lowercase and dash separated, eg. my-component');
          validParameters = false;
        }
        return validParameters;
      }
      return false;
    },

    /**
     * Add a dependency provided to the window.cubx.rootDependencies array
     * @param {object} dependency - Root dependency, i.e {artifactId: ..., webpackageId: ...}
     */
    _addRootDependency: function (dependency) {
      this._iframeWindow.cubx.CRCInit.rootDependencies.push(dependency);
    },

    /**
     * Init the value of window.cubx.rootDependencies array
     * @private
     */
    _initRootDependenciesArray: function () {
      this._iframeWindow.cubx = {CRCInit: {rootDependencies: []}};
    },

    /**
     * Create a 'cubx-core-slot-init' to define a slot initialization
     * @param {string} slotName - Name of the slot to be initialized
     * @param {object} slotValue - Value of the slot
     * @returns {Element} 'cubx-core-slot-init' element to initialize a component's slot
     */
    _createCoreSlotInitElement: function (slotName, slotValue) {
      var coreSlotInit = document.createElement('cubx-core-slot-init');
      coreSlotInit.setAttribute('slot', slotName);
      coreSlotInit.textContent = JSON.stringify(slotValue);
      return coreSlotInit;
    },

    /**
     * Create a 'cubx-core-init' html element using a JSON
     * @param {object} inits - Object defining the slots' inits
     * @returns {Element} 'cubx-core-init' element to initialize a component
     */
    _createCoreInitElement: function (inits) {
      var coreInit = document.createElement('cubx-core-init');
      coreInit.style.display = 'none';
      for (var key in inits) {
        coreInit.appendChild(this._createCoreSlotInitElement(key, inits[key]));
      }
      return coreInit;
    },

    /**
     * Dispatch 'componentAppend' event so that the CRC starts working
     */
    _dispatchComponentAppendEvent: function () {
      var event = this._iframeDocument.createEvent('CustomEvent');
      event.initCustomEvent('componentAppend', true, true, {});
      this._iframeDocument.dispatchEvent(event);
    }
  });
}());
