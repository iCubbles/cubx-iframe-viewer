## cubx-iframe-viewer
Contain the component(s) needed to visualize a component  via an iframe.
### Artifacts of the webpackage
| Name | Type | Description | Links |
|---|---|---|---|
| **docs** | Application | Generated webpackage documentation. | [docs](https://cubbles.world/sandbox/cubx-iframe-viewer@1.1.1/docs/index.html)  |
| **cubx-iframe-viewer** | Elementary Component | Component to visualize another component within an iframe | [demo](https://cubbles.world/sandbox/cubx-iframe-viewer@1.1.1/cubx-iframe-viewer/demo/index.html) [docs](https://cubbles.world/sandbox/cubx-iframe-viewer@1.1.1/cubx-iframe-viewer/docs/index.html)  |
### Use of components
The html file should contain the desire component using its tag, e.g. the `<cubx-iframe-viewer>`, as follows:
```html
<cubx-iframe-viewer cubx-webpackage-id="cubx-iframe-viewer@1.1.1"></cubx-iframe-viewer>
```
Note that the `webpackageId` should be provided, which in this case is: `cubx-iframe-viewer@1.1.1`.
Additionally, this component can be initialized using the `<cubx-core-slot-init>` tag (available from _cubx.core.rte@1.9.0_).
For example, lets initialize the `artifactInfo` slot to get the basic package of ckeditor:
```html
<cubx-iframe-viewer cubx-webpackage-id="cubx-iframe-viewer@1.1.1"></cubx-iframe-viewer>
	<!--Initilization-->
	<cubx-core-init style="display:none">
		<cubx-core-slot-init slot="artifactInfo">{ "webpackageId": "cubx-generic-component-viewer@1.0.1", "artifactId": "cubx-generic-component-viewer" }</cubx-core-slot-init>
	</cubx-core-init>
</cubx-iframe-viewer>
```
Or it can be initialized and later manipulated from Javascript as follows:
```javascript
var component= document.querySelector('cubx-iframe-viewer');
// Wait until CIF is ready
document.addEventListener('cifReady', function() {
	// Manipulate slots
	component.setArtifactInfo({ "webpackageId": "cubx-generic-component-viewer@1.0.1", "artifactId": "cubx-generic-component-viewer" });
});
```
[Want to get to know the Cubbles Platform?](https://cubbles.github.io)
