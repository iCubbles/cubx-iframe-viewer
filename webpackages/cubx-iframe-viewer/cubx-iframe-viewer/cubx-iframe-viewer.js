/* global MutationObserver */
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
     *  Observe the Cubbles-Component-Model: If value for slot 'artifactInfo' has changed ...
     */
    modelArtifactInfoChanged: function (artifactInfo) {
      this._createAppendComponent();
    },

    /**
     *  Observe the Cubbles-Component-Model: If value for slot 'autoHeight' has changed ...
     */
    modelAutoHeightChanged: function (autoHeight) {
      if (autoHeight) {
        this._addMutationObserver();
      }
    },

    /**
     *  Observe the Cubbles-Component-Model: If value for slot 'height' has changed ...
     */
    modelHeightChanged: function (height) {
      if (!this.getAutoHeight()) {
        this._resizeIframe({height: height});
      }
    },

    /**
     *  Observe the Cubbles-Component-Model: If value for slot 'width' has changed ...
     */
    modelWidthChanged: function (width) {
      this._resizeIframe({width: width});
    },

    /**
     *  Observe the Cubbles-Component-Model: If value for slot 'slotChange' has changed ...
     */
    modelSlotChangeChanged: function (slotChange) {
      if (this.getArtifactInfo() && this._iframeDocument.querySelector(this.getArtifactInfo().artifactId)) {
        var component = this._iframeDocument.querySelector(this.getArtifactInfo().artifactId);
        component['set' + this._capitalizeFirstLetter(slotChange.slot)](slotChange.value);
      }
    },

    /**
     * Change the first letter of a string to uppercase
     * @param {string} string - String to be capitalize
     * @returns {string}
     * @private
     */
    _capitalizeFirstLetter: function (string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },

    /**
     * Resize the iframe width and/or height according to 'dimensions' object
     * @param {object} dimensions - {width: 'width', height: 'height'}, samples of valid dimension
     * are '100px', '100em', '100%'. Both properties of 'dimensions' are optional.
     * @private
     */
    _resizeIframe: function (dimensions) {
      if (dimensions.width) {
        this.$$('iframe').width = dimensions.width;
      }
      if (dimensions.height) {
        this.$$('iframe').height = dimensions.height;
      }
    },

    /**
     * Add a MutationObserver to call the 'postIframeHeight' method when new nodes are added to the
     * body or when the body data changes.
     */
    _addMutationObserver: function () {
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          var boundingRect = this._iframeDocument.querySelector(this.getArtifactInfo().artifactId).getBoundingClientRect();
          var newHeight = boundingRect.bottom + boundingRect.top;
          if (newHeight !== this._iframeDocument.height && this._iframeCifReady) {
            this._resizeIframe({height: newHeight});
          }
        }.bind(this));
      }.bind(this));

      var targetNode = this._iframeDocument.body;
      observer.observe(targetNode, { childList: true, subtree: true, attributes: true });
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
        if (this.getAutoHeight()) {
          this._addMutationObserver();
        } else if (this.getWidth()) {
          this._resizeIframe({width: this.getWidth()});
        } else if (this.getHeight()) {
          this._resizeIframe({height: this.getHeight()});
        }
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
          if (this.getArtifactInfo().inits) {
            component.appendChild(this._createCoreInitElement(this.getArtifactInfo().inits));
          }
          if (this.getArtifactInfo().dependencies) {
            this.getArtifactInfo().dependencies.forEach(function (dep) {
              this._addRootDependency(dep);
            }.bind(this));
          }
          this._injectHeadScripts(function () {
            this._iframeDocument.body.appendChild(component);
            this._iframeDocument.addEventListener('cifReady', function () {
              this._iframeCifReady = true;
              this._dispatchEvent(
                'iframeCifReady',
                false,
                {runtimeId: this.getAttribute('runtime-id')}
                );
            }.bind(this));
            this._dispatchEvent('componentAppend', true);
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
     * @param {string} eventName - Name of the event to be dispatched
     * @param {boolean} [fromIframe] - Boolean indicating whether the event is dispatched from the
     * iframe
     * @param {object} [data] - Data to be attached to the event
     */
    _dispatchEvent: function (eventName, fromIframe, data) {
      var dispatcher = fromIframe ? this._iframeDocument : document;
      var event = dispatcher.createEvent('CustomEvent');
      event.initCustomEvent(eventName, true, true, data || {});
      dispatcher.dispatchEvent(event);
    }
  });
}());
