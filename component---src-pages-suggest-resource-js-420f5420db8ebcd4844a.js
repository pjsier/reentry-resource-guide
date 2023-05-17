"use strict";(self.webpackChunkreentry_resource_guide=self.webpackChunkreentry_resource_guide||[]).push([[563],{7869:function(e,t,r){Object.defineProperty(t,"__esModule",{value:!0});var n,o=function(){function e(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,r,n){return r&&e(t.prototype,r),n&&e(t,n),t}}(),s=r(7294),c=(n=s)&&n.__esModule?n:{default:n},i=r(5697);var a=function(e){function t(e){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);var r=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return r.scriptLoaderId="id"+r.constructor.idCount++,r}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,e),o(t,[{key:"componentDidMount",value:function(){var e=this.props,t=e.onError,r=e.onLoad,n=e.url;this.constructor.loadedScripts[n]?r():this.constructor.erroredScripts[n]?t():this.constructor.scriptObservers[n]?this.constructor.scriptObservers[n][this.scriptLoaderId]=this.props:(this.constructor.scriptObservers[n]=function(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}({},this.scriptLoaderId,this.props),this.createScript())}},{key:"componentWillUnmount",value:function(){var e=this.props.url,t=this.constructor.scriptObservers[e];t&&delete t[this.scriptLoaderId]}},{key:"createScript",value:function(){var e=this,t=this.props,r=t.onCreate,n=t.url,o=t.attributes,s=document.createElement("script");r(),o&&Object.keys(o).forEach((function(e){return s.setAttribute(e,o[e])})),s.src=n,s.hasAttribute("async")||(s.async=1);var c=function(t){var r=e.constructor.scriptObservers[n];Object.keys(r).forEach((function(o){t(r[o])&&delete e.constructor.scriptObservers[n][e.scriptLoaderId]}))};s.onload=function(){e.constructor.loadedScripts[n]=!0,c((function(e){return e.onLoad(),!0}))},s.onerror=function(){e.constructor.erroredScripts[n]=!0,c((function(e){return e.onError(),!0}))},document.body.appendChild(s)}},{key:"render",value:function(){return null}}]),t}(c.default.Component);a.propTypes={attributes:i.PropTypes.object,onCreate:i.PropTypes.func,onError:i.PropTypes.func.isRequired,onLoad:i.PropTypes.func.isRequired,url:i.PropTypes.string.isRequired},a.defaultProps={attributes:{},onCreate:function(){},onError:function(){},onLoad:function(){}},a.scriptObservers={},a.loadedScripts={},a.erroredScripts={},a.idCount=0,t.default=a,e.exports=t.default},5732:function(e,t,r){var n=r(7294),o=r(7869),s=r.n(o),c=function(e){var t=e.title,r=e.embedId,o=e.queryParams;return n.createElement(n.Fragment,null,n.createElement(s(),{url:"https://static.airtable.com/js/embed/embed_snippet_v1.js"}),n.createElement("iframe",{title:t,className:"airtable-embed airtable-dynamic-height",src:"https://airtable.com/embed/"+r+"?"+new URLSearchParams(o),frameBorder:"0",onWheel:function(){},width:"100%",height:"3059",style:{background:"transparent",border:"1px solid #ccc"}}))};c.defaultProps={title:"Airtable",queryParams:{}},t.Z=c},2284:function(e,t,r){r.r(t);var n=r(7294),o=r(9122),s=r(1851),c=r(262),i=r(5732);t.default=(0,o.injectIntl)((function(e){var t=e.location,r=e.intl;return n.createElement(s.Z,{location:t},n.createElement(c.Z,{title:r.formatMessage({id:"suggest-resource"}),lang:r.locale}),n.createElement("main",{className:"main container"},n.createElement("article",{className:"content"},n.createElement("h2",null,r.formatMessage({id:"suggest-resource"})),n.createElement("p",null,r.formatMessage({id:"suggest-resource-intro"})),n.createElement("p",null,r.formatMessage({id:"suggest-resource-intro-alt-form"},{thisFormLink:n.createElement(o.Link,{to:"/feedback/"},r.formatMessage({id:"this-form"}))})),n.createElement(i.Z,{title:r.formatMessage({id:"suggest-resource"}),embedId:r.formatMessage({id:"suggest-resource-form-id"})}))))}))}}]);
//# sourceMappingURL=component---src-pages-suggest-resource-js-420f5420db8ebcd4844a.js.map