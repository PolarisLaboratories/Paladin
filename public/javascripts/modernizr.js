/*! modernizr 3.5.0 (Custom Build) | MIT *
 * https://modernizr.com/download/?-svg-websockets-setclasses !*/
!function(e,n,s){function o(e,n){return typeof e===n}function a(){var e,n,s,a,t,l,r;for(var f in c)if(c.hasOwnProperty(f)){if(e=[],n=c[f],n.name&&(e.push(n.name.toLowerCase()),n.options&&n.options.aliases&&n.options.aliases.length))for(s=0;s<n.options.aliases.length;s++)e.push(n.options.aliases[s].toLowerCase());for(a=o(n.fn,"function")?n.fn():n.fn,t=0;t<e.length;t++)l=e[t],r=l.split("."),1===r.length?Modernizr[r[0]]=a:(!Modernizr[r[0]]||Modernizr[r[0]]instanceof Boolean||(Modernizr[r[0]]=new Boolean(Modernizr[r[0]])),Modernizr[r[0]][r[1]]=a),i.push((a?"":"no-")+r.join("-"))}}function t(e){var n=u.className,s=Modernizr._config.classPrefix||"";if(d&&(n=n.baseVal),Modernizr._config.enableJSClass){var o=new RegExp("(^|\\s)"+s+"no-js(\\s|$)");n=n.replace(o,"$1"+s+"js$2")}Modernizr._config.enableClasses&&(n+=" "+s+e.join(" "+s),d?u.className.baseVal=n:u.className=n)}var i=[],c=[],l={_version:"3.5.0",_config:{classPrefix:"",enableClasses:!0,enableJSClass:!0,usePrefixes:!0},_q:[],on:function(e,n){var s=this;setTimeout(function(){n(s[e])},0)},addTest:function(e,n,s){c.push({name:e,fn:n,options:s})},addAsyncTest:function(e){c.push({name:null,fn:e})}},Modernizr=function(){};Modernizr.prototype=l,Modernizr=new Modernizr;var r=!1;try{r="WebSocket"in e&&2===e.WebSocket.CLOSING}catch(f){}Modernizr.addTest("websockets",r),Modernizr.addTest("svg",!!n.createElementNS&&!!n.createElementNS("http://www.w3.org/2000/svg","svg").createSVGRect);var u=n.documentElement,d="svg"===u.nodeName.toLowerCase();a(),t(i),delete l.addTest,delete l.addAsyncTest;for(var p=0;p<Modernizr._q.length;p++)Modernizr._q[p]();e.Modernizr=Modernizr}(window,document);