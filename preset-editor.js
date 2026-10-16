//@name preset_editor
//@api 3.0
//@version 1.0.0
//@display-name 프리셋 에디터
//@update-url https://raw.githubusercontent.com/sae-chi/RisuAIPlugin/refs/heads/main/preset-editor.js

/* Offline RisuAI preset editing and reusable custom cards. No database access, network, or model calls. */
(function () {
  'use strict';
  /* Bundled msgpackr 1.11.5 (index-no-eval):
MIT License

Copyright (c) 2020 Kris Zyp

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
  const MSGPACK = (() => { const module = { exports: {} }; const exports = module.exports; const define = undefined;
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).msgpackr={})}(this,(function(e){"use strict";var t,r,n;try{t=new TextDecoder}catch(e){}var i,s,o,a,u,l=0,f={},c=0,g=0,h=[],p={useRecords:!1,mapsAsObjects:!0};class d{}const y=new d;y.name="MessagePack 0xC1";var w,b=!1,m=2;try{new w("")}catch(e){m=1/0}class S{constructor(e){e&&(!1===e.useRecords&&void 0===e.mapsAsObjects&&(e.mapsAsObjects=!0),e.sequential&&!1!==e.trusted&&(e.trusted=!0,e.structures||0==e.useRecords||(e.structures=[],e.maxSharedStructures||(e.maxSharedStructures=0))),e.structures?e.structures.sharedLength=e.structures.length:e.getStructures&&((e.structures=[]).uninitialized=!0,e.structures.sharedLength=0),e.int64AsNumber&&(e.int64AsType="number")),Object.assign(this,e)}unpack(e,t){if(r)return Z((()=>(G(),this?this.unpack(e,t):S.prototype.unpack.call(p,e,t))));e.buffer||e.constructor!==ArrayBuffer||(e="undefined"!=typeof Buffer?Buffer.from(e):new Uint8Array(e)),"object"==typeof t?(n=t.end||e.length,l=t.start||0):(l=0,n=t>-1?t:e.length),g=0,s=null,o=null,r=e;try{u=e.dataView||(e.dataView=new DataView(e.buffer,e.byteOffset,e.byteLength))}catch(t){if(r=null,e instanceof Uint8Array)throw t;throw new Error("Source must be a Uint8Array or Buffer but was a "+(e&&"object"==typeof e?e.constructor.name:typeof e))}if(this instanceof S){if(f=this,this.structures)return i=this.structures,A(t);(!i||i.length>0)&&(i=[])}else f=p,(!i||i.length>0)&&(i=[]);return A(t)}unpackMultiple(e,t){let r,n=0;try{b=!0;let i=e.length,s=this?this.unpack(e,i):X.unpack(e,i);if(!t){for(r=[s];l<i;)n=l,r.push(A());return r}if(!1===t(s,n,l))return;for(;l<i;)if(n=l,!1===t(A(),n,l))return}catch(e){throw e.lastPosition=n,e.values=r,e}finally{b=!1,G()}}_mergeStructures(e,t){e=e||[],Object.isFrozen(e)&&(e=e.map((e=>e.slice(0))));for(let t=0,r=e.length;t<r;t++){let r=e[t];r&&(r.isShared=!0,t>=32&&(r.highByte=t-32>>5))}e.sharedLength=e.length;for(let r in t||[])if(r>=0){let n=e[r],i=t[r];i&&(n&&((e.restoreStructures||(e.restoreStructures=[]))[r]=n),e[r]=i)}return this.structures=e}decode(e,t){return this.unpack(e,t)}}function A(e){try{if(!f.trusted&&!b){let e=i.sharedLength||0;e<i.length&&(i.length=e)}let e;if(f.randomAccessStructure&&r[l]<64&&r[l],e=E(),o&&(l=o.postBundlePosition,o=null),b&&(i.restoreStructures=null),l==n)i&&i.restoreStructures&&U(),i=null,r=null,a&&(a=null);else{if(l>n)throw new Error("Unexpected end of MessagePack data");if(!b){let t;try{t=JSON.stringify(e,((e,t)=>"bigint"==typeof t?`${t}n`:t)).slice(0,100)}catch(e){t="(JSON view not available "+e+")"}throw new Error("Data read, but end of buffer not reached "+t)}}return e}catch(e){throw i&&i.restoreStructures&&U(),G(),(e instanceof RangeError||e.message.startsWith("Unexpected end of buffer")||l>n)&&(e.incomplete=!0),e}}function U(){for(let e in i.restoreStructures)i[e]=i.restoreStructures[e];i.restoreStructures=null}function E(){let e=r[l++];if(e<160){if(e<128){if(e<64)return e;{let t=i[63&e]||f.getStructures&&B()[63&e];return t?(t.read||(t.read=k(t,63&e)),t.read()):e}}if(e<144){if(e-=128,f.mapsAsObjects){let t={};for(let r=0;r<e;r++){let e=C();"__proto__"===e&&(e="__proto_"),t[e]=E()}return t}{let t=new Map;for(let r=0;r<e;r++)t.set(E(),E());return t}}{e-=144;let t=new Array(e);for(let r=0;r<e;r++)t[r]=E();return f.freezeData?Object.freeze(t):t}}if(e<192){let t=e-160;if(g>=l)return s.slice(l-c,(l+=t)-c);if(0==g&&n<140){let e=t<16?L(t):V(t);if(null!=e)return e}return O(t)}{let t;switch(e){case 192:return null;case 193:return o?(t=E(),t>0?o[1].slice(o.position1,o.position1+=t):o[0].slice(o.position0,o.position0-=t)):y;case 194:return!1;case 195:return!0;case 196:if(t=r[l++],void 0===t)throw new Error("Unexpected end of buffer");return N(t);case 197:return t=u.getUint16(l),l+=2,N(t);case 198:return t=u.getUint32(l),l+=4,N(t);case 199:return P(r[l++]);case 200:return t=u.getUint16(l),l+=2,P(t);case 201:return t=u.getUint32(l),l+=4,P(t);case 202:if(t=u.getFloat32(l),f.useFloat32>2){let e=H[(127&r[l])<<1|r[l+1]>>7];return l+=4,(e*t+(t>0?.5:-.5)>>0)/e}return l+=4,t;case 203:return t=u.getFloat64(l),l+=8,t;case 204:return r[l++];case 205:return t=u.getUint16(l),l+=2,t;case 206:return t=u.getUint32(l),l+=4,t;case 207:return"number"===f.int64AsType?(t=4294967296*u.getUint32(l),t+=u.getUint32(l+4)):"string"===f.int64AsType?t=u.getBigUint64(l).toString():"auto"===f.int64AsType?(t=u.getBigUint64(l),t<=BigInt(2)<<BigInt(52)&&(t=Number(t))):t=u.getBigUint64(l),l+=8,t;case 208:return u.getInt8(l++);case 209:return t=u.getInt16(l),l+=2,t;case 210:return t=u.getInt32(l),l+=4,t;case 211:return"number"===f.int64AsType?(t=4294967296*u.getInt32(l),t+=u.getUint32(l+4)):"string"===f.int64AsType?t=u.getBigInt64(l).toString():"auto"===f.int64AsType?(t=u.getBigInt64(l),t>=BigInt(-2)<<BigInt(52)&&t<=BigInt(2)<<BigInt(52)&&(t=Number(t))):t=u.getBigInt64(l),l+=8,t;case 212:if(t=r[l++],114==t)return J(63&r[l++]);{let e=h[t];if(e)return e.read?(l++,e.read(E())):e.noBuffer?(l++,e()):e(r.subarray(l,++l));throw new Error("Unknown extension "+t)}case 213:return t=r[l],114==t?(l++,J(63&r[l++],r[l++])):P(2);case 214:return P(4);case 215:return P(8);case 216:return P(16);case 217:return t=r[l++],g>=l?s.slice(l-c,(l+=t)-c):_(t);case 218:return t=u.getUint16(l),g>=(l+=2)?s.slice(l-c,(l+=t)-c):x(t);case 219:return t=u.getUint32(l),g>=(l+=4)?s.slice(l-c,(l+=t)-c):T(t);case 220:return t=u.getUint16(l),l+=2,j(t);case 221:return t=u.getUint32(l),l+=4,j(t);case 222:return t=u.getUint16(l),l+=2,R(t);case 223:return t=u.getUint32(l),l+=4,R(t);default:if(e>=224)return e-256;if(void 0===e){let e=new Error("Unexpected end of MessagePack data");throw e.incomplete=!0,e}throw new Error("Unknown MessagePack token "+e)}}}const I=/^[a-zA-Z_$][a-zA-Z\d_$]*$/;function k(e,t){function r(){if(r.count++>m){let r=e.read=new w("r","return function(){return "+(f.freezeData?"Object.freeze":"")+"({"+e.map((e=>"__proto__"===e?"__proto_:r()":I.test(e)?e+":r()":"["+JSON.stringify(e)+"]:r()")).join(",")+"})}")(E);return 0===e.highByte&&(e.read=v(t,e.read)),r()}let n={};for(let t=0,r=e.length;t<r;t++){let r=e[t];"__proto__"===r&&(r="__proto_"),n[r]=E()}return f.freezeData?Object.freeze(n):n}return r.count=0,0===e.highByte?v(t,r):r}const v=(e,t)=>function(){let n=r[l++];if(0===n)return t();let s=e<32?-(e+(n<<5)):e+(n<<5),o=i[s]||B()[s];if(!o)throw new Error("Record id is not defined for "+s);return o.read||(o.read=k(o,e)),o.read()};function B(){let e=Z((()=>(r=null,f.getStructures())));return i=f._mergeStructures(e,i)}var O=M,_=M,x=M,T=M;function M(e){let n;if(e<16&&(n=L(e)))return n;if(e>64&&t)return t.decode(r.subarray(l,l+=e));const i=l+e,s=[];for(n="";l<i;){const e=r[l++];if(0==(128&e))s.push(e);else if(192==(224&e)){const t=63&r[l++];s.push((31&e)<<6|t)}else if(224==(240&e)){const t=63&r[l++],n=63&r[l++];s.push((31&e)<<12|t<<6|n)}else if(240==(248&e)){let t=(7&e)<<18|(63&r[l++])<<12|(63&r[l++])<<6|63&r[l++];t>65535&&(t-=65536,s.push(t>>>10&1023|55296),t=56320|1023&t),s.push(t)}else s.push(e);s.length>=4096&&(n+=D.apply(String,s),s.length=0)}return s.length>0&&(n+=D.apply(String,s)),n}function j(e){let t=new Array(e);for(let r=0;r<e;r++)t[r]=E();return f.freezeData?Object.freeze(t):t}function R(e){if(f.mapsAsObjects){let t={};for(let r=0;r<e;r++){let e=C();"__proto__"===e&&(e="__proto_"),t[e]=E()}return t}{let t=new Map;for(let r=0;r<e;r++)t.set(E(),E());return t}}var D=String.fromCharCode;function V(e){let t=l,n=new Array(e);for(let i=0;i<e;i++){const e=r[l++];if((128&e)>0)return void(l=t);n[i]=e}return D.apply(String,n)}function L(e){if(e<4){if(e<2){if(0===e)return"";{let e=r[l++];return(128&e)>1?void(l-=1):D(e)}}{let t=r[l++],n=r[l++];if((128&t)>0||(128&n)>0)return void(l-=2);if(e<3)return D(t,n);let i=r[l++];return(128&i)>0?void(l-=3):D(t,n,i)}}{let t=r[l++],n=r[l++],i=r[l++],s=r[l++];if((128&t)>0||(128&n)>0||(128&i)>0||(128&s)>0)return void(l-=4);if(e<6){if(4===e)return D(t,n,i,s);{let e=r[l++];return(128&e)>0?void(l-=5):D(t,n,i,s,e)}}if(e<8){let o=r[l++],a=r[l++];if((128&o)>0||(128&a)>0)return void(l-=6);if(e<7)return D(t,n,i,s,o,a);let u=r[l++];return(128&u)>0?void(l-=7):D(t,n,i,s,o,a,u)}{let o=r[l++],a=r[l++],u=r[l++],f=r[l++];if((128&o)>0||(128&a)>0||(128&u)>0||(128&f)>0)return void(l-=8);if(e<10){if(8===e)return D(t,n,i,s,o,a,u,f);{let e=r[l++];return(128&e)>0?void(l-=9):D(t,n,i,s,o,a,u,f,e)}}if(e<12){let c=r[l++],g=r[l++];if((128&c)>0||(128&g)>0)return void(l-=10);if(e<11)return D(t,n,i,s,o,a,u,f,c,g);let h=r[l++];return(128&h)>0?void(l-=11):D(t,n,i,s,o,a,u,f,c,g,h)}{let c=r[l++],g=r[l++],h=r[l++],p=r[l++];if((128&c)>0||(128&g)>0||(128&h)>0||(128&p)>0)return void(l-=12);if(e<14){if(12===e)return D(t,n,i,s,o,a,u,f,c,g,h,p);{let e=r[l++];return(128&e)>0?void(l-=13):D(t,n,i,s,o,a,u,f,c,g,h,p,e)}}{let d=r[l++],y=r[l++];if((128&d)>0||(128&y)>0)return void(l-=14);if(e<15)return D(t,n,i,s,o,a,u,f,c,g,h,p,d,y);let w=r[l++];return(128&w)>0?void(l-=15):D(t,n,i,s,o,a,u,f,c,g,h,p,d,y,w)}}}}}function F(){let e,t=r[l++];if(t<192)e=t-160;else switch(t){case 217:e=r[l++];break;case 218:e=u.getUint16(l),l+=2;break;case 219:e=u.getUint32(l),l+=4;break;default:throw new Error("Expected string")}return M(e)}function N(e){return f.copyBuffers?Uint8Array.prototype.slice.call(r,l,l+=e):r.subarray(l,l+=e)}function P(e){let t=r[l++];if(h[t]){let n;return h[t](r.subarray(l,n=l+=e),(e=>{l=e;try{return E()}finally{l=n}}))}throw new Error("Unknown extension type "+t)}var z=new Array(4096);function C(){let e=r[l++];if(!(e>=160&&e<192))return l--,W(E());if(e-=160,g>=l)return s.slice(l-c,(l+=e)-c);if(!(0==g&&n<180))return O(e);let t,i=4095&(e<<5^(e>1?u.getUint16(l):e>0?r[l]:0)),o=z[i],a=l,f=l+e-3,h=0;if(o&&o.bytes==e){for(;a<f;){if(t=u.getUint32(a),t!=o[h++]){a=1879048192;break}a+=4}for(f+=3;a<f;)if(t=r[a++],t!=o[h++]){a=1879048192;break}if(a===f)return l=a,o.string;f-=3,a=l}for(o=[],z[i]=o,o.bytes=e;a<f;)t=u.getUint32(a),o.push(t),a+=4;for(f+=3;a<f;)t=r[a++],o.push(t);let p=e<16?L(e):V(e);return o.string=null!=p?p:O(e)}function W(e){if("string"==typeof e)return e;if("number"==typeof e||"boolean"==typeof e||"bigint"==typeof e)return e.toString();if(null==e)return e+"";if(f.allowArraysInMapKeys&&Array.isArray(e)&&e.flat().every((e=>["string","number","boolean","bigint"].includes(typeof e))))return e.flat().toString();throw new Error("Invalid property type for record: "+typeof e)}const J=(e,t)=>{let r=E().map(W),n=e;void 0!==t&&(e=e<32?-((t<<5)+e):(t<<5)+e,r.highByte=t);let s=i[e];return s&&(s.isShared||b)&&((i.restoreStructures||(i.restoreStructures=[]))[e]=s),i[e]=r,r.read=k(r,n),r.read()};h[0]=()=>{},h[0].noBuffer=!0,h[66]=e=>{let t=e.byteLength%8||8,r=BigInt(128&e[0]?e[0]-256:e[0]);for(let n=1;n<t;n++)r<<=BigInt(8),r+=BigInt(e[n]);if(e.byteLength!==t){let n=new DataView(e.buffer,e.byteOffset,e.byteLength),i=(e,t)=>{let r=t-e;if(r<=40){let r=n.getBigUint64(e);for(let i=e+8;i<t;i+=8)r<<=BigInt(64n),r|=n.getBigUint64(i);return r}let s=e+(r>>4<<3),o=i(e,s),a=i(s,t);return o<<BigInt(8*(t-s))|a};r=r<<BigInt(8*(n.byteLength-t))|i(t,n.byteLength)}return r};let $={Error:Error,EvalError:EvalError,RangeError:RangeError,ReferenceError:ReferenceError,SyntaxError:SyntaxError,TypeError:TypeError,URIError:URIError,AggregateError:"function"==typeof AggregateError?AggregateError:null};h[101]=()=>{let e=E();if(!$[e[0]]){let t=Error(e[1],{cause:e[2]});return t.name=e[0],t}return $[e[0]](e[1],{cause:e[2]})},h[105]=e=>{if(!1===f.structuredClone)throw new Error("Structured clone extension is disabled");let t=u.getUint32(l-4);a||(a=new Map);let n,i=r[l];n=i>=144&&i<160||220==i||221==i?[]:i>=128&&i<144||222==i||223==i?new Map:(i>=199&&i<=201||i>=212&&i<=216)&&115===r[l+1]?new Set:{};let s={target:n};a.set(t,s);let o=E();if(!s.used)return s.target=o;if(Object.assign(n,o),n instanceof Map)for(let[e,t]of o.entries())n.set(e,t);if(n instanceof Set)for(let e of Array.from(o))n.add(e);return n},h[112]=e=>{if(!1===f.structuredClone)throw new Error("Structured clone extension is disabled");let t=u.getUint32(l-4),r=a.get(t);return r.used=!0,r.target},h[115]=()=>new Set(E());const K=["Int8","Uint8","Uint8Clamped","Int16","Uint16","Int32","Uint32","Float32","Float64","BigInt64","BigUint64"].map((e=>e+"Array"));let Y="object"==typeof globalThis?globalThis:window;h[116]=e=>{let t=e[0],r=Uint8Array.prototype.slice.call(e,1).buffer,n=K[t];if(!n){if(16===t)return r;if(17===t)return new DataView(r);throw new Error("Could not find typed array for code "+t)}return new Y[n](r)},h[120]=()=>{let e=E();return new RegExp(e[0],e[1])};const q=[];function Z(e){let t=n,h=l,p=c,d=g,y=s,w=a,m=o,S=new Uint8Array(r.slice(0,n)),A=i,U=i.slice(0,i.length),E=f,I=b,k=e();return n=t,l=h,c=p,g=d,s=y,a=w,o=m,r=S,b=I,(i=A).splice(0,i.length,...U),f=E,u=new DataView(r.buffer,r.byteOffset,r.byteLength),k}function G(){r=null,a=null,i=null}h[98]=e=>{let t=(e[0]<<24)+(e[1]<<16)+(e[2]<<8)+e[3],r=l;return l+=t-e.length,o=q,(o=[F(),F()]).position0=0,o.position1=0,o.postBundlePosition=l,l=r,E()},h[255]=e=>4==e.length?new Date(1e3*(16777216*e[0]+(e[1]<<16)+(e[2]<<8)+e[3])):8==e.length?new Date(((e[0]<<22)+(e[1]<<14)+(e[2]<<6)+(e[3]>>2))/1e6+1e3*(4294967296*(3&e[3])+16777216*e[4]+(e[5]<<16)+(e[6]<<8)+e[7])):12==e.length?new Date(((e[0]<<24)+(e[1]<<16)+(e[2]<<8)+e[3])/1e6+1e3*((128&e[4]?-281474976710656:0)+1099511627776*e[6]+4294967296*e[7]+16777216*e[8]+(e[9]<<16)+(e[10]<<8)+e[11])):new Date("invalid");const H=new Array(147);for(let e=0;e<256;e++)H[e]=+("1e"+Math.floor(45.15-.30103*e));const Q=S;var X=new S({useRecords:!1});const ee=X.unpack,te=X.unpackMultiple,re=X.unpack,ne={NEVER:0,ALWAYS:1,DECIMAL_ROUND:3,DECIMAL_FIT:4};let ie,se,oe,ae=new Float32Array(1),ue=new Uint8Array(ae.buffer,0,4);try{ie=new TextEncoder}catch(e){}const le="undefined"!=typeof Buffer,fe=le?function(e){return Buffer.allocUnsafeSlow(e)}:Uint8Array,ce=le?Buffer:Uint8Array,ge=le?4294967296:2144337920;let he,pe,de,ye,we=0,be=null;const me=/[\u0080-\uFFFF]/,Se=Symbol("record-id");class Ae extends S{constructor(e){let t,r,n,i;super(e),this.offset=0;let s=ce.prototype.utf8Write?function(e,t){return he.utf8Write(e,t,he.byteLength-t)}:!(!ie||!ie.encodeInto)&&function(e,t){return ie.encodeInto(e,he.subarray(t)).written},o=this;e||(e={});let a=e&&e.sequential,u=e.structures||e.saveStructures,l=e.maxSharedStructures;if(null==l&&(l=u?32:0),l>8160)throw new Error("Maximum maxSharedStructure is 8160");e.structuredClone&&null==e.moreTypes&&(this.moreTypes=!0);let f=e.maxOwnStructures;null==f&&(f=u?32:64),this.structures||0==e.useRecords||(this.structures=[]);let c=l>32||f+l>64,g=l+64,h=l+f+64;if(h>8256)throw new Error("Maximum maxSharedStructure + maxOwnStructure is 8192");let p=[],d=0,y=0;this.pack=this.encode=function(e,s){if(he||(he=new fe(8192),de=he.dataView||(he.dataView=new DataView(he.buffer,0,8192)),we=0),ye=he.length-10,ye-we<2048?(he=new fe(he.length),de=he.dataView||(he.dataView=new DataView(he.buffer,0,he.length)),ye=he.length-10,we=0):we=we+7&2147483640,t=we,s&Ve&&(we+=255&s),i=o.structuredClone?new Map:null,o.bundleStrings&&"string"!=typeof e?(be=[],be.size=1/0):be=null,n=o.structures,n){n.uninitialized&&(n=o._mergeStructures(o.getStructures()));let e=n.sharedLength||0;if(e>l)throw new Error("Shared structures is larger than maximum shared structures, try increasing maxSharedStructures to "+n.sharedLength);if(!n.transitions){n.transitions=Object.create(null);for(let t=0;t<e;t++){let e=n[t];if(!e)continue;let r,i=n.transitions;for(let t=0,n=e.length;t<n;t++){let n=e[t];r=i[n],r||(r=i[n]=Object.create(null)),i=r}i[Se]=t+64}this.lastNamedStructuresLength=e}a||(n.nextId=e+64)}let u;r&&(r=!1);try{o.randomAccessStructure&&e&&e.constructor&&e.constructor===Object?B(e):m(e);let a=be;if(be&&ke(t,m,0),i&&i.idsToInsert){let e=i.idsToInsert.sort(((e,t)=>e.offset>t.offset?1:-1)),r=e.length,n=-1;for(;a&&r>0;){let i=e[--r].offset+t;i<a.stringsPosition+t&&-1===n&&(n=0),i>a.position+t?n>=0&&(n+=6):(n>=0&&(de.setUint32(a.position+t,de.getUint32(a.position+t)+n),n=-1),a=a.previous,r++)}n>=0&&a&&de.setUint32(a.position+t,de.getUint32(a.position+t)+n),we+=6*e.length,we>ye&&I(we),o.offset=we;let s=function(e,t){let r,n=6*t.length,i=e.length-n;for(;r=t.pop();){let t=r.offset,s=r.id;e.copyWithin(t+n,t,i),n-=6;let o=t+n;e[o++]=214,e[o++]=105,e[o++]=s>>24,e[o++]=s>>16&255,e[o++]=s>>8&255,e[o++]=255&s,i=t}return e}(he.subarray(t,we),e);return i=null,s}return o.offset=we,s&Re?(he.start=t,he.end=we,he):he.subarray(t,we)}catch(e){throw u=e,e}finally{if(n&&(w(),r&&o.saveStructures)){let r=n.sharedLength||0,i=he.subarray(t,we),a=function(e,t){return e.isCompatible=e=>{let r=!e||(t.lastNamedStructuresLength||0)===e.length;return r||t._mergeStructures(e),r},e}(n,o);if(!u)return!1===o.saveStructures(a,a.isCompatible)?o.pack(e,s):(o.lastNamedStructuresLength=r,he.length>1073741824&&(he=null),i)}he.length>1073741824&&(he=null),s&De&&(we=t)}};const w=()=>{y<10&&y++;let e=n.sharedLength||0;if(n.length>e&&!a&&(n.length=e),d>1e4)n.transitions=null,y=0,d=0,p.length>0&&(p=[]);else if(p.length>0&&!a){for(let e=0,t=p.length;e<t;e++)p[e][Se]=0;p=[]}},b=e=>{var t=e.length;t<16?he[we++]=144|t:t<65536?(he[we++]=220,he[we++]=t>>8,he[we++]=255&t):(he[we++]=221,de.setUint32(we,t),we+=4);for(let r=0;r<t;r++)m(e[r])},m=e=>{we>ye&&(he=I(we));var r,n=typeof e;if("string"===n){let n,i=e.length;if(be&&i>=4&&i<4096){if((be.size+=i)>21760){let e,r,n=(be[0]?3*be[0].length+be[1].length:0)+10;we+n>ye&&(he=I(we+n)),be.position?(r=be,he[we]=200,we+=3,he[we++]=98,e=we-t,we+=4,ke(t,m,0),de.setUint16(e+t-3,we-t-e)):(he[we++]=214,he[we++]=98,e=we-t,we+=4),be=["",""],be.previous=r,be.size=0,be.position=e}let r=me.test(e);return be[r?0:1]+=e,he[we++]=193,void m(r?-i:i)}n=i<32?1:i<256?2:i<65536?3:5;let o=3*i;if(we+o>ye&&(he=I(we+o)),i<64||!s){let t,s,o,a=we+n;for(t=0;t<i;t++)s=e.charCodeAt(t),s<128?he[a++]=s:s<2048?(he[a++]=s>>6|192,he[a++]=63&s|128):55296==(64512&s)&&56320==(64512&(o=e.charCodeAt(t+1)))?(s=65536+((1023&s)<<10)+(1023&o),t++,he[a++]=s>>18|240,he[a++]=s>>12&63|128,he[a++]=s>>6&63|128,he[a++]=63&s|128):(he[a++]=s>>12|224,he[a++]=s>>6&63|128,he[a++]=63&s|128);r=a-we-n}else r=s(e,we+n);r<32?he[we++]=160|r:r<256?(n<2&&he.copyWithin(we+2,we+1,we+1+r),he[we++]=217,he[we++]=r):r<65536?(n<3&&he.copyWithin(we+3,we+2,we+2+r),he[we++]=218,he[we++]=r>>8,he[we++]=255&r):(n<5&&he.copyWithin(we+5,we+3,we+3+r),he[we++]=219,de.setUint32(we,r),we+=4),we+=r}else if("number"===n)if(e>>>0===e)e<32||e<128&&!1===this.useRecords||e<64&&!this.randomAccessStructure?he[we++]=e:e<256?(he[we++]=204,he[we++]=e):e<65536?(he[we++]=205,he[we++]=e>>8,he[we++]=255&e):(he[we++]=206,de.setUint32(we,e),we+=4);else if(e>>0===e)e>=-32?he[we++]=256+e:e>=-128?(he[we++]=208,he[we++]=e+256):e>=-32768?(he[we++]=209,de.setInt16(we,e),we+=2):(he[we++]=210,de.setInt32(we,e),we+=4);else{let t;if((t=this.useFloat32)>0&&e<4294967296&&e>=-2147483648){let r;if(he[we++]=202,de.setFloat32(we,e),t<4||(r=e*H[(127&he[we])<<1|he[we+1]>>7])>>0===r)return void(we+=4);we--}he[we++]=203,de.setFloat64(we,e),we+=8}else if("object"===n||"function"===n)if(e){if(i){let r=i.get(e);if(r){if(!r.id){let e=i.idsToInsert||(i.idsToInsert=[]);r.id=e.push(r)}return he[we++]=214,he[we++]=112,de.setUint32(we,r.id),void(we+=4)}i.set(e,{offset:we-t})}let s=e.constructor;if(s===Object)E(e);else if(s===Array)b(e);else if(s===Map)if(this.mapAsEmptyObject)he[we++]=128;else{(r=e.size)<16?he[we++]=128|r:r<65536?(he[we++]=222,he[we++]=r>>8,he[we++]=255&r):(he[we++]=223,de.setUint32(we,r),we+=4);for(let[t,r]of e)m(t),m(r)}else{for(let t=0,r=se.length;t<r;t++){if(e instanceof oe[t]){let r=se[t];if(r.write){r.type&&(he[we++]=212,he[we++]=r.type,he[we++]=0);let t=r.write.call(this,e);return void(t===e?Array.isArray(e)?b(e):E(e):m(t))}let n,i=he,s=de,o=we;he=null;try{n=r.pack.call(this,e,(e=>(he=i,i=null,we+=e,we>ye&&I(we),{target:he,targetView:de,position:we-e})),m)}finally{i&&(he=i,de=s,we=o,ye=he.length-10)}return void(n&&(n.length+we>ye&&I(n.length+we),we=Ie(n,he,we,r.type)))}}if(Array.isArray(e))b(e);else{if(e.toJSON){const t=e.toJSON();if(t!==e)return m(t)}if("function"===n)return m(this.writeFunction&&this.writeFunction(e));E(e)}}}else he[we++]=192;else if("boolean"===n)he[we++]=e?195:194;else if("bigint"===n){if(e<0x8000000000000000&&e>=-0x8000000000000000)he[we++]=211,de.setBigInt64(we,e);else if(e<0x10000000000000000&&e>0)he[we++]=207,de.setBigUint64(we,e);else{if(!this.largeBigIntToFloat){if(this.largeBigIntToString)return m(e.toString());if(this.useBigIntExtension||this.moreTypes){let t,r=e<0?BigInt(-1):BigInt(0);if(e>>BigInt(65536)===r){let n=BigInt(0x10000000000000000)-BigInt(1),i=[];for(;i.push(e&n),e>>BigInt(63)!==r;)e>>=BigInt(64);t=new Uint8Array(new BigUint64Array(i).buffer),t.reverse()}else{let r=e<0,n=(r?~e:e).toString(16);if(n.length%2?n="0"+n:parseInt(n.charAt(0),16)>=8&&(n="00"+n),le)t=Buffer.from(n,"hex");else{t=new Uint8Array(n.length/2);for(let e=0;e<t.length;e++)t[e]=parseInt(n.slice(2*e,2*e+2),16)}if(r)for(let e=0;e<t.length;e++)t[e]=~t[e]}return t.length+we>ye&&I(t.length+we),void(we=Ie(t,he,we,66))}throw new RangeError(e+" was too large to fit in MessagePack 64-bit integer format, use useBigIntExtension, or set largeBigIntToFloat to convert to float-64, or set largeBigIntToString to convert to string")}he[we++]=203,de.setFloat64(we,Number(e))}we+=8}else{if("undefined"!==n)throw new Error("Unknown type: "+n);this.encodeUndefinedAsNil?he[we++]=192:(he[we++]=212,he[we++]=0,he[we++]=0)}},S=this.variableMapSize||this.coercibleKeyAsNumber||this.skipValues?e=>{let t;if(this.skipValues){t=[];for(let r in e)"function"==typeof e.hasOwnProperty&&!e.hasOwnProperty(r)||this.skipValues.includes(e[r])||t.push(r)}else t=Object.keys(e);let r,n=t.length;if(n<16?he[we++]=128|n:n<65536?(he[we++]=222,he[we++]=n>>8,he[we++]=255&n):(he[we++]=223,de.setUint32(we,n),we+=4),this.coercibleKeyAsNumber)for(let i=0;i<n;i++){r=t[i];let n=Number(r);m(isNaN(n)?r:n),m(e[r])}else for(let i=0;i<n;i++)m(r=t[i]),m(e[r])}:e=>{he[we++]=222;let r=we-t;we+=2;let n=0;for(let t in e)("function"!=typeof e.hasOwnProperty||e.hasOwnProperty(t))&&(m(t),m(e[t]),n++);if(n>65535)throw new Error('Object is too large to serialize with fast 16-bit map size, use the "variableMapSize" option to serialize this object');he[r+++t]=n>>8,he[r+t]=255&n},A=!1===this.useRecords?S:e.progressiveRecords&&!c?e=>{let r,i,s=n.transitions||(n.transitions=Object.create(null)),o=we++-t;for(let a in e)if("function"!=typeof e.hasOwnProperty||e.hasOwnProperty(a)){if(r=s[a],r)s=r;else{let u=Object.keys(e),l=s;s=n.transitions;let f=0;for(let e=0,t=u.length;e<t;e++){let t=u[e];r=s[t],r||(r=s[t]=Object.create(null),f++),s=r}o+t+1==we?(we--,k(s,u,f)):v(s,u,o,f),i=!0,s=l[a]}m(e[a])}if(!i){let r=s[Se];r?he[o+t]=r:v(s,Object.keys(e),o,0)}}:e=>{let t,r=n.transitions||(n.transitions=Object.create(null)),i=0;for(let n in e)("function"!=typeof e.hasOwnProperty||e.hasOwnProperty(n))&&(t=r[n],t||(t=r[n]=Object.create(null),i++),r=t);let s=r[Se];s?s>=96&&c?(he[we++]=96+(31&(s-=96)),he[we++]=s>>5):he[we++]=s:k(r,r.__keys__||Object.keys(e),i);for(let t in e)("function"!=typeof e.hasOwnProperty||e.hasOwnProperty(t))&&m(e[t])},U="function"==typeof this.useRecords&&this.useRecords,E=U?e=>{U(e)?A(e):S(e)}:A,I=e=>{let r;if(e>16777216){if(e-t>ge)throw new Error("Packed buffer would be larger than maximum buffer size");r=Math.min(ge,4096*Math.round(Math.max((e-t)*(e>67108864?1.25:2),4194304)/4096))}else r=1+(Math.max(e-t<<2,he.length-1)>>12)<<12;let n=new fe(r);return de=n.dataView||(n.dataView=new DataView(n.buffer,0,r)),e=Math.min(e,he.length),he.copy?he.copy(n,0,t,e):n.set(he.slice(t,e)),we-=t,t=0,ye=n.length-10,he=n},k=(e,t,i)=>{let s=n.nextId;s||(s=64),s<g&&this.shouldShareStructure&&!this.shouldShareStructure(t)?(s=n.nextOwnId,s<h||(s=g),n.nextOwnId=s+1):(s>=h&&(s=g),n.nextId=s+1);let o=t.highByte=s>=96&&c?s-96>>5:-1;e[Se]=s,e.__keys__=t,n[s-64]=t,s<g?(t.isShared=!0,n.sharedLength=s-63,r=!0,o>=0?(he[we++]=96+(31&s),he[we++]=o):he[we++]=s):(o>=0?(he[we++]=213,he[we++]=114,he[we++]=96+(31&s),he[we++]=o):(he[we++]=212,he[we++]=114,he[we++]=s),i&&(d+=y*i),p.length>=f&&(p.shift()[Se]=0),p.push(e),m(t))},v=(e,r,n,i)=>{let s=he,o=we,a=ye,u=t;he=pe,we=0,t=0,he||(pe=he=new fe(8192)),ye=he.length-10,k(e,r,i),pe=he;let l=we;if(he=s,we=o,ye=a,t=u,l>1){let e=we+l-1;e>ye&&I(e);let r=n+t;he.copyWithin(r+l,r+1,we),he.set(pe.slice(0,l),r),we=e}else he[n+t]=pe[0]},B=e=>{let i=undefined(e,he,t,we,n,I,((e,t,n)=>{if(n)return r=!0;we=t;let i=he;return m(e),w(),i!==he?{position:we,targetView:de,target:he}:we}),this);if(0===i)return E(e);we=i}}useBuffer(e){he=e,he.dataView||(he.dataView=new DataView(he.buffer,he.byteOffset,he.byteLength)),de=he.dataView,we=0}set position(e){we=e}get position(){return we}clearSharedData(){this.structures&&(this.structures=[]),this.typedStructs&&(this.typedStructs=[])}}function Ue(e,t,r,n){let i=e.byteLength;if(i+1<256){var{target:s,position:o}=r(4+i);s[o++]=199,s[o++]=i+1}else if(i+1<65536){var{target:s,position:o}=r(5+i);s[o++]=200,s[o++]=i+1>>8,s[o++]=i+1&255}else{var{target:s,position:o,targetView:a}=r(7+i);s[o++]=201,a.setUint32(o,i+1),o+=4}s[o++]=116,s[o++]=t,e.buffer||(e=new Uint8Array(e)),s.set(new Uint8Array(e.buffer,e.byteOffset,e.byteLength),o)}function Ee(e,t){let r=e.byteLength;var n,i;if(r<256){var{target:n,position:i}=t(r+2);n[i++]=196,n[i++]=r}else if(r<65536){var{target:n,position:i}=t(r+3);n[i++]=197,n[i++]=r>>8,n[i++]=255&r}else{var{target:n,position:i,targetView:s}=t(r+5);n[i++]=198,s.setUint32(i,r),i+=4}n.set(e,i)}function Ie(e,t,r,n){let i=e.length;switch(i){case 1:t[r++]=212;break;case 2:t[r++]=213;break;case 4:t[r++]=214;break;case 8:t[r++]=215;break;case 16:t[r++]=216;break;default:i<256?(t[r++]=199,t[r++]=i):i<65536?(t[r++]=200,t[r++]=i>>8,t[r++]=255&i):(t[r++]=201,t[r++]=i>>24,t[r++]=i>>16&255,t[r++]=i>>8&255,t[r++]=255&i)}return t[r++]=n,t.set(e,r),r+=i}function ke(e,t,r){if(be.length>0){de.setUint32(be.position+e,we+r-be.position-e),be.stringsPosition=we-e;let n=be;be=null,t(n[0]),t(n[1])}}oe=[Date,Set,Error,RegExp,ArrayBuffer,Object.getPrototypeOf(Uint8Array.prototype).constructor,DataView,d],se=[{pack(e,t,r){let n=e.getTime()/1e3;if((this.useTimestamp32||0===e.getMilliseconds())&&n>=0&&n<4294967296){let{target:e,targetView:r,position:i}=t(6);e[i++]=214,e[i++]=255,r.setUint32(i,n)}else if(n>0&&n<4294967296){let{target:r,targetView:i,position:s}=t(10);r[s++]=215,r[s++]=255,i.setUint32(s,4e6*e.getMilliseconds()+(n/1e3/4294967296>>0)),i.setUint32(s+4,n)}else if(isNaN(n)){if(this.onInvalidDate)return t(0),r(this.onInvalidDate());let{target:e,targetView:n,position:i}=t(3);e[i++]=212,e[i++]=255,e[i++]=255}else{let{target:r,targetView:i,position:s}=t(15);r[s++]=199,r[s++]=12,r[s++]=255,i.setUint32(s,1e6*e.getMilliseconds()),i.setBigInt64(s+4,BigInt(Math.floor(n)))}}},{pack(e,t,r){if(this.setAsEmptyObject)return t(0),r({});let n=Array.from(e),{target:i,position:s}=t(this.moreTypes?3:0);this.moreTypes&&(i[s++]=212,i[s++]=115,i[s++]=0),r(n)}},{pack(e,t,r){let{target:n,position:i}=t(this.moreTypes?3:0);this.moreTypes&&(n[i++]=212,n[i++]=101,n[i++]=0),r([e.name,e.message,e.cause])}},{pack(e,t,r){let{target:n,position:i}=t(this.moreTypes?3:0);this.moreTypes&&(n[i++]=212,n[i++]=120,n[i++]=0),r([e.source,e.flags])}},{pack(e,t){this.moreTypes?Ue(e,16,t):Ee(le?Buffer.from(e):new Uint8Array(e),t)}},{pack(e,t){let r=e.constructor;r!==ce&&this.moreTypes?Ue(e,K.indexOf(r.name),t):Ee(e,t)}},{pack(e,t){this.moreTypes?Ue(e,17,t):Ee(le?Buffer.from(e):new Uint8Array(e),t)}},{pack(e,t){let{target:r,position:n}=t(1);r[n]=193}}];let ve=new Ae({useRecords:!1});const Be=ve.pack,Oe=ve.pack,_e=Ae,{NEVER:xe,ALWAYS:Te,DECIMAL_ROUND:Me,DECIMAL_FIT:je}=ne,Re=512,De=1024,Ve=2048;const Le=function(e,t={}){if(!e||"object"!=typeof e)throw new Error("first argument must be an Iterable, Async Iterable, Iterator, Async Iterator, or a promise");const r=new S(t);let n;const i=e=>{let t;n&&(e=Buffer.concat([n,e]),n=void 0);try{t=r.unpackMultiple(e)}catch(r){if(!r.incomplete)throw r;n=e.slice(r.lastPosition),t=r.values}return t};return"function"==typeof e[Symbol.iterator]?function*(){for(const t of e)yield*i(t)}():"function"==typeof e[Symbol.asyncIterator]?async function*(){for await(const t of e)yield*i(t)}():void 0},Fe=function(e,t={}){if(e&&"object"==typeof e){if("function"==typeof e[Symbol.iterator])return function*(e,t){const r=new Ae(t);for(const t of e)yield r.pack(t)}(e,t);if("function"==typeof e.then||"function"==typeof e[Symbol.asyncIterator])return async function*(e,t){const r=new Ae(t);for await(const t of e)yield r.pack(t)}(e,t);throw new Error("first argument must be an Iterable, Async Iterable, Iterator, Async Iterator, or a Promise")}throw new Error("first argument must be an Iterable, Async Iterable, or a Promise for an Async Iterable")};e.ALWAYS=Te,e.C1=y,e.DECIMAL_FIT=je,e.DECIMAL_ROUND=Me,e.Decoder=Q,e.Encoder=_e,e.FLOAT32_OPTIONS=ne,e.NEVER=xe,e.Packr=Ae,e.RESERVE_START_SPACE=Ve,e.RESET_BUFFER_MODE=De,e.REUSE_BUFFER_MODE=Re,e.Unpackr=S,e.addExtension=function(e){if(e.Class){if(!e.pack&&!e.write)throw new Error("Extension has no pack or write function");if(e.pack&&!e.type)throw new Error("Extension has no type (numeric code to identify the extension)");oe.unshift(e.Class),se.unshift(e)}!function(e){e.unpack?h[e.type]=e.unpack:h[e.type]=e}(e)},e.clearSource=G,e.decode=re,e.decodeIter=Le,e.encode=Oe,e.encodeIter=Fe,e.isNativeAccelerationEnabled=!1,e.mapsAsObjects=!0,e.pack=Be,e.roundFloat32=function(e){ae[0]=e;let t=H[(127&ue[3])<<1|ue[2]>>7];return(t*e+(e>0?.5:-.5)>>0)/t},e.unpack=ee,e.unpackMultiple=te,e.useRecords=!1}));


return module.exports; })();
  // RisuAI RPack protocol lookup, from src/ts/rpack/rpack_map.bin.
  const RPACK_DECODE = new Uint8Array([44,247,132,139,201,101,251,182,159,174,179,3,45,1,105,116,31,228,163,236,238,92,52,33,147,74,15,106,226,98,2,158,34,156,253,60,252,113,199,198,173,89,103,5,112,109,138,68,18,250,36,134,95,175,209,122,71,206,254,80,99,221,81,6,111,24,224,82,168,9,157,86,115,76,184,83,108,195,160,14,25,207,62,13,126,7,50,104,70,234,72,249,153,46,171,164,73,32,94,85,53,56,12,188,211,177,88,22,121,40,10,26,225,242,205,196,57,219,162,186,96,114,118,125,149,239,127,200,192,222,55,148,191,181,20,129,146,37,69,172,231,245,102,167,43,54,90,193,19,227,75,58,232,141,131,27,124,39,176,154,66,235,135,170,220,84,142,120,38,210,87,41,212,183,248,47,143,137,117,240,65,119,194,30,255,216,21,17,229,4,151,23,243,49,208,155,0,215,202,180,79,42,59,217,178,107,218,93,161,63,48,97,189,145,61,78,230,223,190,77,130,140,29,35,16,152,100,244,133,51,123,144,67,187,169,136,241,214,165,28,246,204,110,185,91,11,150,237,213,233,197,203,8,166,128,64]);
  const FILE_LIMIT = 10 * 1024 * 1024;

  async function unpackCompressed(bytes) {
    if (typeof DecompressionStream === 'undefined') throw new Error('이 브라우저는 압축 해제를 지원하지 않아. 최신 Chrome·Edge·Firefox로 열어 줘.');
    const format = bytes[0] === 31 && bytes[1] === 139 ? 'gzip' :
      (bytes[0] & 15) === 8 && ((bytes[0] << 8) + bytes[1]) % 31 === 0 ? 'deflate' : 'deflate-raw';
    const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format)).getReader();
    const chunks = []; let size = 0;
    try {
      while (true) {
        const chunk = await reader.read(); if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > FILE_LIMIT) { await reader.cancel(); throw new Error('압축 해제한 프리셋이 10MB를 넘어.'); }
        chunks.push(chunk.value);
      }
    } finally { reader.releaseLock(); }
    const result = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
    return result;
  }

  async function exportPresetFile(preset) {
    if (typeof CompressionStream === 'undefined') throw new Error('이 브라우저는 .risup 저장에 필요한 압축을 지원하지 않아. 최신 브라우저로 열어 줘.');
    if (!globalThis.crypto?.subtle) throw new Error('이 환경에서는 .risup 저장에 필요한 암호화를 사용할 수 없어. 독립 HTML 파일을 최신 브라우저에서 열어 줘.');
    const clean = sanitizePreset(parsePreset(JSON.stringify(preset)));
    // Match RisuAI's preset export: omit connection secrets and per-user endpoints.
    for (const key of ['openAIKey', 'proxyKey', 'forceReplaceUrl', 'forceReplaceUrl2', 'textgenWebUIStreamURL', 'textgenWebUIBlockingURL']) clean[key] = '';
    const packed = MSGPACK.pack(clean);
    if (packed.byteLength > FILE_LIMIT) throw new Error('저장할 프리셋이 10MB를 넘어.');
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode('risupreset'));
    const key = await globalThis.crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt']);
    // The fixed IV and format key are required by RisuAI's file format.
    const encrypted = await globalThis.crypto.subtle.encrypt({name:'AES-GCM', iv:new Uint8Array(12)}, key, packed);
    const envelope = MSGPACK.pack({presetVersion:2, type:'preset', preset:encrypted});
    if (envelope.byteLength > FILE_LIMIT) throw new Error('저장할 프리셋이 10MB를 넘어.');
    const stream = new Blob([envelope]).stream().pipeThrough(new CompressionStream('gzip'));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    if (compressed.byteLength > FILE_LIMIT) throw new Error('저장할 파일이 10MB를 넘어.');
    const encodeMap = new Uint8Array(256);
    RPACK_DECODE.forEach((value, index) => { encodeMap[value] = index; });
    return compressed.map(value => encodeMap[value]);
  }

  async function importPresetFile(file) {
    if (!file || file.size > FILE_LIMIT) throw new Error('파일은 10MB 이하로 불러와 줘.');
    if (!/\.risup(?:reset)?$/i.test(file.name)) return parsePreset(await file.text());
    if (!globalThis.crypto?.subtle) throw new Error('이 환경에서는 프리셋 복호화를 사용할 수 없어. 독립 HTML 파일을 최신 브라우저에서 열어 줘.');
    try {
      let bytes = new Uint8Array(await file.arrayBuffer());
      if (/\.risup$/i.test(file.name)) bytes = bytes.map(value => RPACK_DECODE[value]);
      const wrapper = MSGPACK.unpack(await unpackCompressed(bytes));
      if (!object(wrapper) || wrapper.type !== 'preset') throw new Error('RisuAI 프리셋 파일이 아니야.');
      if (![0, 2].includes(wrapper.presetVersion)) throw new Error('지원하지 않는 프리셋 포맷 버전: ' + String(wrapper.presetVersion));
      let encrypted = wrapper.preset ?? wrapper.pres;
      if (encrypted instanceof ArrayBuffer) encrypted = new Uint8Array(encrypted);
      if (!(encrypted instanceof Uint8Array) || encrypted.length < 16) throw new Error('프리셋 암호화 데이터가 없거나 손상됐어.');
      const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode('risupreset'));
      const key = await globalThis.crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['decrypt']);
      const decrypted = await globalThis.crypto.subtle.decrypt({name:'AES-GCM', iv:new Uint8Array(12)}, key, encrypted);
      return parsePreset(JSON.stringify(MSGPACK.unpack(new Uint8Array(decrypted))));
    } catch (error) {
      if (error.name === 'OperationError') throw new Error('프리셋 복호화에 실패했어. 파일이 손상됐거나 지원하지 않는 암호화 방식일 수 있어.');
      throw new Error('프리셋을 열지 못했어: ' + error.message);
    }
  }
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const clone = v => JSON.parse(JSON.stringify(v));
  const canonical = v => JSON.stringify(v, function (k, x) {
    if (!object(x)) return x;
    const out = Object.create(null);
    Object.keys(x).sort().forEach(key => { out[key] = x[key]; });
    return out;
  });
  const same = (a, b) => canonical(a) === canonical(b);
  const SECRET_FIELDS = new Set(['openAIKey', 'proxyKey', 'openrouterKey', 'novellistAPI',
    'huggingfaceKey', 'mistralKey', 'nanogptKey', 'deepLKey', 'deeplKey', 'fishSpeechKey']);

  function inspectJSON(value) {
    if (Array.isArray(value)) value.forEach(inspectJSON);
    else if (object(value)) Object.keys(value).forEach(k => {
      if (['__proto__', 'prototype', 'constructor'].includes(k)) throw new Error('허용하지 않는 JSON 키: ' + k);
      inspectJSON(value[k]);
    });
    return value;
  }
  function parseJSON(text) {
    if (text.length > 10 * 1024 * 1024) throw new Error('JSON은 10MB 이하로 불러와 줘.');
    return inspectJSON(JSON.parse(text.replace(/^\uFEFF/, '')));
  }
  function parsePreset(text) {
    const v = parseJSON(text);
    if (!object(v) || own(v, 'characters') || own(v, 'botPresets') || own(v, 'prompts') || own(v, 'parameters') ||
        !['mainPrompt', 'jailbreak', 'globalNote', 'promptTemplate', 'customPromptTemplateToggle'].some(k => own(v, k))) {
      throw new Error('RisuAI에서 내보낸 단일 프리셋이 필요해. 세이브 파일·다른 앱 프리셋은 지원하지 않아.');
    }
    for (const k of ['mainPrompt', 'jailbreak', 'globalNote', 'customPromptTemplateToggle', 'templateDefaultVariables']) {
      if (own(v, k) && v[k] !== null && typeof v[k] !== 'string') throw new Error(k + '는 문자열이어야 해.');
    }
    if (v.promptTemplate != null && (!Array.isArray(v.promptTemplate) || v.promptTemplate.some(x => !object(x) || typeof x.type !== 'string'))) {
      throw new Error('promptTemplate은 type이 있는 프롬프트 객체 배열이어야 해.');
    }
    return v;
  }
  function sanitizePreset(v) {
    const out = clone(v);
    Object.keys(out).forEach(k => {
      if (SECRET_FIELDS.has(k) || /(?:api.?key|access.?token|refresh.?token|secret|password)$/i.test(k)) out[k] = '';
    });
    return out;
  }
  const Core = { parseJSON, parsePreset, importPresetFile, exportPresetFile, sanitizePreset, same };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Core; return; }
  globalThis.PresetEditor = Core;
  if (typeof document === 'undefined') return;

  // The UI below runs in the plugin's own iframe, or as an offline standalone HTML.
  startUI(Core).catch(e => { console.error(e); document.body.textContent = '에디터 시작 오류: ' + e.message; });

  function installEditorDesign() {
    const LIGHT = '--bg:#f4f2ec;--bg2:#ece9e0;--surface:#fffdf8;--surface2:#f3f0e8;--surface3:#e7e3d7;--line:#ddd8ca;--line2:#c2bba8;--text:#24221d;--muted:#5f5b50;--faint:#8a8576;' +
      '--accent:#a85a06;--accent-ink:#fff;--accent-soft:#a85a0618;--info:#2858b8;--info-soft:#2858b816;--ok:#18704b;--danger:#b42b2b;--shadow:0 12px 32px rgba(60,48,20,.18)';
    if (document.getElementById('preset-editor-design')) return;
    const style = document.createElement('style');
    style.id = 'preset-editor-design';
    style.textContent = `
      :root{color-scheme:dark;--bg:#111318;--bg2:#161920;--surface:#1b1e27;--surface2:#232734;--surface3:#2c3142;--line:#2c3140;--line2:#3f465c;--text:#eceae4;--muted:#a3a9bb;--faint:#8b91a6;
        --accent:#efb866;--accent-ink:#241802;--accent-soft:#efb86624;--info:#8cb5ff;--info-soft:#8cb5ff22;--ok:#72d6a9;--danger:#ff8e8e;
        --shadow:0 14px 36px rgba(0,0,0,.45);--prompt-font:14px;
        --ui:'Pretendard Variable',Pretendard,system-ui,-apple-system,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif;
        --mono:ui-monospace,'Cascadia Code','D2Coding',Consolas,'Noto Sans Mono CJK KR',monospace}
      :root[data-theme=light]{color-scheme:light;${LIGHT}}
      @media (prefers-color-scheme:light){:root:not([data-theme=dark]){color-scheme:light;${LIGHT}}}
      *{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
      body{margin:0;background:var(--bg);color:var(--text);font:14px/1.6 var(--ui);-webkit-font-smoothing:antialiased}
      h1,h2,h3,p,ul{margin:0}h1{font-size:17px;font-weight:700;letter-spacing:-.01em}h2{font-size:18px;font-weight:700;letter-spacing:-.015em}h3{font-size:13.5px;font-weight:650}
      [hidden]{display:none!important}button,input,select,textarea{font:inherit;color:inherit}button{cursor:pointer}
      :focus-visible{outline:2px solid var(--info);outline-offset:2px;border-radius:6px}
      h2:focus{outline:none}
      .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:6px 14px;border:1px solid var(--line2);border-radius:9px;background:var(--surface2);font-weight:550;white-space:nowrap;transition:background .15s,border-color .15s,filter .15s}
      .btn:hover:not(:disabled){background:var(--surface3);border-color:var(--faint)}.btn:disabled{opacity:.45;cursor:not-allowed}
      .btn.primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink);font-weight:700}.btn.primary:hover:not(:disabled){background:var(--accent);filter:brightness(1.08)}
      .btn.ghost{background:transparent;border-color:transparent;color:var(--muted)}.btn.ghost:hover:not(:disabled){background:var(--surface2);color:var(--text);border-color:transparent}
      .btn.danger{color:var(--danger)}.btn.danger-solid{background:var(--danger);border-color:var(--danger);color:#1a0505;font-weight:700}
      .btn.sm{min-height:30px;padding:3px 10px;font-size:12.5px;border-radius:7px}
      .btn.icon{padding:0;width:34px;min-width:34px}.btn.sm.icon{width:30px;min-width:30px}
      .count{display:inline-grid;place-items:center;min-width:19px;height:19px;padding:0 5px;border-radius:10px;background:var(--accent);color:var(--accent-ink);font-size:11px;font-weight:800}
      .field{display:grid;gap:5px;min-width:0}.field>span{font-size:12.5px;color:var(--muted);font-weight:600}
      input[type=text],input[type=search],select,textarea{width:100%;min-height:36px;padding:7px 10px;border:1px solid var(--line2);border-radius:9px;background:var(--bg2);color:var(--text)}
      textarea{font:12.5px/1.65 var(--mono);resize:vertical;min-height:110px}::placeholder{color:var(--faint)}
      select{max-width:100%}
      .chrome{position:sticky;top:0;z-index:30;background:var(--bg);border-bottom:1px solid var(--line)}
      @supports (background:color-mix(in srgb,red,blue)){.chrome{background:color-mix(in srgb,var(--bg) 90%,transparent);backdrop-filter:blur(12px)}}
      .topbar,.stepbar,main{max-width:1280px;margin:0 auto}.topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 20px}
      .brand{display:flex;align-items:center;gap:12px;min-width:0}
      .mark{display:grid;place-items:center;flex:none;width:36px;height:36px;border-radius:10px;background:var(--accent);color:var(--accent-ink);font-size:18px;font-weight:800}
      .top-actions{display:flex;gap:8px;align-items:center}
      .stepbar{display:flex;align-items:center;gap:18px;padding:0 20px;overflow-x:auto}
      .step{display:flex;align-items:center;gap:8px;padding:12px;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--muted);font-weight:600;white-space:nowrap}
      .step[aria-selected=true]{color:var(--text);border-bottom-color:var(--accent)}
      .step:hover:not(:disabled){color:var(--text)}.step:disabled{opacity:.38;cursor:not-allowed}
      main{padding:22px 20px 90px;display:grid;gap:16px}.stack{display:grid;gap:16px;min-width:0}
      .card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:22px;min-width:0}
      .card-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-bottom:16px}
      .lead{color:var(--muted);margin-top:4px;max-width:72ch}.hint{color:var(--muted);font-size:12.5px}
      .badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:999px;background:var(--surface3);color:var(--muted);font-size:11.5px;font-weight:650;white-space:nowrap}
      .badge.changed{background:var(--info-soft);color:var(--info)}.badge.custom{background:var(--accent-soft);color:var(--accent)}
      .row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.spread{justify-content:space-between}.grow{flex:1;min-width:0}.grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:end}
      .actionbar{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap}
      .drop{display:grid;gap:2px;justify-items:center;width:100%;padding:24px 12px;border:1.5px dashed var(--line2);border-radius:10px;background:transparent;color:var(--muted);text-align:center;transition:border-color .15s,background .15s}
      .drop small{font-size:12px}.drop:hover{border-color:var(--accent);background:var(--accent-soft)}
      .viewer-tools{display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-size:12.5px}.viewer-tools label{display:flex;gap:6px;align-items:center}.viewer-tools select{width:auto;min-height:30px;padding:3px 8px}
      .empty{padding:22px 14px;text-align:center;color:var(--muted)}
      details>summary{cursor:pointer}
      .toast{display:flex;align-items:flex-start;gap:8px;padding:10px 8px 10px 14px;border:1px solid var(--line2);border-radius:12px;background:var(--surface3);box-shadow:var(--shadow);pointer-events:auto;animation:rise .2s ease-out}
      .toast.ok{border-color:var(--ok)}.toast.error{border-color:var(--danger)}.toast-text{flex:1;padding-top:4px;overflow-wrap:anywhere}
      dialog{padding:0;color:var(--text);background:var(--surface);border:1px solid var(--line2);border-radius:16px;box-shadow:var(--shadow)}dialog::backdrop{background:rgba(5,6,10,.62)}
      .modal{width:min(440px,calc(100vw - 24px))}.dlg-actions{display:flex;justify-content:flex-end;gap:8px}
      @keyframes rise{from{opacity:0;transform:translateY(8px)}}
      @media (prefers-reduced-motion:reduce){*,::before,::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
      @media (max-width:820px){.grid2{grid-template-columns:1fr}
        .topbar{padding:10px 14px}.stepbar{padding:0 14px}main{padding:16px 14px 90px}.card{padding:16px}}`;
    document.head.appendChild(style);
  }

  // Single-preset workspace. Cards store content only; placement belongs to this document.
  async function startUI(C) {
    if (!document.body) await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
    document.title = '프리셋 에디터';
    document.documentElement.lang = 'ko';
    installEditorDesign();
    const api = globalThis.Risuai || globalThis.risuai;
    const storage = {
      get: key => api ? api.pluginStorage.getItem(key) : Promise.resolve(localStorage.getItem(key)),
      set: (key, value) => api ? api.pluginStorage.setItem(key, value) : Promise.resolve(localStorage.setItem(key, value))
    };
    const CARD_KEY = 'preset-editor:custom-cards:v1';
    const uid = () => globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
    const state = { tab: 'edit', original: null, draft: null, meta: [], selected: '', editing: '', fileName: '',
      history: [], future: [], historyGroup: '', saved: '', cards: [], cardsReady: false, cardBusy: false,
      cardId: '', cardBefore: '', cardMessage: '', cardError: false, cardSettings: { type: 'plain', type2: 'normal', role: 'system' }, drag: null, gap: null, busy: false, panel: true };
    const el = (tag, text, cls) => { const node = document.createElement(tag); if (text != null) node.textContent = text; if (cls) node.className = cls; return node; };
    const $ = id => root.querySelector('#pe-' + id);
    const btn = (label, fn, cls = 'btn sm') => { const b = el('button', label, cls); b.type = 'button'; b.addEventListener('click', guard(fn)); return b; };
    const guard = fn => async (...args) => { try { await fn(...args); } catch (e) { console.error(e); notify(e.message, true); } };
    const labels = { plain: '순수 프롬프트', jailbreak: '탈옥 프롬프트', cot: '생각의 사슬', chatML: 'ChatML',
      persona: '페르소나', description: '캐릭터 설명', lorebook: '로어북', chat: '챗', authornote: '작가의 노트',
      memory: '장기 기억', postEverything: '최종 삽입 프롬프트', cache: '캐시 포인트' };
    const textKeys = ['text', 'innerFormat', 'defaultText'];
    const promptTypes = ['plain', 'jailbreak', 'cot', 'chatML', 'persona', 'description', 'lorebook', 'chat', 'authornote', 'memory', 'postEverything', 'cache'];
    const specialTypes = { normal: '특수 타입 없음', main: '메인 프롬프트', globalNote: '글로벌 노트' };
    const plainTypes = ['plain', 'jailbreak', 'cot'];
    const formatTypes = ['persona', 'description', 'lorebook', 'memory', 'authornote', 'postEverything'];
    const roles = { system: '시스템', user: '유저', bot: '캐릭터' };
    const cardUsesText = type => !['chat', 'cache'].includes(type);
    function cardSettings(card = {}) {
      const type = card.type ?? 'plain', type2 = card.type2 ?? 'normal';
      let role = card.role ?? (formatTypes.includes(type) ? '' : type === 'cache' ? 'all' : 'system');
      if (type === 'cache') role = ['bot', 'char'].includes(role) ? 'assistant' : role || 'all';
      else { if (['assistant', 'char'].includes(role)) role = 'bot'; if (role === 'all' || (!role && plainTypes.includes(type))) role = 'system'; }
      return { type, type2, role };
    }
    function cardFromBlock(block) {
      return { name: titleOf(block), text: bodyOf(block), ...cardSettings({ type: block.type, type2: block.type2,
        role: formatTypes.includes(block.type) ? block.role2 ?? '' : block.role }) };
    }
    function blockFromCard(card) {
      const settings = cardSettings(card), block = { type: settings.type, name: card.name };
      if (plainTypes.includes(block.type)) Object.assign(block, { text: card.text, type2: settings.type2, role: settings.role });
      else if (formatTypes.includes(block.type)) { block.innerFormat = card.text; if (settings.role) block.role2 = settings.role; }
      else if (block.type === 'chatML') block.text = card.text;
      else if (block.type === 'cache') block.role = settings.role;
      else if (block.type !== 'chat') Object.assign(block, { text: card.text, role: settings.role });
      setPromptType(block, block.type); return block;
    }
    const titleOf = block => block.name || labels[block.type] || block.type;
    const bodyOf = block => {
      const keys = plainTypes.includes(block.type) || block.type === 'chatML' ? ['text'] : formatTypes.includes(block.type) ? ['innerFormat', ...(block.type === 'authornote' ? ['defaultText'] : [])] : promptTypes.includes(block.type) ? [] : textKeys;
      return keys.filter(key => typeof block[key] === 'string' && block[key]).map(key => block[key]).join('\n\n');
    };
    const css = el('style');
    css.textContent = `
      /* Scrollbars: thin, rounded, tinted from the existing theme tokens. */
      *::-webkit-scrollbar{width:12px;height:12px}
      *::-webkit-scrollbar-track,*::-webkit-scrollbar-corner{background:transparent}
      *::-webkit-scrollbar-thumb{background:var(--line2);border:3px solid transparent;border-radius:999px;background-clip:padding-box}
      *::-webkit-scrollbar-thumb:hover{background:var(--faint);border:3px solid transparent;background-clip:padding-box}
      *::-webkit-scrollbar-thumb:active{background:var(--muted);border:3px solid transparent;background-clip:padding-box}
      *::-webkit-resizer{background:transparent}
      @supports not selector(::-webkit-scrollbar){*{scrollbar-width:thin;scrollbar-color:var(--line2) transparent}}
      .pe-top .topbar{max-width:1440px;min-height:56px;padding-top:0;padding-bottom:0}.pe-top .brand,.pe-top .top-actions{padding:9px 0}
      .pe-tabs{display:flex;gap:8px;align-self:stretch;margin-right:auto}.pe-tabs .step{min-height:46px}
      .pe-main{max-width:1440px}.pe-top .pe-main{padding-bottom:24px}
      .pe-welcome{max-width:720px;margin:42px auto;width:100%;padding:32px;flex:none}.pe-welcome .drop{margin:22px 0;padding:48px 20px}
      .pe-heading{padding:12px 16px;flex:none}.pe-bar{display:flex;align-items:center;justify-content:space-between;gap:10px 16px;flex-wrap:wrap}
      .pe-name-field{flex:1 1 300px;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:10px}.pe-name-field>span{white-space:nowrap}.pe-name-field input{font-size:18px;font-weight:700;max-width:520px}
      .pe-bar-actions{flex:none}.pe-heading .pe-status{min-height:0;margin-top:6px;overflow-wrap:anywhere}
      .pe-workspace{display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:18px;align-items:start}.pe-workspace.no-library{grid-template-columns:minmax(0,1fr)}
      .pe-document{min-width:0;display:flex;flex-direction:column}
      .pe-doc-head{display:flex;align-items:center;justify-content:space-between;gap:8px 16px;flex-wrap:wrap;margin-bottom:6px;flex:none}.pe-doc-head .viewer-tools{gap:8px 12px}
      .pe-document>.hint{margin-bottom:10px;flex:none}
      .pe-blocks{position:relative;max-height:65dvh;min-height:240px;overflow:auto;padding:2px 8px 12px 2px;overscroll-behavior:contain}
      .pe-block{border:1px solid var(--line);border-radius:12px;background:var(--surface);overflow:hidden;min-width:0;transition:border-color .15s}
      .pe-block.selected{border-color:var(--info)}.pe-block.custom{border-left:3px solid var(--accent)}
      .pe-block-head{display:flex;align-items:center;gap:6px;padding:10px 12px;background:var(--surface2);flex-wrap:wrap}
      .pe-block-title{border:0;background:transparent;padding:2px 4px;text-align:left;font-weight:650;overflow-wrap:anywhere;white-space:normal;flex:1;min-width:100px}
      .pe-block-text{margin:0;padding:14px 16px;white-space:pre-wrap;overflow-wrap:anywhere;font:var(--prompt-font)/1.8 var(--mono);max-height:270px;overflow:auto}
      .pe-block-meta{padding:8px 14px;border-top:1px solid var(--line);color:var(--muted);font-size:12px}.pe-block.collapsed .pe-block-text,.pe-block.collapsed .pe-block-meta,.pe-block.editing .pe-block-text,.pe-block.editing .pe-block-meta{display:none}
      .pe-grip{cursor:grab;touch-action:none;color:var(--faint);font-size:18px}.pe-grip:active{cursor:grabbing}.pe-dragging{opacity:.45}
      .pe-gap{height:12px;position:relative;transition:height .1s}.pe-gap.active{height:40px;background:var(--accent-soft);border-radius:8px}
      .pe-gap.active::after{content:'여기에 삽입';position:absolute;inset:0;display:grid;place-items:center;color:var(--accent);font-size:12px;border:1px dashed var(--accent);border-radius:8px}
      .pe-block-editor{display:grid;gap:12px;padding:16px;border-top:1px solid var(--line)}.pe-block-editor textarea{min-height:220px;font-size:var(--prompt-font)}
      .pe-selects{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;align-items:end}.pe-contents{display:contents}
      .pe-side{padding:16px}.pe-side .card-head{margin-bottom:10px}.pe-side-actions{margin-bottom:8px}.pe-card-list{display:grid;gap:10px;margin-top:12px;align-content:start}
      .pe-side .pe-card-list{max-height:330px;overflow:auto;padding:2px}.pe-snippet{border:1px solid var(--line);border-radius:10px;padding:12px;background:var(--bg2);min-width:0}
      .pe-snippet[draggable=true]{cursor:grab}.pe-snippet:hover{border-color:var(--line2)}.pe-snippet h3{overflow-wrap:anywhere}.pe-snippet pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.65 var(--mono);color:var(--muted);margin:8px 0;max-height:100px;overflow:auto}
      .pe-manager{display:grid;grid-template-columns:minmax(0,1fr) minmax(340px,1fr);gap:18px;align-items:start}
      .pe-card-form{display:flex;flex-direction:column;gap:14px}.pe-card-form textarea{min-height:330px;font-size:14px}.pe-grow{flex:1 1 auto;grid-template-rows:auto minmax(0,1fr)}.pe-grow textarea{height:100%}
      .pe-card-form .actionbar{margin-top:auto}.pe-card-form .actionbar .hint{flex:1;min-width:0;margin-right:auto}
      .pe-status{min-height:20px;color:var(--muted);font-size:12.5px}.pe-fields{padding:0 16px;margin-top:12px;flex:none}.pe-fields textarea{min-height:200px}.pe-fields>summary{padding:10px 0;color:var(--muted);font-weight:650}.pe-fields[open]{padding-bottom:16px}.pe-fields[open] .stack{padding-top:8px}
      #pe-card-draft-status:empty{display:none}#pe-card-draft-status[data-error=true]{color:var(--danger)}
      .pe-dialog-body{display:grid;gap:14px;padding:22px}
      .pe-blocks:empty::before{content:'블록이 없어. 커스텀 카드를 여기로 드래그해서 첫 블록을 추가해.';display:block;padding:50px 20px;text-align:center;color:var(--muted)}
      .pe-feedback{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);width:min(580px,calc(100vw - 24px));z-index:90}.pe-feedback:empty{display:none}
      @media(max-width:1000px){.pe-workspace{grid-template-columns:minmax(0,1fr) 270px}.pe-manager{grid-template-columns:minmax(0,1fr) minmax(300px,1fr)}}
      /* Desktop: app-style shell. Header stays put; block list, library and card form each scroll on their own. */
      @media(min-width:761px){
        .pe-top{height:100vh;height:100dvh;display:flex;flex-direction:column}
        .pe-top .chrome{position:static;flex:none}
        .pe-top .pe-main{flex:1;min-height:0;width:100%;display:flex;flex-direction:column;gap:0;padding:14px 20px 16px}
        #pe-edit,#pe-cards{flex:1;min-height:0;display:flex;flex-direction:column;overflow:auto}
        #pe-loaded{flex:1;min-height:0;display:flex;flex-direction:column;gap:12px}
        .pe-workspace{flex:1;min-height:0;align-items:stretch}
        .pe-document{min-height:0}.pe-blocks{flex:1;min-height:120px;max-height:none}
        .pe-fields[open]{max-height:40dvh;overflow:auto}.pe-fields textarea{min-height:140px}
        .pe-side{min-height:0;display:flex;flex-direction:column}.pe-side .pe-card-list{flex:1;min-height:0;max-height:none}
        #pe-cards>.card-head{flex:none;margin-bottom:14px}.pe-manager{flex:1;min-height:0;align-items:stretch}
        .pe-library{display:flex;flex-direction:column;min-height:0}.pe-library .pe-card-list{flex:1;min-height:0;overflow:auto}
        .pe-card-form{min-height:0;overflow:auto}.pe-card-form textarea{min-height:200px}
      }
      @media(max-width:760px){.pe-workspace,.pe-manager{grid-template-columns:minmax(0,1fr)}.pe-side .pe-card-list{max-height:330px}.pe-blocks{max-height:65dvh}.pe-welcome{margin:16px auto;padding:22px}
        .pe-top .topbar{flex-wrap:wrap;padding:0 14px;gap:0 8px}.pe-tabs{order:3;flex:1 0 100%;margin:0;gap:0}.pe-top .top-actions{gap:3px;margin-left:auto}.pe-top .top-actions .btn{padding:5px 8px}
        .pe-name-field{flex-basis:100%}.pe-bar-actions{width:100%}.pe-bar-actions .primary{flex:1}.pe-card-form .actionbar{margin-top:0}}
    `;
    document.head.appendChild(css);
    const root = el('div', null, 'pe-top');
    root.innerHTML = `
      <div class="chrome"><header class="topbar"><div class="brand"><span class="mark" aria-hidden="true">✎</span><div><h1>프리셋 에디터</h1></div></div>
        <nav class="pe-tabs" role="tablist" aria-label="에디터 화면"><button id="pe-tab-edit" type="button" class="step" role="tab" aria-controls="pe-edit" aria-selected="true">프리셋 편집</button><button id="pe-tab-cards" type="button" class="step" role="tab" aria-controls="pe-cards" aria-selected="false" tabindex="-1">커스텀 보관함 <span id="pe-card-count" class="count">0</span></button></nav>
        <div class="top-actions"><button id="pe-theme" type="button" class="btn icon" aria-label="화면 테마 바꾸기">◐</button><button id="pe-close" type="button" class="btn" hidden>닫기</button></div></header></div>
      <main class="pe-main">
        <section id="pe-edit" role="tabpanel" aria-labelledby="pe-tab-edit">
          <div id="pe-welcome" class="card pe-welcome"><h2>프리셋 파일 열기</h2><button id="pe-open-empty" class="drop" type="button"><small>여기로 드래그하거나 클릭해서 선택 · .risup · .risupreset · .json</small></button></div>
          <div id="pe-loaded" hidden>
            <div class="card pe-heading">
              <div class="pe-bar"><label class="field pe-name-field"><span>프리셋 이름</span><input id="pe-name" type="text" aria-label="프리셋 이름"></label><div class="row pe-bar-actions"><button id="pe-cancel" type="button" class="btn sm danger">편집 취소</button><button id="pe-undo" type="button" class="btn sm" disabled>↶ 실행 취소</button><button id="pe-redo" type="button" class="btn sm" disabled>↷ 다시 실행</button><button id="pe-download" type="button" class="btn primary">편집한 프리셋 다운로드</button></div></div>
              <p id="pe-preset-status" class="pe-status" role="status"></p>
            </div>
            <div id="pe-workspace" class="pe-workspace">
              <div class="pe-document">
                <div class="pe-doc-head"><h2>프리셋 블록 <span id="pe-block-count" class="badge"></span></h2><div class="viewer-tools"><button id="pe-add-block" type="button" class="btn sm">＋ 새 블록 추가</button><button id="pe-fold-all" type="button" class="btn ghost sm">모두 접기</button><button id="pe-unfold-all" type="button" class="btn ghost sm">모두 펼치기</button><label>글자 크기 <select id="pe-font"><option value="13">13px</option><option value="14" selected>14px</option><option value="16">16px</option><option value="18">18px</option></select></label><button id="pe-toggle-panel" class="btn sm" type="button" aria-expanded="true" aria-controls="pe-sidebar">보관함 접기</button></div></div>
                <p id="pe-block-help" class="hint"></p>
                <div id="pe-blocks" class="pe-blocks" aria-label="프리셋 블록 목록"></div>
                <details class="card pe-fields"><summary>토글 편집</summary><div id="pe-fields" class="stack"></div></details>
              </div>
              <aside id="pe-sidebar" class="card pe-side" aria-label="커스텀 카드 보관함"><div class="card-head"><div><h2>커스텀 보관함</h2><p class="hint">카드를 블록 사이로 드래그해.</p></div></div><div class="row pe-side-actions"><button id="pe-manage-cards" type="button" class="btn sm">카드 관리</button><button id="pe-new-side" type="button" class="btn ghost sm">＋ 카드 작성</button></div><input id="pe-side-search" type="search" placeholder="이름 · 본문 검색" aria-label="삽입할 카드 검색"><div id="pe-side-list" class="pe-card-list"></div></aside>
            </div>
          </div>
        </section>
        <section id="pe-cards" role="tabpanel" aria-labelledby="pe-tab-cards" hidden>
          <div class="card-head"><div><h2>커스텀 카드 보관함</h2><p class="lead">자주 쓰는 구문을 저장해.</p></div><button id="pe-new-card" type="button" class="btn primary">＋ 새 카드</button></div>
          <div class="pe-manager">
            <div class="card pe-library"><input id="pe-card-search" type="search" placeholder="이름 · 본문 검색" aria-label="보관한 카드 검색"><div id="pe-card-list" class="pe-card-list"></div></div>
            <div id="pe-card-form" class="card pe-card-form"><h3 id="pe-form-title">새 커스텀 카드</h3><label class="field"><span>카드 이름</span><input id="pe-card-name" type="text" maxlength="200"></label><div class="pe-selects"><div id="pe-card-options" class="pe-contents"></div><div id="pe-card-role" class="pe-contents" hidden></div></div><label id="pe-card-text-field" class="field pe-grow"><span>프롬프트</span><textarea id="pe-card-text" spellcheck="false" placeholder="추가할 프롬프트를 입력해."></textarea></label><div class="actionbar"><p id="pe-card-draft-status" class="hint" role="status"></p><button id="pe-card-save" type="button" class="btn primary">카드 저장</button></div></div>
          </div>
        </section>
      </main><input id="pe-file" type="file" accept=".risup,.risupreset,.json,.preset" hidden><div id="pe-feedback" class="pe-feedback" aria-live="polite"></div><dialog id="pe-dialog" class="modal"></dialog>`;
    document.body.replaceChildren(root);
    const collapsed = new Set();
    let feedbackTimer, autoScrollFrame = 0, scrollPointer = null;
    function notify(message, error = false) {
      const box = el('div', null, 'toast ' + (error ? 'error' : 'ok'));
      box.setAttribute('role', error ? 'alert' : 'status'); box.append(el('span', message, 'toast-text'), btn('✕', () => $('feedback').replaceChildren(), 'btn ghost sm icon'));
      $('feedback').replaceChildren(box); clearTimeout(feedbackTimer);
      if (!error) feedbackTimer = setTimeout(() => $('feedback')?.replaceChildren(), 6000);
    }
    function confirmAction(title, message, danger = false) {
      return new Promise(resolve => {
        const dialog = $('dialog'), form = el('div', null, 'pe-dialog-body'); dialog.returnValue = '';
        const heading = el('h2', title); heading.id = 'pe-dialog-title'; dialog.setAttribute('aria-labelledby', heading.id);
        form.append(heading, el('p', message, 'lead')); const actions = el('div', null, 'dlg-actions');
        actions.append(btn('취소', () => dialog.close('cancel'), 'btn'));
        const ok = btn(danger ? '진행' : '확인', () => dialog.close('ok'), 'btn ' + (danger ? 'danger-solid' : 'primary')); ok.dataset.confirm = 'true'; actions.append(ok); form.append(actions);
        dialog.replaceChildren(form);
        dialog.addEventListener('close', () => resolve(dialog.returnValue === 'ok'), { once: true }); dialog.showModal();
      });
    }
    function tab(name, focus = false) {
      endDrag(); state.tab = name;
      ['edit', 'cards'].forEach(key => { $(key).hidden = key !== name; $('tab-' + key).setAttribute('aria-selected', String(key === name)); $('tab-' + key).tabIndex = key === name ? 0 : -1; });
      if (focus) $('tab-' + name).focus();
      if (name === 'cards') renderCards();
    }
    function snapshot() { return clone({ draft: state.draft, meta: state.meta, selected: state.selected }); }
    function record(group = '') {
      if (!group || group !== state.historyGroup) { state.history.push(snapshot()); if (state.history.length > 60) state.history.shift(); }
      state.historyGroup = group; state.future = [];
    }
    function change(fn, group = '', redraw = true) { if (!state.draft || state.busy) return; record(group); fn(); if (redraw) renderDocument(); else updateStatus(); }
    function travel(from, to) { if (!from.length || state.busy) return; to.push(snapshot()); Object.assign(state, from.pop()); state.historyGroup = ''; state.editing = ''; renderDocument(); }
    function isDirty() { return state.draft && !C.same(state.draft, state.original); }
    function updateStatus() {
      $('loaded').inert = state.busy; $('welcome').inert = state.busy;
      $('undo').disabled = !state.history.length || state.busy; $('redo').disabled = !state.future.length || state.busy;
      $('download').disabled = !state.draft || state.busy; $('cancel').disabled = !state.draft || state.busy;
      const blocks = state.draft?.promptTemplate;
      $('add-block').disabled = !Array.isArray(blocks) || state.busy;
      $('block-count').textContent = Array.isArray(blocks) ? blocks.length + '개' : '기본 형식';
      $('preset-status').textContent = state.busy ? '파일을 처리하는 중이야…' : state.saved && C.same(state.draft, state.saved) ? '현재 내용으로 파일을 만들었어. RisuAI에서 프리셋을 가져와 적용해.' : (state.fileName ? state.fileName + ' · ' : '') + (isDirty() ? '편집한 내용이 있어.' : '프리셋을 불러왔어.');
      $('toggle-panel').textContent = state.panel ? '보관함 접기' : '보관함 펼치기'; $('toggle-panel').setAttribute('aria-expanded', String(state.panel));
      $('sidebar').hidden = !state.panel; $('workspace').classList.toggle('no-library', !state.panel);
    }
    function inputField(labelText, value, apply, multiline = true) {
      const label = el('label', null, 'field'), input = el(multiline ? 'textarea' : 'input');
      if (!multiline) input.type = 'text'; input.value = value; input.spellcheck = false; input.setAttribute('aria-label', labelText);
      label.append(el('span', labelText), input); input.addEventListener('input', () => apply(input.value));
      input.addEventListener('blur', () => { state.historyGroup = ''; }); return label;
    }
    function selectField(labelText, options, value, apply) {
      const label = el('label', null, 'field'), select = el('select'); select.setAttribute('aria-label', labelText);
      Object.entries(options).forEach(([key, text]) => { const option = el('option', text); option.value = key; select.append(option); });
      if (!own(options, value)) { const option = el('option', value || '(미지정)'); option.value = value; select.append(option); }
      select.value = value; select.addEventListener('change', () => apply(select.value)); label.append(el('span', labelText), select); return label;
    }
    function setPromptType(block, type) {
      // Retain existing content and extra fields when changing type; initialize required fields only.
      const previousRole = formatTypes.includes(block.type) ? block.role2 : block.role;
      block.type = type;
      if (plainTypes.includes(type) || type === 'chatML') {
        if (typeof block.text !== 'string') block.text = block.innerFormat || block.defaultText || '';
        if (plainTypes.includes(type)) {
          if (!['normal', 'main', 'globalNote'].includes(block.type2)) block.type2 = 'normal';
          block.role = ['user', 'bot', 'system'].includes(previousRole) ? previousRole : ['assistant', 'char'].includes(previousRole) ? 'bot' : 'system';
        }
      } else if (formatTypes.includes(type)) {
        if (typeof block.innerFormat !== 'string') block.innerFormat = block.text || '{{slot}}';
        if (previousRole && previousRole !== 'all') block.role2 = ['assistant', 'char'].includes(previousRole) ? 'bot' : previousRole;
      } else if (type === 'chat') {
        if (!Number.isInteger(block.rangeStart)) block.rangeStart = 0;
        if (block.rangeEnd !== 'end' && !Number.isInteger(block.rangeEnd)) block.rangeEnd = 'end';
      } else if (type === 'cache') {
        if (!Number.isInteger(block.depth)) block.depth = 0;
        block.role = ['user', 'assistant', 'system', 'all'].includes(previousRole) ? previousRole : ['bot', 'char'].includes(previousRole) ? 'assistant' : 'all';
      }
    }
    function addBlock() {
      if (!Array.isArray(state.draft?.promptTemplate) || state.busy) return;
      change(() => {
        const meta = { id: uid(), original: null, custom: true };
        state.draft.promptTemplate.push({ type: 'plain', type2: 'normal', role: 'system', name: '새 블록', text: '' });
        state.meta.push(meta); state.selected = state.editing = meta.id;
      });
      const node = $('blocks').lastElementChild?.previousElementSibling;
      node?.scrollIntoView({ block: 'nearest' }); node?.querySelector('input[aria-label="블록 이름"]')?.focus();
    }
    async function deleteBlock(id) {
      if (!await confirmAction('블록을 삭제할까?', '현재 프리셋에서 이 블록을 빼. 보관한 커스텀 카드는 그대로야.', true)) return;
      change(() => {
        const index = state.meta.findIndex(meta => meta.id === id); if (index < 0) return;
        state.draft.promptTemplate.splice(index, 1); state.meta.splice(index, 1);
        if (state.editing === id) state.editing = ''; if (state.selected === id) state.selected = '';
      });
    }
    function renderDocument() {
      $('welcome').hidden = !!state.draft; $('loaded').hidden = !state.draft;
      if (!state.draft) return;
      $('name').value = state.draft.name || ''; updateStatus(); renderBlocks(); renderFields(); renderSide();
    }
    function renderFields() {
      const container = $('fields'); container.replaceChildren();
      container.append(inputField('토글 정의', state.draft.customPromptTemplateToggle || '', text => change(() => {
        state.draft.customPromptTemplateToggle = text;
      }, 'field:customPromptTemplateToggle', false)));
    }
    function move(index, target) {
      if (index < 0 || index >= state.meta.length || target < 0 || target > state.meta.length || target === index || target === index + 1) return;
      change(() => { const [block] = state.draft.promptTemplate.splice(index, 1), [meta] = state.meta.splice(index, 1); const at = target > index ? target - 1 : target; state.draft.promptTemplate.splice(at, 0, block); state.meta.splice(at, 0, meta); state.selected = meta.id; });
    }
    function insertCard(card, index) {
      if (!state.draft || !Array.isArray(state.draft.promptTemplate)) { notify('순서형 블록이 있는 프리셋을 먼저 열어 줘.', true); return; }
      if (!Number.isInteger(index) || index < 0 || index > state.meta.length) return;
      change(() => { const meta = { id: uid(), custom: true, cardId: card.id, original: null };
        state.draft.promptTemplate.splice(index, 0, blockFromCard(card)); state.meta.splice(index, 0, meta); state.selected = meta.id; });
      const node = $('blocks').querySelector('[data-id="' + state.selected + '"]'); node?.scrollIntoView({ block: 'nearest' });
      notify('커스텀 블록을 추가했어. 보관한 카드는 그대로야.');
    }
    function startDrag(event, payload) {
      if (state.busy) { event.preventDefault(); return; }
      state.drag = payload; event.dataTransfer.effectAllowed = payload.kind === 'card' ? 'copy' : 'move';
      event.dataTransfer.setData('text/plain', payload.kind === 'card' ? payload.card.name : '프롬프트 블록');
      event.currentTarget.classList.add('pe-dragging');
    }
    function endDrag() {
      state.drag = null; scrollPointer = null; cancelAnimationFrame(autoScrollFrame); autoScrollFrame = 0;
      $('blocks')?.querySelectorAll('.pe-gap.active').forEach(node => node.classList.remove('active'));
      root.querySelectorAll('.pe-dragging').forEach(node => node.classList.remove('pe-dragging')); state.gap = null;
    }
    function autoScroll() {
      if (!state.drag || !scrollPointer) { autoScrollFrame = 0; return; }
      const list = $('blocks'), rect = list.getBoundingClientRect(), y = scrollPointer.y;
      if (scrollPointer.x >= rect.left && scrollPointer.x <= rect.right) {
        const speed = y < rect.top + 64 ? -Math.min(22, (rect.top + 64 - y) / 3) : y > rect.bottom - 64 ? Math.min(22, (y - rect.bottom + 64) / 3) : 0;
        if (y >= rect.top - 40 && y <= rect.bottom + 40) list.scrollTop += speed;
      }
      autoScrollFrame = requestAnimationFrame(autoScroll);
    }
    function locateGap(event) {
      if (!state.drag || !Array.isArray(state.draft?.promptTemplate)) return null;
      const gap = event.target.closest('.pe-gap'); if (gap) return Number(gap.dataset.index);
      const block = event.target.closest('.pe-block');
      if (block) { const rect = block.getBoundingClientRect(); return Number(block.dataset.index) + (event.clientY >= rect.top + rect.height / 2 ? 1 : 0); }
      return state.meta.length;
    }
    function renderBlocks() {
      const list = $('blocks'), scrollTop = list.scrollTop; list.replaceChildren();
      const blocks = state.draft.promptTemplate;
      $('block-help').textContent = Array.isArray(blocks) ? '블록을 펼쳐 본문을 확인하고, 카드를 원하는 블록 사이로 드래그해. ⋮⋮ 손잡이로 기존 블록도 옮길 수 있어.' : '이 프리셋은 순서형 블록을 사용하지 않아. 토글 정의를 편집할 수 있어. 카드 삽입은 블록형 프리셋에서 사용할 수 있어.';
      if (!Array.isArray(blocks)) { list.append(el('p', '기본 형식 프리셋 · 토글 편집을 사용할 수 있어.', 'empty')); return; }
      const appendGap = index => { const gap = el('div', null, 'pe-gap'); gap.dataset.index = String(index); gap.setAttribute('aria-hidden', 'true'); list.append(gap); };
      blocks.forEach((block, index) => {
        appendGap(index); const meta = state.meta[index];
        const card = el('article', null, 'pe-block' + (meta.custom ? ' custom' : '') + (state.selected === meta.id ? ' selected' : '') + (collapsed.has(meta.id) ? ' collapsed' : '') + (state.editing === meta.id ? ' editing' : ''));
        card.dataset.index = String(index); card.dataset.id = meta.id;
        card.addEventListener('click', () => { state.selected = meta.id; list.querySelectorAll('.selected').forEach(node => node.classList.remove('selected')); card.classList.add('selected'); });
        const head = el('div', null, 'pe-block-head');
        const grip = btn('⋮⋮', () => {}, 'btn ghost sm icon pe-grip'); grip.draggable = true; grip.setAttribute('aria-label', titleOf(block) + ' 블록 이동');
        grip.addEventListener('dragstart', event => startDrag(event, { kind: 'block', id: meta.id })); grip.addEventListener('dragend', endDrag);
        const up = btn('↑', () => move(index, index - 1), 'btn ghost sm icon'), down = btn('↓', () => move(index, index + 2), 'btn ghost sm icon');
        up.disabled = index === 0; down.disabled = index === blocks.length - 1; up.setAttribute('aria-label', titleOf(block) + ' 위로 이동'); down.setAttribute('aria-label', titleOf(block) + ' 아래로 이동');
        const heading = btn((collapsed.has(meta.id) ? '▸ ' : '▾ ') + titleOf(block), () => { state.selected = meta.id; if (collapsed.has(meta.id)) collapsed.delete(meta.id); else collapsed.add(meta.id); renderBlocks(); }, 'pe-block-title');
        heading.setAttribute('aria-expanded', String(!collapsed.has(meta.id)));
        head.append(grip, up, down, el('span', String(index + 1), 'badge'), heading);
        if (meta.custom) head.append(el('span', '커스텀', 'badge custom'));
        const modified = meta.original && !C.same(block, meta.original), modifiedBadge = el('span', '수정됨', 'badge changed'); modifiedBadge.hidden = !modified; head.append(modifiedBadge);
        head.append(btn(state.editing === meta.id ? '편집 닫기' : '편집', () => { state.editing = state.editing === meta.id ? '' : meta.id; state.selected = meta.id; renderBlocks(); }));
        const remove = btn('삭제', () => deleteBlock(meta.id), 'btn sm ghost danger'); remove.setAttribute('aria-label', '블록 삭제'); head.append(remove);
        card.append(head);
        const text = bodyOf(block), preview = el('pre', text || '채팅할 때 RisuAI가 이 블록의 내용을 채워. 직접 지정한 본문은 없어.', 'pe-block-text'); card.append(preview);
        card.append(el('p', [labels[block.type] || block.type, block.type2 && ({ main: '메인', globalNote: '글로벌 노트', normal: '일반' }[block.type2] || block.type2), block.role || block.role2].filter(Boolean).join(' · '), 'pe-block-meta'));
        if (state.editing === meta.id) {
          const editor = el('div', null, 'pe-block-editor');
          const write = (key, value) => {
            change(() => { block[key] = value; }, meta.id + ':' + key, false);
            preview.textContent = bodyOf(block) || '직접 지정한 본문은 없어.';
            heading.textContent = (collapsed.has(meta.id) ? '▸ ' : '▾ ') + titleOf(block); modifiedBadge.hidden = !meta.original || C.same(block, meta.original);
          };
          editor.append(inputField('블록 이름', block.name || '', value => write('name', value), false));
          const types = el('div', null, 'pe-selects');
          types.append(selectField('프롬프트 타입', Object.fromEntries(promptTypes.map(type => [type, labels[type] || type])), block.type, value => change(() => setPromptType(block, value))));
          if (plainTypes.includes(block.type)) types.append(selectField('특수 타입', specialTypes, block.type2 || 'normal', value => change(() => { block.type2 = value; })));
          editor.append(types);
          const editKeys = plainTypes.includes(block.type) || block.type === 'chatML' ? ['text'] : formatTypes.includes(block.type) ? ['innerFormat', ...(block.type === 'authornote' ? ['defaultText'] : [])] : textKeys.filter(key => typeof block[key] === 'string' && !promptTypes.includes(block.type));
          editKeys.forEach(key => editor.append(inputField(({ text: '본문', innerFormat: '내부 포맷', defaultText: '기본 본문' })[key], block[key] || '', value => write(key, value))));
          if (plainTypes.includes(block.type)) {
            types.append(selectField('역할', { system: '시스템', user: '유저', bot: '캐릭터' }, block.role || 'system', value => change(() => { block.role = value; })));
          } else if (formatTypes.includes(block.type)) {
            types.append(selectField('역할', { '': '원래 역할 유지', system: '시스템', user: '유저', bot: '캐릭터' }, block.role2 || '', value => change(() => { if (value) block.role2 = value; else delete block.role2; })));
          } else if (block.type === 'chat') {
            const range = el('div', null, 'grid2');
            const rangeField = (key, title, fallback) => {
              const field = inputField(title, String(block[key] ?? fallback), () => {}, false), input = field.querySelector('input');
              input.addEventListener('change', guard(() => {
                const text = input.value.trim(), value = key === 'rangeEnd' && text === 'end' ? 'end' : Number(text);
                if (!text || (value !== 'end' && !Number.isInteger(value))) { input.value = String(block[key] ?? fallback); throw new Error(title + '은 정수' + (key === 'rangeEnd' ? ' 또는 end' : '') + '로 입력해 줘.'); }
                change(() => { block[key] = value; });
              })); return field;
            };
            range.append(rangeField('rangeStart', '채팅 시작 위치', 0), rangeField('rangeEnd', '채팅 끝 위치', 'end')); editor.append(range);
          } else if (block.type === 'cache') {
            const depth = inputField('캐시 깊이', String(block.depth ?? 0), () => {}, false), input = depth.querySelector('input'); input.type = 'number'; input.step = '1'; input.min = '0';
            input.addEventListener('change', guard(() => { const value = Number(input.value); if (!input.value.trim() || !Number.isInteger(value) || value < 0) { input.value = String(block.depth ?? 0); throw new Error('캐시 깊이는 0 이상의 정수로 입력해 줘.'); } change(() => { block.depth = value; }); }));
            const cacheRow = el('div', null, 'grid2'); cacheRow.append(depth, selectField('캐시 역할', { all: '전체', system: '시스템', user: '유저', assistant: '캐릭터' }, block.role || 'all', value => change(() => { block.role = value; }))); editor.append(cacheRow);
          }
          const actions = el('div', null, 'row');
          if (editKeys.length) actions.append(btn('새 커스텀 카드로 저장', () => openCardDraft('', cardFromBlock(block))));
          const source = state.cards.find(entry => entry.id === meta.cardId);
          if (source && editKeys.length) actions.append(btn('보관한 카드에 반영', async () => {
            if (!await confirmAction('보관한 카드도 수정할까?', '“' + source.name + '” 카드의 이름과 구문을 현재 블록 내용으로 바꿔. 이미 삽입한 다른 블록은 그대로야.')) return;
            await mutateCards(cards => { const target = cards.find(entry => entry.id === source.id); if (!target) throw new Error('보관한 카드가 없어. 새 카드로 저장해 줘.'); Object.assign(target, cardFromBlock(block), { name: titleOf(block).slice(0, 200) }); });
            notify('보관한 카드에 반영했어.');
          }));
          editor.append(actions);
          card.append(editor);
        }
        list.append(card);
      });
      if (!blocks.length) list.append(el('p', '커스텀 카드를 여기로 드래그해서 첫 블록을 추가해.', 'empty'));
      appendGap(blocks.length);
      list.scrollTop = scrollTop;
    }
    function validateCards(value) {
      if (!object(value) || value.type !== 'preset-editor-custom-cards' || value.version !== 1 || !Array.isArray(value.cards)) throw new Error('커스텀 보관함 형식이 올바르지 않아.');
      const ids = new Set();
      value.cards.forEach(card => {
        if (!object(card) || typeof card.id !== 'string' || !card.id || ids.has(card.id) || typeof card.name !== 'string' || !card.name.trim() || card.name.length > 200 || typeof card.text !== 'string') throw new Error('커스텀 카드 내용이 올바르지 않아.');
        if ((own(card, 'type') && (typeof card.type !== 'string' || !card.type)) || (own(card, 'type2') && (typeof card.type2 !== 'string' || !own(specialTypes, card.type2))) || (own(card, 'role') && !['', 'system', 'user', 'bot', 'assistant', 'char', 'all'].includes(card.role))) throw new Error('커스텀 카드의 타입이나 역할이 올바르지 않아.');
        ids.add(card.id);
      });
      return value.cards.map(({ id, name, text, ...settings }) => ({ id, name, text, ...cardSettings(settings) }));
    }
    async function loadCards() {
      if (state.cardBusy) return;
      try { const raw = await storage.get(CARD_KEY); state.cards = raw ? validateCards(C.parseJSON(raw)) : []; state.cardsReady = true; }
      catch (e) { state.cardsReady = false; state.cardMessage = '보관함을 읽지 못했어: ' + e.message; state.cardError = true; notify(state.cardMessage, true); }
      renderCards(); renderSide();
    }
    async function mutateCards(fn) {
      if (state.cardBusy) throw new Error('카드를 저장하는 중이야. 잠시 뒤 다시 시도해 줘.');
      const cleanDraft = !cardDirty(), editingId = state.cardId;
      state.cardBusy = true; renderCardStatus();
      try {
        const raw = await storage.get(CARD_KEY), cards = raw ? validateCards(C.parseJSON(raw)) : [];
        fn(cards); const next = { type: 'preset-editor-custom-cards', version: 1, cards };
        const json = JSON.stringify(next); validateCards(C.parseJSON(json)); await storage.set(CARD_KEY, json); state.cards = cards; state.cardsReady = true;
        if (cleanDraft && editingId && state.cardId === editingId && !cardDirty()) { const current = cards.find(card => card.id === editingId); fillCardDraft(current ? editingId : '', current || {}); }
      } finally { state.cardBusy = false; renderCards(); renderSide(); }
    }
    function cardFormValue() { return JSON.stringify({ name: $('card-name').value, text: $('card-text').value, ...state.cardSettings }); }
    function cardDirty() { return cardFormValue() !== state.cardBefore; }
    function renderCardStatus() {
      $('card-count').textContent = String(state.cards.length);
      $('card-save').disabled = state.cardBusy; $('new-card').disabled = state.cardBusy;
      $('card-save').textContent = state.cardBusy ? '저장 중…' : '카드 저장';
      $('card-name').disabled = $('card-text').disabled = state.cardBusy;
      $('card-form').querySelectorAll('select').forEach(select => { select.disabled = state.cardBusy; });
      $('card-draft-status').textContent = state.cardBusy ? '커스텀 카드를 저장하고 있어…' : state.cardMessage || (cardDirty() ? '아직 저장하지 않은 내용이 있어.' : '');
      $('card-draft-status').dataset.error = String(!state.cardBusy && state.cardError);
    }
    function fillCardDraft(id = '', values = {}) {
      state.cardId = id; $('card-name').value = values.name || ''; $('card-text').value = values.text || '';
      state.cardSettings = cardSettings(values); renderCardOptions();
      state.cardMessage = ''; state.cardError = false;
      state.cardBefore = cardFormValue(); $('form-title').textContent = id ? '커스텀 카드 수정' : '새 커스텀 카드'; renderCardStatus();
    }
    function renderCardOptions() {
      const settings = state.cardSettings, container = $('card-options'), roleContainer = $('card-role'); container.replaceChildren(); roleContainer.replaceChildren(); roleContainer.hidden = true;
      const update = (key, value) => {
        state.cardSettings = cardSettings({ ...state.cardSettings, [key]: value }); state.cardMessage = ''; state.cardError = false;
        renderCardOptions(); renderCardStatus();
      };
      container.append(selectField('프롬프트 타입', Object.fromEntries(promptTypes.map(type => [type, labels[type] || type])), settings.type, value => update('type', value)));
      if (plainTypes.includes(settings.type)) container.append(selectField('특수 타입', specialTypes, settings.type2, value => update('type2', value)));
      if (plainTypes.includes(settings.type) || formatTypes.includes(settings.type) || settings.type === 'cache') {
        const options = settings.type === 'cache' ? { all: '전체', system: '시스템', user: '유저', assistant: '캐릭터' } : formatTypes.includes(settings.type) ? { '': '원래 역할 유지', ...roles } : roles;
        roleContainer.append(selectField('블록 역할', options, settings.role, value => update('role', value))); roleContainer.hidden = false;
      }
      $('card-text-field').hidden = !cardUsesText(settings.type);
    }
    async function openCardDraft(id = '', values = null) {
      if (state.cardBusy) return;
      if (cardDirty() && !await confirmAction('카드 작성을 바꿀까?', '아직 저장하지 않은 카드 내용이 있어. 다른 카드를 열면 작성 중인 내용은 사라져.', true)) return;
      const card = values || state.cards.find(entry => entry.id === id) || {};
      fillCardDraft(id, card); tab('cards'); $('card-name').focus();
    }
    function snippetNode(card, compact) {
      const node = el('article', null, 'pe-snippet'); node.dataset.cardId = card.id;
      if (compact && Array.isArray(state.draft?.promptTemplate)) { node.draggable = true; node.addEventListener('dragstart', event => startDrag(event, { kind: 'card', card: clone(card) })); node.addEventListener('dragend', endDrag); }
      node.append(el('h3', card.name));
      if (cardUsesText(card.type)) node.append(el('pre', card.text || '(빈 구문)'));
      const settings = cardSettings(card), badges = el('div', null, 'row');
      badges.append(el('span', labels[settings.type] || settings.type, 'badge'));
      if (plainTypes.includes(settings.type)) badges.append(el('span', specialTypes[settings.type2], 'badge'));
      if (plainTypes.includes(settings.type) || formatTypes.includes(settings.type) || settings.type === 'cache') badges.append(el('span', settings.role ? ({ ...roles, assistant: '캐릭터', all: '전체' }[settings.role] || settings.role) : '원래 역할 유지', 'badge'));
      node.append(badges);
      const actions = el('div', null, 'row');
      actions.append(btn('수정', () => openCardDraft(card.id), 'btn ghost sm'));
      if (!compact) actions.append(btn('삭제', async () => {
        if (state.cardBusy || !await confirmAction('카드를 삭제할까?', '“' + card.name + '”을 보관함에서 삭제해. 프리셋에 삽입한 블록은 그대로 남아.', true)) return;
        if (state.cardId === card.id && cardDirty() && !await confirmAction('작성 중인 내용도 지울까?', '이 카드에 아직 저장하지 않은 수정이 있어.', true)) return;
        await mutateCards(cards => { const index = cards.findIndex(entry => entry.id === card.id); if (index < 0) throw new Error('카드가 이미 삭제됐어.'); cards.splice(index, 1); });
        if (state.cardId === card.id) fillCardDraft(); notify('보관한 카드를 삭제했어.');
      }, 'btn ghost sm danger'));
      node.append(actions); return node;
    }
    function filteredCards(query) { const text = query.toLocaleLowerCase().trim(); return state.cards.filter(card => !text || (card.name + '\n' + card.text).toLocaleLowerCase().includes(text)); }
    function renderCards() {
      renderCardStatus(); const list = $('card-list'); list.replaceChildren();
      filteredCards($('card-search').value).forEach(card => list.append(snippetNode(card, false)));
      if (!list.childElementCount) list.append(el('p', state.cards.length ? '검색 결과가 없어.' : '아직 저장한 카드가 없어.', 'empty'));
    }
    function renderSide() {
      const list = $('side-list'), scrollTop = list.scrollTop; list.replaceChildren();
      filteredCards($('side-search').value).forEach(card => list.append(snippetNode(card, true)));
      if (!list.childElementCount) list.append(el('p', !state.cardsReady ? '보관함을 읽지 못했어. 플러그인을 다시 열어 줘.' : state.cards.length ? '검색 결과가 없어.' : '저장한 카드가 없어. ＋ 카드 작성으로 구문을 보관해.', 'empty'));
      list.scrollTop = scrollTop;
    }
    async function replaceDocument(preset, fileName) {
      if (isDirty() && !await confirmAction('다른 프리셋을 열까?', '현재 편집한 내용이 있어. 필요한 경우 완성본을 다운로드한 뒤 열어 줘.', true)) return;
      const clean = C.sanitizePreset(C.parsePreset(JSON.stringify(preset)));
      state.original = clone(clean); state.draft = clone(clean); state.fileName = fileName;
      state.meta = (clean.promptTemplate || []).map(block => ({ id: uid(), original: clone(block), custom: false }));
      state.selected = ''; state.editing = ''; state.history = []; state.future = []; state.historyGroup = ''; state.saved = ''; collapsed.clear();
      state.meta.forEach(meta => collapsed.add(meta.id));
      tab('edit'); renderDocument(); notify('프리셋을 열었어. 본문을 읽고 직접 편집해 봐.');
    }
    async function openPreset(file) {
      if (!file || state.busy) return;
      if (file.size > 10 * 1024 * 1024) throw new Error('프리셋 파일은 10MB 이하로 열어 줘.');
      state.busy = true; updateStatus();
      try { await replaceDocument(await C.importPresetFile(file), file.name); } finally { state.busy = false; updateStatus(); }
    }
    function download(name, data, type) {
      const url = URL.createObjectURL(new Blob([data], { type })), a = el('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
    }
    $('tab-edit').addEventListener('click', () => tab('edit')); $('tab-cards').addEventListener('click', () => tab('cards'));
    root.querySelector('[role=tablist]').addEventListener('keydown', event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); tab(event.key === 'Home' ? 'edit' : event.key === 'End' ? 'cards' : state.tab === 'edit' ? 'cards' : 'edit', true); } });
    $('manage-cards').addEventListener('click', () => tab('cards'));
    $('new-card').addEventListener('click', guard(() => openCardDraft())); $('new-side').addEventListener('click', guard(() => openCardDraft()));
    const cardInputChanged = () => { state.cardMessage = ''; state.cardError = false; renderCardStatus(); };
    $('card-name').addEventListener('input', cardInputChanged); $('card-text').addEventListener('input', cardInputChanged);
    // Sandboxed frames can block submission before a submit handler runs. Save directly on click.
    $('card-save').addEventListener('click', guard(async () => {
      if (state.cardBusy) return;
      const id = state.cardId, name = $('card-name').value.trim(), text = $('card-text').value;
      const settings = { ...state.cardSettings };
      try {
        if (!name || (cardUsesText(settings.type) && !text.trim())) { (!name ? $('card-name') : $('card-text')).focus(); throw new Error('카드 이름과 구문을 입력해 줘.'); }
        const savedId = id || uid();
        await mutateCards(cards => { const index = cards.findIndex(entry => entry.id === savedId); if (id && index < 0) throw new Error('수정할 카드가 없어. 새 카드로 작성해 줘.'); const card = { id: savedId, name, text, ...settings }; if (index < 0) cards.push(card); else cards[index] = card; });
        fillCardDraft(savedId, { name, text, ...settings }); state.cardMessage = '“' + name + '” 카드를 저장했어.'; renderCardStatus(); notify('커스텀 카드를 보관했어.');
      } catch (error) { state.cardMessage = '저장하지 못했어: ' + error.message; state.cardError = true; renderCardStatus(); notify(state.cardMessage, true); }
    }));
    $('card-search').addEventListener('input', renderCards); $('side-search').addEventListener('input', renderSide);
    $('open-empty').addEventListener('click', () => { if (!state.busy) $('file').click(); });
    $('file').addEventListener('change', guard(async () => { try { await openPreset($('file').files[0]); } finally { $('file').value = ''; } }));
    $('welcome').addEventListener('dragover', event => { if (event.dataTransfer?.types.includes('Files')) { event.preventDefault(); $('open-empty').classList.add('dragover'); } });
    $('welcome').addEventListener('dragleave', () => $('open-empty').classList.remove('dragover'));
    $('welcome').addEventListener('drop', guard(async event => { if (!event.dataTransfer?.files.length) return; event.preventDefault(); $('open-empty').classList.remove('dragover'); await openPreset(event.dataTransfer.files[0]); }));
    $('name').addEventListener('input', () => change(() => { state.draft.name = $('name').value; }, 'preset-name', false)); $('name').addEventListener('blur', () => { state.historyGroup = ''; });
    $('cancel').addEventListener('click', guard(async () => {
      if (state.busy || !state.draft) return;
      if (isDirty() && !await confirmAction('편집을 취소할까?', '지금까지 편집한 내용이 사라지고 프리셋 불러오기 화면으로 돌아가. 필요하면 먼저 완성본을 다운로드해 줘.', true)) return;
      endDrag(); state.original = state.draft = null; state.meta = []; state.selected = state.editing = state.fileName = '';
      state.history = []; state.future = []; state.historyGroup = ''; state.saved = ''; collapsed.clear();
      renderDocument(); updateStatus(); $('open-empty').focus(); notify('편집을 취소했어. 다른 프리셋을 열 수 있어.');
    }));
    $('undo').addEventListener('click', () => travel(state.history, state.future)); $('redo').addEventListener('click', () => travel(state.future, state.history));
    root.addEventListener('keydown', event => {
      if (event.key === 'Escape') endDrag();
      if (state.tab !== 'edit' || event.target.matches('input,textarea,select,[contenteditable=true]') || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return;
      event.preventDefault(); if (event.shiftKey) travel(state.future, state.history); else travel(state.history, state.future);
    });
    $('toggle-panel').addEventListener('click', () => { state.panel = !state.panel; updateStatus(); });
    $('add-block').addEventListener('click', addBlock);
    $('font').addEventListener('change', () => document.documentElement.style.setProperty('--prompt-font', $('font').value + 'px'));
    $('fold-all').addEventListener('click', () => { state.meta.forEach(meta => collapsed.add(meta.id)); renderBlocks(); });
    $('unfold-all').addEventListener('click', () => { collapsed.clear(); renderBlocks(); });
    $('blocks').addEventListener('dragover', event => {
      const index = locateGap(event); if (index == null || state.busy) return;
      event.preventDefault(); event.dataTransfer.dropEffect = state.drag.kind === 'card' ? 'copy' : 'move';
      if (state.gap !== index) { $('blocks').querySelectorAll('.pe-gap.active').forEach(node => node.classList.remove('active')); $('blocks').querySelector('[data-index="' + index + '"].pe-gap')?.classList.add('active'); state.gap = index; }
      scrollPointer = { x: event.clientX, y: event.clientY }; if (!autoScrollFrame) autoScrollFrame = requestAnimationFrame(autoScroll);
    });
    $('blocks').addEventListener('dragleave', event => { if (!$('blocks').contains(event.relatedTarget)) { $('blocks').querySelectorAll('.pe-gap.active').forEach(node => node.classList.remove('active')); state.gap = null; scrollPointer = null; } });
    $('blocks').addEventListener('drop', guard(event => {
      const index = locateGap(event), drag = state.drag; if (index == null || !drag || state.busy) return;
      event.preventDefault(); event.stopPropagation(); endDrag();
      if (drag.kind === 'card') insertCard(drag.card, index); else move(state.meta.findIndex(meta => meta.id === drag.id), index);
    }));
    $('download').addEventListener('click', guard(async () => {
      if (state.busy || !state.draft) return;
      const preset = C.sanitizePreset(C.parsePreset(JSON.stringify(state.draft))); state.busy = true; updateStatus();
      try { const bytes = await C.exportPresetFile(preset), fileName = String(preset.name || '프리셋').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_') + '_preset.risup'; download(fileName, bytes, 'application/octet-stream'); state.saved = clone(preset); notify('편집한 프리셋을 다운로드했어. RisuAI의 프리셋 가져오기로 적용해.'); }
      finally { state.busy = false; updateStatus(); }
    }));
    const themePref = api?.safeLocalStorage || { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) };
    try { const theme = await themePref.getItem('preset-editor:theme'); if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme; } catch (_) { /* System theme remains available. */ }
    $('theme').addEventListener('click', guard(async () => { const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches; document.documentElement.dataset.theme = dark ? 'light' : 'dark'; try { await themePref.setItem('preset-editor:theme', dark ? 'light' : 'dark'); } catch (_) { /* Keep this session's theme. */ } }));
    fillCardDraft(); renderDocument();
    await loadCards();
    if (api) {
      $('close').hidden = false; $('close').addEventListener('click', guard(() => api.hideContainer()));
      const setting = await api.registerSetting('프리셋 에디터', async () => { await api.showContainer('fullscreen'); }, '🖊️', 'html');
      await api.onUnload(async () => { endDrag(); clearTimeout(feedbackTimer); if (setting?.id) await api.unregisterUIPart(setting.id); });
    }
  }

})();
