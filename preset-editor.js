//@name preset_editor
//@api 3.0
//@version 0.8.0
//@display-name 프리셋 에디터
//@update-url https://raw.githubusercontent.com/sae-chi/RisuAIPlugin/refs/heads/main/preset-editor.js

/* Offline RisuAI preset migration. No database access, network, or model calls. */
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
  const NONE = Symbol('missing');
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const clone = v => v === NONE ? NONE : JSON.parse(JSON.stringify(v));
  const canonical = v => v === NONE ? '[missing]' : JSON.stringify(v, function (k, x) {
    if (!object(x)) return x;
    const out = Object.create(null);
    Object.keys(x).sort().forEach(key => { out[key] = x[key]; });
    return out;
  });
  const same = (a, b) => canonical(a) === canonical(b);
  const field = (o, k) => object(o) && own(o, k) ? o[k] : NONE;
  const pointer = (p, k) => p + '/' + String(k).replace(/~/g, '~0').replace(/\//g, '~1');
  const PROMPTS = new Set(['mainPrompt', 'jailbreak', 'globalNote', 'promptTemplate',
    'templateDefaultVariables', 'instructChatTemplate', 'JinjaTemplate', 'formatingOrder']);
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
  function preview(v) { return v === NONE ? '(항목 없음 / 삭제)' : typeof v === 'string' ? v : JSON.stringify(v, null, 2); }

  function context(choices = {}) {
    const ctx = { conflicts: [], changes: [], warnings: [], choices };
    ctx.conflict = (path, base, local, latest, reason) => {
      const choice = own(choices, path) ? choices[path] : null;
      const example = local === NONE ? latest : local;
      const c = { id: path, path, reason, base: preview(base), local: preview(local), latest: preview(latest),
        valueType: Array.isArray(example) ? 'array' : object(example) ? 'object' : typeof example,
        localMissing: local === NONE, latestMissing: latest === NONE, resolved: false };
      let value = latest;
      if (choice && choice.mode === 'local') { value = local; c.resolved = true; }
      if (choice && choice.mode === 'latest') { value = latest; c.resolved = true; }
      if (choice && choice.mode === 'delete') { value = NONE; c.resolved = true; }
      if (choice && choice.mode === 'custom') { value = clone(choice.value); c.resolved = true; }
      ctx.conflicts.push(c);
      return clone(value);
    };
    return ctx;
  }

  // LCS edit ranges, with a bounded matrix. Very large texts use a conservative single range.
  function editRanges(base, side, cap = 1500000) {
    const a = base, b = side;
    let prefix = 0, suffix = 0;
    while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix++;
    while (suffix < a.length - prefix && suffix < b.length - prefix && a[a.length - 1 - suffix] === b[b.length - 1 - suffix]) suffix++;
    const aa = a.slice(prefix, a.length - suffix), bb = b.slice(prefix, b.length - suffix);
    if (!aa.length && !bb.length) return [];
    if (!aa.length || !bb.length) return [{ start: prefix, end: a.length - suffix, value: bb }];
    if (aa.length * bb.length > cap) return [{ start: prefix, end: a.length - suffix, value: bb }];
    const width = bb.length + 1;
    const dp = new Uint32Array((aa.length + 1) * width);
    for (let i = aa.length - 1; i >= 0; i--) for (let j = bb.length - 1; j >= 0; j--) {
      dp[i * width + j] = aa[i] === bb[j] ? 1 + dp[(i + 1) * width + j + 1] :
        Math.max(dp[(i + 1) * width + j], dp[i * width + j + 1]);
    }
    const out = [];
    let i = 0, j = 0, pending = null;
    const flush = () => { if (pending) { out.push(pending); pending = null; } };
    while (i < aa.length || j < bb.length) {
      if (i < aa.length && j < bb.length && aa[i] === bb[j]) { flush(); i++; j++; }
      else {
        if (!pending) pending = { start: prefix + i, end: prefix + i, value: [] };
        if (j < bb.length && (i === aa.length || dp[i * width + j + 1] > dp[(i + 1) * width + j])) pending.value.push(bb[j++]);
        else { i++; pending.end = prefix + i; }
      }
    }
    flush();
    return out;
  }
  function combineRanges(base, local, latest) {
    const left = editRanges(base, local), right = editRanges(base, latest);
    const edits = left.slice();
    for (const r of right) {
      let duplicate = false;
      for (const l of left) {
        if (l.start === r.start && l.end === r.end && same(l.value, r.value)) { duplicate = true; continue; }
        const overlap = l.start < r.end && r.start < l.end;
        const inserts = l.start === l.end && r.start === r.end && l.start === r.start;
        const inside = (l.start === l.end && l.start > r.start && l.start < r.end) ||
          (r.start === r.end && r.start > l.start && r.start < l.end);
        if (overlap || inserts || inside) return null;
      }
      if (!duplicate) edits.push(r);
    }
    edits.sort((x, y) => x.start - y.start || x.end - y.end);
    const out = [];
    let pos = 0;
    for (const e of edits) { for (const x of base.slice(pos, e.start)) out.push(x); for (const x of e.value) out.push(x); pos = e.end; }
    for (const x of base.slice(pos)) out.push(x);
    return out.join('');
  }
  function mergeText(base, local, latest) {
    const lines = s => s.match(/[^\n]*\n|[^\n]+$/g) || [];
    const merged = combineRanges(lines(base), lines(local), lines(latest));
    if (merged !== null) return merged;
    // Resolve independent edits on the same line when character alignment is affordable.
    if (Math.max(base.length, local.length, latest.length) <= 16000) {
      return combineRanges(Array.from(base), Array.from(local), Array.from(latest));
    }
    return null;
  }
  function mergeValue(base, local, latest, path, ctx, text = true) {
    if (same(local, base)) return clone(latest);
    if (same(latest, base) || same(local, latest)) return clone(local);
    if (base !== NONE && object(base) && object(local) && object(latest)) {
      const out = {};
      for (const k of new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(latest)])) {
        const v = mergeValue(field(base, k), field(local, k), field(latest, k), pointer(path, k), ctx, text);
        if (v !== NONE) out[k] = v;
      }
      return out;
    }
    if (text && typeof base === 'string' && typeof local === 'string' && typeof latest === 'string') {
      const v = mergeText(base, local, latest);
      if (v !== null) return v;
    }
    return ctx.conflict(path, base, local, latest, '같은 부분을 커스텀 수정본과 새 원본에서 함께 변경했어.');
  }

  function matchBlocks(base, side) {
    const matched = new Map(), used = new Set();
    const pairUnique = keyFn => {
      const a = new Map(), b = new Map();
      base.forEach((x, i) => { if (!matched.has(i)) { const k = keyFn(x); if (k != null) a.set(k, [...(a.get(k) || []), i]); } });
      side.forEach((x, i) => { if (!used.has(i)) { const k = keyFn(x); if (k != null) b.set(k, [...(b.get(k) || []), i]); } });
      for (const [k, ids] of a) if (ids.length === 1 && b.get(k)?.length === 1) {
        matched.set(ids[0], b.get(k)[0]); used.add(b.get(k)[0]);
      }
    };
    pairUnique(x => x.id ? 'id:' + x.id : null);
    pairUnique(x => x.name ? 'name:' + x.name : null);
    pairUnique(canonical);
    const shape = x => [x.type, x.type2 || ''].join('|');
    // Only the sole remaining block of a structural type can be mapped without guessing.
    pairUnique(x => x.id || x.name ? null : shape(x));
    const ambiguous = base.some((x, i) => !matched.has(i) && !x.id && !x.name &&
      side.some((y, j) => !used.has(j) && !y.id && !y.name && shape(x) === shape(y)));
    return { matched, used, ambiguous };
  }
  function weave(primary, secondary) {
    const out = primary.slice();
    secondary.forEach((id, i) => {
      if (out.includes(id)) return;
      const next = secondary.slice(i + 1).find(x => out.includes(x));
      const previous = secondary.slice(0, i).reverse().find(x => out.includes(x));
      if (next != null && (previous == null || out.indexOf(previous) < out.indexOf(next))) out.splice(out.indexOf(next), 0, id);
      else if (previous != null) out.splice(out.indexOf(previous) + 1, 0, id);
      else out.push(id);
    });
    return out;
  }
  function mergeBlocks(base, local, latest, path, ctx) {
    if (same(local, base)) return clone(latest);
    if (same(latest, base) || same(local, latest)) return clone(local);
    if (![base, local, latest].every(Array.isArray)) return mergeValue(base, local, latest, path, ctx);
    const lm = matchBlocks(base, local), nm = matchBlocks(base, latest);
    if (lm.ambiguous || nm.ambiguous) return ctx.conflict(path, base, local, latest,
      '이름 없는 비슷한 블록이 여러 개라 대응 관계를 확정할 수 없어. 배열 전체를 선택하거나 직접 편집해 줘.');
    const values = new Map(), li = new Map(), ni = new Map();
    base.forEach((b, i) => {
      const l = lm.matched.has(i) ? local[lm.matched.get(i)] : NONE;
      const n = nm.matched.has(i) ? latest[nm.matched.get(i)] : NONE;
      const v = mergeValue(b, l, n, pointer(path, 'block-' + i), ctx);
      if (v !== NONE) values.set('b' + i, v);
      if (l !== NONE) li.set(lm.matched.get(i), 'b' + i);
      if (n !== NONE) ni.set(nm.matched.get(i), 'b' + i);
    });
    latest.forEach((n, j) => { if (!nm.used.has(j)) { values.set('n' + j, clone(n)); ni.set(j, 'n' + j); } });
    local.forEach((l, i) => {
      if (lm.used.has(i)) return;
      const candidates = latest.map((n, j) => ({ n, j })).filter(({ n, j }) => !nm.used.has(j) &&
        (same(l, n) || (l.id && l.id === n.id) || (l.name && l.name === n.name)));
      if (candidates.length === 1 && ![...li.values()].includes('n' + candidates[0].j)) {
        const { n, j } = candidates[0];
        values.set('n' + j, mergeValue(NONE, l, n, pointer(path, 'added-' + j), ctx)); li.set(i, 'n' + j);
      } else { values.set('l' + i, clone(l)); li.set(i, 'l' + i); }
    });
    const seq = (arr, map) => arr.map((_, i) => map.get(i)).filter(x => values.has(x) && values.get(x) !== NONE);
    const ls = seq(local, li), ns = seq(latest, ni);
    // Include a block kept through a deletion conflict, even when its side had no entry.
    const keptBase = base.map((_, i) => 'b' + i).filter(x => values.has(x) && values.get(x) !== NONE);
    const shared = keptBase.filter(x => ls.includes(x) && ns.includes(x));
    const bOrder = shared, lOrder = ls.filter(x => shared.includes(x)), nOrder = ns.filter(x => shared.includes(x));
    const localMoved = !same(bOrder, lOrder), latestMoved = !same(bOrder, nOrder);
    const orderLocal = weave(weave(ls, ns), keptBase), orderLatest = weave(weave(ns, ls), keptBase);
    let order = localMoved ? orderLocal : orderLatest;
    if (localMoved && latestMoved && !same(lOrder, nOrder)) {
      const arrays = order => order.map(id => values.get(id));
      return ctx.conflict(pointer(path, '@order'), arrays(keptBase), arrays(orderLocal), arrays(orderLatest),
        '블록 순서를 양쪽에서 다르게 바꿨어. 병합된 내용에 적용할 순서를 선택해 줘.');
    }
    return order.map(id => clone(values.get(id)));
  }

  let uid = 0;
  function parseToggles(text) {
    const groups = [];
    let current = null;
    const make = (name, explicit) => { const g = { uid: 'g' + (++uid), name, explicit, items: [] }; groups.push(g); return g; };
    String(text || '').split(/\r?\n/).forEach(raw => {
      const t = raw.trim(), start = t.match(/^=([^=]+)=group$/i);
      if (start) { current = make(start[1], true); return; }
      if (/^==groupEnd$/i.test(t)) {
        if (!current?.explicit) { current ||= make('', false); current.items.push({ type: 'raw', raw }); }
        current = null; return;
      }
      if (!current) current = make('', false);
      let item = { type: t === '==divider' ? 'divider' : 'raw', raw };
      if (t && !t.startsWith('#') && !t.startsWith('//')) {
        const m = t.match(/^([^=\s][^=]*)=(.*)$/);
        if (m) {
          const rest = m[2], parts = rest.split('=select=');
          item = { type: 'item', key: m[1].trim(), raw,
            label: parts.length > 1 ? parts[0] : rest.replace(/=text$/, '').split('=')[0],
            control: parts.length > 1 ? 'select' : rest.endsWith('=text') ? 'text' : 'toggle',
            options: parts.length > 1 ? parts.slice(1).join('=select=').split(',').map(x => x.trim()) : [] };
        }
      }
      current.items.push(item);
    });
    return groups.filter(g => g.explicit || g.items.some(it => it.raw !== ''));
  }
  function serializeToggles(groups) {
    return groups.flatMap(g => [...(g.explicit ? ['=' + g.name + '=group'] : []),
      ...g.items.map(it => it.type === 'divider' ? '==divider' : it.raw), ...(g.explicit ? ['==groupEnd'] : [])]).join('\n');
  }
  function readAliases(text) {
    const aliases = new Map(), targets = new Set();
    String(text || '').split(/\r?\n/).forEach(line => {
      if (!line.trim()) return;
      const m = line.trim().match(/^([^=]+)=([^=]+)$/);
      if (!m) throw new Error('키 대응표는 옛키=새키 형식으로 한 줄에 하나씩 작성해 줘.');
      const a = m[1].trim(), b = m[2].trim();
      if (!a || !b || aliases.has(a) || targets.has(b)) throw new Error('키 대응표에 빈 키나 중복 대응이 있어.');
      aliases.set(a, b); targets.add(b);
    });
    return aliases;
  }
  function remapGroups(groups, aliases) {
    return groups.map(g => ({ ...g, items: g.items.map(it => {
      if (it.type !== 'item' || !aliases.has(it.key)) return { ...it };
      const key = aliases.get(it.key);
      return { ...it, key, raw: key + it.raw.slice(it.raw.indexOf('=')) };
    }) }));
  }
  function definitions(groups, path, ctx) {
    const map = new Map();
    groups.forEach(g => g.items.forEach(it => {
      if (it.type !== 'item') return;
      if (map.has(it.key) && map.get(it.key).trim() !== it.raw.trim()) {
        const old = map.get(it.key);
        const v = ctx.conflict(pointer(path, it.key), NONE, old, it.raw,
          '같은 키가 서로 다른 정의로 중복되어 있어. 사용할 정의를 선택해 줘.');
        if (v !== NONE) map.set(it.key, v); else map.delete(it.key);
      } else map.set(it.key, it.raw);
    }));
    return map;
  }
  function migrateToggles(baseText, localText, latestText, options = {}, choices = {}) {
    const ctx = context(choices), aliases = readAliases(options.aliases);
    const bg = remapGroups(parseToggles(baseText || ''), aliases);
    const lg = remapGroups(parseToggles(localText || ''), aliases);
    const ng = parseToggles(latestText || '');
    const bm = definitions(bg, '/toggles/base-duplicates', ctx);
    const lm = definitions(lg, '/toggles/local-duplicates', ctx);
    const nm = definitions(ng, '/toggles/latest-duplicates', ctx);
    const merged = new Map();
    const hasBase = baseText !== null && baseText !== undefined;
    for (const key of new Set([...bm.keys(), ...lm.keys(), ...nm.keys()])) {
      const b = bm.has(key) ? bm.get(key) : NONE, l = lm.has(key) ? lm.get(key) : NONE, n = nm.has(key) ? nm.get(key) : NONE;
      let value;
      if (!hasBase) value = n !== NONE ? clone(n) : clone(l);
      else if (b !== NONE && n === NONE && l !== NONE) value = ctx.conflict(pointer('/toggles/definitions', key), b, l, NONE,
        '새 원본에 없는 토글이야. 기존 정의를 보존할지 제거할지 선택해 줘. 프롬프트에서도 이 키를 쓰는지 확인해 줘.');
      else value = mergeValue(b, l, n, pointer('/toggles/definitions', key), ctx, false);
      if (value !== NONE) {
        if (typeof value !== 'string' || parseToggles(value).flatMap(g => g.items).filter(it => it.type === 'item').length !== 1 ||
            parseToggles(value).flatMap(g => g.items).find(it => it.type === 'item').key !== key) throw new Error('토글 정의는 해당 키의 한 줄이어야 해: ' + key);
        merged.set(key, value);
      }
      const status = n === NONE ? (b === NONE && hasBase ? '커스텀 추가' : '미포함') : l === NONE ? '신규' : l.trim() !== n.trim() ? '변경' : '동일';
      ctx.changes.push({ key, status, local: preview(l), latest: preview(n),
        oldOptions: parseToggles(l === NONE ? '' : l).flatMap(g => g.items).find(it => it.type === 'item')?.options || [],
        newOptions: parseToggles(n === NONE ? '' : n).flatMap(g => g.items).find(it => it.type === 'item')?.options || [] });
    }
    if (!hasBase) ctx.warnings.push('옛 원본 없이 편집: 같은 키의 정의는 새 버전을 우선하고, 기존 즐겨찾기·배치를 유지해. 커스텀 라벨/선택지 변경 여부는 구분할 수 없어.');
    // Layout is user-owned. If unchanged from the baseline, use the upstream layout.
    const layout = gs => gs.map(g => ({ name: g.name, explicit: g.explicit,
      items: g.items.map(it => it.type === 'item' ? { key: it.key } : { raw: it.raw, type: it.type }) }));
    const withDefinition = it => ({ ...it, ...parseToggles(merged.get(it.key)).flatMap(g => g.items).find(x => x.type === 'item') });
    const favIndex = Number.isInteger(options.favoriteIndex) ? options.favoriteIndex : -1;
    const oldFav = lg[favIndex];
    let output = clone(hasBase && same(layout(bg), layout(lg)) ? ng : lg.length ? lg : ng);
    output = output.map(g => ({ ...g, uid: 'g' + (++uid), items: g.items.flatMap(it =>
      it.type !== 'item' ? [it] : merged.has(it.key) ? [withDefinition(it)] : []) }));
    // Do not drop a latest group with a colliding favorite name; append its unseen items instead.
    const visible = new Set(output.flatMap(g => g.items.filter(it => it.type === 'item').map(it => it.key)));
    ng.forEach(g => {
      const unseen = g.items.filter(it => it.type === 'item' && merged.has(it.key) && !visible.has(it.key));
      let target = output.find(x => x.name === g.name && x.explicit === g.explicit);
      const baselineGroup = bg.find(x => x.name === g.name && x.explicit === g.explicit);
      const additions = g.items.filter(it => it.type !== 'item' && it.raw.trim() &&
        !baselineGroup?.items.some(old => old.type === it.type && old.raw === it.raw) &&
        !target?.items.some(old => old.type === it.type && old.raw === it.raw));
      if (!unseen.length && !additions.length) return;
      if (!target) {
        target = { uid: 'g' + (++uid), name: g.name, explicit: g.explicit,
          items: g.items.flatMap(it => it.type !== 'item' ? [clone(it)] : unseen.includes(it) ? [withDefinition(it)] : []) };
        output.push(target);
        unseen.forEach(it => visible.add(it.key));
      } else {
        target.items.push(...additions.map(clone));
        unseen.forEach(it => { target.items.push(withDefinition(it)); visible.add(it.key); });
      }
    });
    // Retain locally added blocks even if the baseline layout happens to compare equal.
    lg.forEach(g => g.items.forEach(it => {
      if (it.type !== 'item' || !merged.has(it.key) || visible.has(it.key)) return;
      let target = output.find(x => x.name === g.name && x.explicit === g.explicit);
      if (!target) { target = { uid: 'g' + (++uid), name: g.name, explicit: g.explicit, items: [] }; output.push(target); }
      target.items.push(withDefinition(it)); visible.add(it.key);
    }));
    if (oldFav) {
      const favKeys = new Set(oldFav.items.filter(it => it.type === 'item' && merged.has(it.key)).map(it => it.key));
      const occurrence = lg.slice(0, favIndex).filter(g => g.name === oldFav.name && g.explicit === oldFav.explicit).length;
      const targets = output.filter(g => g.name === oldFav.name && g.explicit === oldFav.explicit);
      let target = targets[occurrence];
      if (!target) { target = { ...oldFav, uid: 'g' + (++uid), items: [] }; output.unshift(target); }
      const extras = target.items.filter(it => it.type === 'item' ? !favKeys.has(it.key) :
        !oldFav.items.some(old => old.type === it.type && old.raw === it.raw));
      target.items = oldFav.items.flatMap(it => it.type !== 'item' ? [clone(it)] : merged.has(it.key) ? [withDefinition(it)] : []).concat(extras);
      if (!options.keepInOriginal) output.forEach(g => { if (g !== target) g.items = g.items.filter(it => it.type !== 'item' || !favKeys.has(it.key)); });
      else ng.forEach(g => {
        const copies = g.items.filter(it => it.type === 'item' && favKeys.has(it.key));
        if (!copies.length) return;
        let original = output.find(x => x !== target && x.name === g.name && x.explicit === g.explicit);
        if (!original && g.name === target.name) return;
        if (!original) { original = { ...g, uid: 'g' + (++uid), items: [] }; output.push(original); }
        copies.forEach(it => { if (!original.items.some(x => x.key === it.key)) original.items.push(withDefinition(it)); });
      });
    }
    return { text: serializeToggles(output), groups: output, ...ctx };
  }
  function mergePresets(base, local, latest, options = {}, choices = {}) {
    const ctx = context(choices), result = clone(latest);
    const keys = new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(latest)]);
    keys.delete('customPromptTemplateToggle'); keys.delete('name');
    for (const key of keys) {
      if (!PROMPTS.has(key) && !options.preserveSettings) continue;
      if (SECRET_FIELDS.has(key) || /(?:api.?key|access.?token|refresh.?token|secret|password)$/i.test(key)) continue;
      const b = field(base, key), l = field(local, key), n = field(latest, key);
      const value = key === 'promptTemplate' ? mergeBlocks(b, l, n, pointer('', key), ctx) : mergeValue(b, l, n, pointer('', key), ctx);
      if (value === NONE) delete result[key]; else result[key] = value;
      if (!same(value, n)) ctx.changes.push({ key, status: '커스텀 수정 보존' });
    }
    const toggles = migrateToggles(base.customPromptTemplateToggle ?? '', local.customPromptTemplateToggle ?? '',
      latest.customPromptTemplateToggle ?? '', options, choices);
    if (keys.has('templateDefaultVariables')) ctx.warnings.push('기본 변수 정의는 병합하지만 현재 채팅에서 켜둔 토글 값·선택값은 옮기지 않아.');
    if ([base, local, latest].some(v => own(v, 'customPromptTemplateToggle'))) result.customPromptTemplateToggle = toggles.text;
    ctx.conflicts.push(...toggles.conflicts); ctx.warnings.push(...toggles.warnings);
    result.name = options.name || (latest.name || '프리셋') + ' · 커스텀 편집';
    return { preset: sanitizePreset(result), toggles, ...ctx };
  }
  function initialValue(local, latest, path, ctx) {
    if (same(local, latest) || local === NONE) return clone(latest);
    if (object(local) && object(latest)) {
      const result = clone(latest);
      for (const key of Object.keys(local)) {
        const value = initialValue(field(local, key), field(latest, key), pointer(path, key), ctx);
        if (value === NONE) delete result[key]; else result[key] = value;
      }
      return result;
    }
    return ctx.conflict(path, NONE, local, latest,
      latest === NONE ? '보관한 원본이 없어 커스텀 추가인지 원본에서 삭제된 항목인지 구분할 수 없어. 가져올 항목만 선택해 줘.' :
        '첫 편집이야. 커스텀 구문과 제작자의 변경을 자동으로 구분할 수 없으니 사용할 버전을 고르거나 직접 병합해 줘.');
  }
  function initialBlocks(local, latest, path, ctx) {
    if (same(local, latest) || local === NONE) return clone(latest);
    if (![local, latest].every(Array.isArray)) return initialValue(local, latest, path, ctx);
    const mapping = matchBlocks(latest, local);
    if (mapping.ambiguous) return ctx.conflict(path, NONE, local, latest,
      '첫 편집이고 비슷한 이름 없는 블록이 여러 개라 대응을 확정할 수 없어. 배열을 직접 편집하거나 사용할 버전을 선택해 줘.');
    const values = new Map(), localIds = new Map();
    latest.forEach((block, index) => {
      const id = 'n' + index;
      const value = mapping.matched.has(index) ? initialValue(local[mapping.matched.get(index)], block, pointer(path, 'block-' + index), ctx) : clone(block);
      if (value !== NONE) values.set(id, value);
      if (mapping.matched.has(index)) localIds.set(mapping.matched.get(index), id);
    });
    local.forEach((block, index) => {
      if (mapping.used.has(index)) return;
      const id = 'l' + index, value = initialValue(block, NONE, pointer(path, 'personal-' + index), ctx);
      if (value !== NONE) values.set(id, value);
      localIds.set(index, id);
    });
    const latestOrder = latest.map((_, index) => 'n' + index).filter(id => values.has(id));
    const localOrder = local.map((_, index) => localIds.get(index)).filter(id => values.has(id));
    const sharedLocal = localOrder.filter(id => id.startsWith('n'));
    if (!same(sharedLocal, latestOrder.filter(id => sharedLocal.includes(id)))) ctx.warnings.push('첫 편집에서는 공통 프롬프트 블록의 순서를 새 원본 기준으로 유지해.');
    return weave(latestOrder, localOrder).map(id => clone(values.get(id)));
  }
  function mergeInitialPresets(local, latest, options = {}, choices = {}) {
    const ctx = context(choices), result = clone(latest);
    for (const key of new Set([...Object.keys(local), ...Object.keys(latest)])) {
      if (key === 'name' || key === 'customPromptTemplateToggle' || (!PROMPTS.has(key) && !options.preserveSettings)) continue;
      if (SECRET_FIELDS.has(key) || /(?:api.?key|access.?token|refresh.?token|secret|password)$/i.test(key)) continue;
      const value = key === 'promptTemplate' ? initialBlocks(field(local, key), field(latest, key), pointer('', key), ctx) : initialValue(field(local, key), field(latest, key), pointer('', key), ctx);
      if (value === NONE) delete result[key]; else result[key] = value;
      if (!same(value, field(latest, key))) ctx.changes.push({key, status:'첫 편집 · 직접 선택'});
    }
    const toggles = migrateToggles(null, local.customPromptTemplateToggle || '', latest.customPromptTemplateToggle || '', options, choices);
    if ([local, latest].some(v => own(v, 'customPromptTemplateToggle'))) result.customPromptTemplateToggle = toggles.text;
    ctx.conflicts.push(...toggles.conflicts); ctx.warnings.push(...toggles.warnings);
    ctx.warnings.unshift('보관한 원본이 없는 첫 편집이야. 다른 구문·커스텀 블록을 직접 선택해 줘. 완성본을 저장하면 새 원본을 다음 비교 기준으로 자동 보관해.');
    result.name = options.name || (latest.name || '프리셋') + ' · 커스텀 편집';
    return {preset:sanitizePreset(result), toggles, ...ctx, firstMigration:true};
  }
  function validateReleases(data) {
    if (!object(data) || data.type !== 'risu-preset-release-archive' || data.version !== 1 || !Array.isArray(data.entries) || data.entries.length > 32) throw new Error('보관한 원본 데이터 형식이 올바르지 않아.');
    const ids = new Set();
    for (const entry of data.entries) {
      if (!object(entry) || typeof entry.id !== 'string' || !entry.id || ids.has(entry.id) || typeof entry.label !== 'string' || typeof entry.savedAt !== 'string') throw new Error('보관한 원본 항목이 올바르지 않아.');
      ids.add(entry.id);
      for (const key of ['preset', 'personalPreset', 'pendingPreset']) if (entry[key] != null) parsePreset(JSON.stringify(entry[key]));
      if (!entry.preset && !entry.personalPreset && !entry.pendingPreset && typeof entry.toggleBaseline !== 'string') throw new Error('보관한 프리셋 내용이 없어.');
      for (const key of ['toggleBaseline', 'personalToggles']) if (own(entry, key) && typeof entry[key] !== 'string') throw new Error('보관한 토글 내용이 올바르지 않아.');
    }
    return data;
  }
  const Core = { parseJSON, parsePreset, importPresetFile, exportPresetFile, sanitizePreset, mergeText, mergePresets, mergeBlocks, mergeInitialPresets, validateReleases,
    parseToggles, serializeToggles, migrateToggles, readAliases, same, context };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Core; return; }
  globalThis.PresetEditor = Core;
  if (typeof document === 'undefined') return;

  // The UI below runs in the plugin's own iframe, or as an offline standalone HTML.
  startUI(Core).catch(e => { console.error(e); document.body.textContent = '에디터 시작 오류: ' + e.message; });

  async function startUI(C) {
    document.title = '프리셋 에디터';
    document.documentElement.lang = 'ko';
    const api = globalThis.Risuai || globalThis.risuai;
    // Device-local preferences (theme). Falls back to localStorage outside RisuAI.
    const pref = {
      async get(key) { try { if (api?.safeLocalStorage) return await api.safeLocalStorage.getItem(key); } catch (_) { /* try localStorage */ } try { return localStorage.getItem(key); } catch (_) { return null; } },
      async set(key, value) { try { if (api?.safeLocalStorage) { await api.safeLocalStorage.setItem(key, value); return; } } catch (_) { /* try localStorage */ } try { localStorage.setItem(key, value); } catch (_) { /* storage unavailable */ } }
    };
    const LIGHT = '--bg:#f4f2ec;--bg2:#ece9e0;--surface:#fffdf8;--surface2:#f3f0e8;--surface3:#e7e3d7;--line:#ddd8ca;--line2:#c2bba8;--text:#24221d;--muted:#5f5b50;--faint:#8a8576;' +
      '--accent:#a85a06;--accent-ink:#fff;--accent-soft:#a85a0618;--info:#2858b8;--info-soft:#2858b816;--ok:#18704b;--ok-soft:#18704b16;--danger:#b42b2b;--danger-soft:#b42b2b14;--shadow:0 12px 32px rgba(60,48,20,.18);--base:#8a8576';
    const style = document.createElement('style');
    style.textContent = `
      :root{color-scheme:dark;--bg:#111318;--bg2:#161920;--surface:#1b1e27;--surface2:#232734;--surface3:#2c3142;--line:#2c3140;--line2:#3f465c;--text:#eceae4;--muted:#a3a9bb;--faint:#8b91a6;
        --accent:#efb866;--accent-ink:#241802;--accent-soft:#efb86624;--info:#8cb5ff;--info-soft:#8cb5ff22;--ok:#72d6a9;--ok-soft:#72d6a922;--danger:#ff8e8e;--danger-soft:#ff8e8e22;--base:#8b91a6;
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
      .btn.ok{background:var(--ok-soft);border-color:var(--ok);color:var(--ok);font-weight:700}
      .btn.ghost{background:transparent;border-color:transparent;color:var(--muted)}.btn.ghost:hover:not(:disabled){background:var(--surface2);color:var(--text);border-color:transparent}
      .btn.danger{color:var(--danger)}.btn.danger-solid{background:var(--danger);border-color:var(--danger);color:#1a0505;font-weight:700}
      .btn.sm{min-height:30px;padding:3px 10px;font-size:12.5px;border-radius:7px}.btn.lg{min-height:44px;padding:10px 24px;font-size:15px;border-radius:11px}
      .btn.icon{padding:0;width:34px;min-width:34px}.btn.sm.icon{width:30px;min-width:30px}.btn.on{color:var(--accent)}
      .count{display:inline-grid;place-items:center;min-width:19px;height:19px;padding:0 5px;border-radius:10px;background:var(--accent);color:var(--accent-ink);font-size:11px;font-weight:800}.count.ok{background:var(--ok-soft);color:var(--ok)}
      .field{display:grid;gap:5px;min-width:0}.field>span{font-size:12.5px;color:var(--muted);font-weight:600}
      input[type=text],input[type=search],select,textarea{width:100%;min-height:36px;padding:7px 10px;border:1px solid var(--line2);border-radius:9px;background:var(--bg2);color:var(--text)}
      textarea{font:12.5px/1.65 var(--mono);resize:vertical;min-height:110px}::placeholder{color:var(--faint)}
      input[type=checkbox]{width:17px;height:17px;accent-color:var(--accent);flex:none;margin:0}select{max-width:100%}
      .check{display:flex;align-items:flex-start;gap:9px;cursor:pointer}.checks{display:grid;gap:8px;align-content:center}
      .chrome{position:sticky;top:0;z-index:30;background:var(--bg);border-bottom:1px solid var(--line)}
      @supports (background:color-mix(in srgb,red,blue)){.chrome{background:color-mix(in srgb,var(--bg) 90%,transparent);backdrop-filter:blur(12px)}}
      .topbar,.stepbar,main{max-width:1280px;margin:0 auto}.topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 20px}
      .brand{display:flex;align-items:center;gap:12px;min-width:0}.brand p{color:var(--muted);font-size:12.5px}
      .mark{display:grid;place-items:center;flex:none;width:36px;height:36px;border-radius:10px;background:var(--accent);color:var(--accent-ink);font-size:18px;font-weight:800}
      .top-actions{display:flex;gap:8px;align-items:center}
      .stepbar{display:flex;align-items:center;gap:18px;padding:0 20px;overflow-x:auto}
      .seg{display:inline-flex;flex:none;padding:3px;margin:8px 0;background:var(--bg2);border:1px solid var(--line);border-radius:10px}
      .seg button{border:0;background:transparent;padding:4px 12px;min-height:30px;border-radius:7px;color:var(--muted);font-weight:600}
      .seg button[aria-pressed=true]{background:var(--surface3);color:var(--text);box-shadow:inset 0 0 0 1px var(--line2)}
      .steps{display:flex;gap:2px;flex:1;min-width:max-content}
      .step{display:flex;align-items:center;gap:8px;padding:12px;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--muted);font-weight:600;white-space:nowrap}
      .step .n{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;border:1px solid var(--line2);font-size:11px}
      .step[data-done=true] .n{background:var(--ok-soft);border-color:var(--ok);color:var(--ok)}
      .step[aria-selected=true]{color:var(--text);border-bottom-color:var(--accent)}.step[aria-selected=true] .n{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
      .step:hover:not(:disabled){color:var(--text)}.step:disabled{opacity:.38;cursor:not-allowed}
      main{padding:22px 20px 90px;display:grid;gap:16px}.step-panel,.stack{display:grid;gap:16px;min-width:0}
      .card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:22px;min-width:0}
      .card-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-bottom:16px}
      .lead{color:var(--muted);margin-top:4px;max-width:72ch}.hint{color:var(--muted);font-size:12.5px}.note{color:var(--muted);font-size:12.5px;padding:8px 12px;border-left:3px solid var(--accent);background:var(--accent-soft);border-radius:0 8px 8px 0}
      .badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:999px;background:var(--surface3);color:var(--muted);font-size:11.5px;font-weight:650;white-space:nowrap}
      .badge.new{background:var(--ok-soft);color:var(--ok)}.badge.changed{background:var(--info-soft);color:var(--info)}.badge.missing{background:var(--danger-soft);color:var(--danger)}.badge.custom{background:var(--accent-soft);color:var(--accent)}
      .row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.spread{justify-content:space-between}.grow{flex:1;min-width:0}.grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:end}
      .archive-bar{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;padding:14px;background:var(--bg2);border:1px solid var(--line);border-radius:12px}.archive-bar .field{flex:1;min-width:220px}
      .actionbar{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap}.actionbar .hint{margin-right:auto}
      .slots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:16px}
      .slot{display:grid;gap:10px;align-content:start;min-width:0;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--bg2);transition:border-color .15s,background .15s}
      .slot.dragover{border-color:var(--accent);background:var(--accent-soft)}.slot-head{display:flex;justify-content:space-between;align-items:center;gap:8px}
      .tag{display:inline-flex;align-items:center;gap:8px}.tag::before{content:'';width:10px;height:10px;border-radius:3px;background:var(--base)}.tag.mine::before{background:var(--accent)}.tag.theirs::before{background:var(--info)}
      .drop{display:grid;gap:2px;justify-items:center;width:100%;padding:24px 12px;border:1.5px dashed var(--line2);border-radius:10px;background:transparent;color:var(--muted);text-align:center;transition:border-color .15s,background .15s}
      .drop b{color:var(--text);font-size:14px}.drop small{font-size:12px}.drop:hover{border-color:var(--accent);background:var(--accent-soft)}
      .slot.filled .drop{padding:11px;border-style:solid;border-color:var(--line2)}.slot.filled .drop small{display:none}
      .file-status{color:var(--muted);font-size:12px;overflow-wrap:anywhere;min-height:0}.file-status:empty{display:none}
      .overview{font-weight:600;overflow-wrap:anywhere}.overview:empty{display:none}
      .baseline{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:14px;padding:12px 14px;border:1px solid var(--line);border-left:3px solid var(--base);border-radius:10px;background:var(--bg2)}
      .baseline strong{display:block;overflow-wrap:anywhere}.eyebrow{display:block;color:var(--muted);font-size:11.5px;font-weight:650;letter-spacing:.02em}
      .advanced{margin-top:16px;border-top:1px solid var(--line)}.advanced>summary{display:flex;align-items:center;gap:8px;padding:12px 0 4px;color:var(--muted);font-weight:650;cursor:pointer;list-style:none}
      .advanced>summary::-webkit-details-marker{display:none}.advanced>summary::before{content:'▸';font-size:11px;transition:transform .15s}.advanced[open]>summary::before{transform:rotate(90deg)}
      .adv-body{display:grid;gap:14px;padding-top:12px}
      .menu{position:relative}.menu>summary{list-style:none;cursor:pointer}.menu>summary::-webkit-details-marker{display:none}
      .menu-list{position:absolute;right:0;top:calc(100% + 6px);z-index:60;min-width:210px;display:grid;gap:2px;padding:6px;border:1px solid var(--line2);border-radius:12px;background:var(--surface);box-shadow:var(--shadow)}
      .menu-item{display:block;width:100%;min-height:34px;padding:7px 10px;border:0;border-radius:8px;background:transparent;text-align:left}.menu-item:hover:not(:disabled){background:var(--surface2)}.menu-item.danger{color:var(--danger)}.menu-item:disabled{opacity:.4}
      .conflict-grid{display:grid;grid-template-columns:250px minmax(0,1fr);gap:14px;align-items:start}.cindex{display:grid;gap:6px;max-height:calc(100dvh - 270px);overflow:auto}
      .cidx{display:grid;gap:1px;width:100%;padding:9px 11px;text-align:left;border:1px solid var(--line);border-radius:9px;background:var(--bg2);overflow-wrap:anywhere}.cidx small{color:var(--muted)}.cidx.resolved small{color:var(--ok)}.cidx[aria-current=true]{border-color:var(--accent);background:var(--accent-soft)}
      .conflict{display:grid;gap:14px;padding:18px;border:1px solid var(--line);border-radius:12px;background:var(--bg2)}.conflict code{font:12px var(--mono);color:var(--muted);overflow-wrap:anywhere}
      .versions{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr))}.versions.has-base{grid-template-columns:repeat(3,minmax(0,1fr))}
      .ver{min-width:0;border:1px solid var(--line);border-top:3px solid var(--base);border-radius:10px;background:var(--surface)}.ver.mine{border-top-color:var(--accent)}.ver.theirs{border-top-color:var(--info)}
      .ver b{display:block;padding:8px 12px;font-size:12.5px;border-bottom:1px solid var(--line)}.ver pre{margin:0;padding:12px;max-height:340px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.7 var(--mono)}
      .choices{display:flex;gap:8px;flex-wrap:wrap}.choices .btn[aria-pressed=true]{background:var(--ok-soft);border-color:var(--ok);color:var(--ok)}.conflict details textarea{min-height:240px;font-size:13px;margin:10px 0}
      .viewer-tools{display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-size:12.5px}.viewer-tools label{display:flex;gap:6px;align-items:center}.viewer-tools select{width:auto;min-height:30px;padding:3px 8px}
      .status-line{color:var(--ok);font-size:12.5px;margin-bottom:10px}.status-line:empty{display:none}
      .prompt-grid{display:grid;grid-template-columns:230px minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:start}
      .prompt-sidebar,.prompt-pane{min-width:0;border:1px solid var(--line);border-radius:12px;background:var(--bg2)}.prompt-sidebar{padding:12px;position:sticky;top:120px}
      .prompt-nav{display:grid;gap:3px;max-height:calc(100dvh - 290px);overflow:auto;margin-top:10px}
      .pnav{display:block;width:100%;padding:8px 10px;text-align:left;border:1px solid transparent;border-radius:8px;background:transparent;overflow-wrap:anywhere}.pnav:hover{background:var(--surface2)}.pnav[aria-current=true]{background:var(--accent-soft);border-color:var(--accent)}.pnav small{display:block;color:var(--muted);font-size:11.5px}
      .prompt-pane-head{display:grid;gap:4px;padding:12px 14px;border-bottom:1px solid var(--line)}.prompt-pane-head .row{justify-content:space-between}.prompt-pane-head select{width:auto;min-height:30px;padding:3px 8px}
      .prompt-pane-body{padding:14px;max-height:calc(100dvh - 250px);overflow:auto}.prompt-meta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
      .prompt-field{display:grid;gap:5px;margin-bottom:14px}.prompt-field>span{font-size:12.5px;color:var(--muted);font-weight:600}
      .prompt-field textarea,.prompt-reference{font:var(--prompt-font)/1.8 var(--mono);min-height:300px;tab-size:2}.prompt-field textarea[readonly]{opacity:.8}
      .prompt-reference{margin:0 0 14px;padding:12px;border:1px solid var(--line);border-radius:9px;background:var(--bg);white-space:pre-wrap;overflow-wrap:anywhere;overflow:auto;max-height:560px}
      .empty{padding:22px 14px;text-align:center;color:var(--muted)}.warn-text{color:var(--accent)}
      .editor-grid{display:grid;grid-template-columns:minmax(300px,.9fr) minmax(0,1.3fr);gap:18px;align-items:start}.pane{display:grid;gap:10px;align-content:start;min-width:0}
      .toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.toolbar input[type=search]{flex:1;min-width:140px}.toolbar select{width:auto}
      .scroll{display:grid;gap:8px;align-content:start;max-height:calc(100dvh - 340px);min-height:180px;overflow:auto;padding-right:4px}
      .citem,.tcard{min-width:0;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg2)}.citem.in-fav{border-color:var(--accent)}
      .key{font:12.5px var(--mono);color:var(--info);overflow-wrap:anywhere;font-weight:600}.label{overflow-wrap:anywhere}
      .pills{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}.pill{padding:1px 8px;border:1px solid var(--line2);border-radius:5px;background:var(--bg);font-size:11.5px}.pill.added{border-color:var(--ok);color:var(--ok)}.pill.removed{border-color:var(--danger);color:var(--danger);text-decoration:line-through}
      .group{overflow:hidden;border:1px solid var(--line);border-radius:12px;background:var(--surface)}.group.favorite{border-color:var(--accent)}
      .group-head{display:flex;align-items:center;gap:4px;padding:7px 8px;background:var(--surface2)}.group-head .name{flex:1;min-width:0;padding:0 4px;font-weight:700;overflow-wrap:anywhere}
      .group-body{display:grid;gap:6px;min-height:54px;padding:8px}.group-body.over{background:var(--accent-soft)}
      .tcard{display:grid;gap:6px;cursor:grab}.tcard.dragging{opacity:.4}.tcard.divider{border-style:dashed;color:var(--muted)}.tcard.raw{font:12px var(--mono);color:var(--muted);white-space:pre-wrap}
      .controls{display:flex;align-items:center;gap:4px;flex-wrap:wrap}.controls select{width:auto;max-width:150px;min-height:30px;padding:2px 6px;font-size:12px}
      .checklist{list-style:none;padding:0;margin:0 0 18px;display:grid;gap:8px}.checklist li{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg2)}
      .dot{display:grid;place-items:center;flex:none;width:22px;height:22px;border-radius:50%;background:var(--surface3);color:var(--muted);font-size:12px;font-weight:800}
      .checklist li[data-ok=true] .dot{background:var(--ok-soft);color:var(--ok)}.checklist li[data-ok=false] .dot{background:var(--danger-soft);color:var(--danger)}
      #output{min-height:160px;margin-top:14px}.report{overflow:auto;margin-top:12px}.report table{width:100%;border-collapse:collapse;font-size:12.5px}.report th,.report td{padding:8px;text-align:left;vertical-align:top;border-bottom:1px solid var(--line)}.report pre{margin:0 0 4px;max-width:480px;white-space:pre-wrap;overflow-wrap:anywhere;font:12px var(--mono)}
      details>summary{cursor:pointer}.report-sum{font-weight:650}
      .stepnav{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
      .toasts{position:fixed;inset:auto auto 20px 50%;margin:0;padding:0;border:0;background:transparent;overflow:visible;color:inherit;z-index:90;display:grid;gap:8px;width:min(580px,calc(100vw - 24px));transform:translateX(-50%);pointer-events:none}
      .toast{display:flex;align-items:flex-start;gap:8px;padding:10px 8px 10px 14px;border:1px solid var(--line2);border-radius:12px;background:var(--surface3);box-shadow:var(--shadow);pointer-events:auto;animation:rise .2s ease-out}
      .toast.ok{border-color:var(--ok)}.toast.error{border-color:var(--danger)}.toast-text{flex:1;padding-top:4px;overflow-wrap:anywhere}
      dialog{padding:0;color:var(--text);background:var(--surface);border:1px solid var(--line2);border-radius:16px;box-shadow:var(--shadow)}dialog::backdrop{background:rgba(5,6,10,.62)}
      .modal{width:min(440px,calc(100vw - 24px))}.modal form{display:grid;gap:14px;padding:22px}.dlg-actions{display:flex;justify-content:flex-end;gap:8px}
      .drawer{margin:0 0 0 auto;width:min(620px,100vw);height:100dvh;max-height:none;border-radius:16px 0 0 16px;border-right:0}.drawer[open]{display:flex;flex-direction:column;animation:slide .22s ease-out}
      .drawer-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:18px 20px;border-bottom:1px solid var(--line)}.drawer-body{display:grid;gap:14px;align-content:start;padding:18px 20px 30px;overflow:auto}
      .entry{display:grid;gap:10px;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--bg2)}.entry.current{border-color:var(--accent)}.facts{display:flex;flex-wrap:wrap;gap:6px;padding:0;list-style:none}
      @keyframes rise{from{opacity:0;transform:translateY(8px)}}@keyframes slide{from{opacity:0;transform:translateX(24px)}}
      @media (prefers-reduced-motion:reduce){*,::before,::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
      @media (max-width:1100px){.prompt-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.prompt-sidebar{grid-column:1/-1;position:static}.prompt-nav{display:flex;flex-wrap:wrap;max-height:140px}.pnav{width:auto;max-width:240px}.conflict-grid{grid-template-columns:200px minmax(0,1fr)}.versions.has-base{grid-template-columns:1fr}}
      @media (max-width:820px){.slots,.grid2,.editor-grid,.prompt-grid,.conflict-grid,.versions,.versions.has-base{grid-template-columns:1fr}.cindex{display:flex;flex-wrap:wrap;max-height:150px}.cidx{width:auto;max-width:100%}
        .topbar{padding:10px 14px}.stepbar{padding:0 14px}main{padding:16px 14px 90px}.brand p{display:none}.scroll,.prompt-pane-body{max-height:none}.card{padding:16px}.btn.lg{width:100%}}`;
    document.head.appendChild(style);
    document.body.innerHTML = `
      <div class="chrome">
        <header class="topbar">
          <div class="brand"><span class="mark" aria-hidden="true">✎</span><div><h1>프리셋 에디터</h1><p>내 커스텀을 새 버전 프리셋으로 옮겨 줘.</p></div></div>
          <div class="top-actions">
            <button id="open-library" class="btn" type="button" aria-haspopup="dialog">보관함 <span id="library-count" class="count" hidden></span></button>
            <details id="project-menu" class="menu"><summary class="btn" aria-label="작업 저장 · 불러오기 메뉴">작업 ▾</summary>
              <div class="menu-list">
                <button id="save-project" class="menu-item" type="button">앱에 저장</button>
                <button id="restore-project" class="menu-item" type="button">저장한 작업 불러오기</button>
                <button id="export-project" class="menu-item" type="button">파일로 내보내기</button>
                <button id="import-project" class="menu-item" type="button">파일에서 열기…</button>
              </div></details>
            <button id="theme" class="btn icon" type="button" aria-label="화면 테마 바꾸기" title="화면 테마 바꾸기">◐</button>
            <button id="close" class="btn" type="button" hidden>닫기</button>
          </div>
        </header>
        <div class="stepbar">
          <div class="seg" role="group" aria-label="작업 종류"><button type="button" data-mode="preset" aria-pressed="true">프리셋 업데이트</button><button type="button" data-mode="toggle" aria-pressed="false" title="토글 정의만 새 버전으로 옮기거나 즐겨찾기를 새로 만들 때 써.">토글만 편집</button></div>
          <nav id="steps" class="steps" role="tablist" aria-label="진행 단계"></nav>
        </div>
      </div>
      <input id="project-file" type="file" accept=".json" hidden>
      <main>
        <section id="step-files" class="step-panel" role="tabpanel" aria-labelledby="tab-files">
          <div id="files-preset" class="stack">
            <div class="card">
              <div class="card-head"><div><h2>파일 불러오기</h2><p class="lead">내가 고친 프리셋과 새로 나온 원본을 열어 줘. RisuAI에서 내보낸 .risup · .risupreset 파일을 그대로 쓸 수 있어.</p></div></div>
              <div class="archive-bar"><label class="field"><span>보관함에서 이어서 작업</span><select id="release-select"></select></label><button id="load-stored-presets" class="btn" type="button">보관한 파일 불러오기</button></div>
              <p id="release-status" class="hint" role="status" style="margin-top:8px"></p>
              <div id="preset-slots" class="slots"></div>
              <div class="baseline"><div class="grow"><span class="eyebrow">이번 비교 기준 원본</span><strong id="baseline-name"></strong><p id="baseline-help" class="hint"></p><p id="baseline-next" class="hint" hidden></p></div><span id="baseline-origin" class="badge" hidden></span><button id="baseline-view" class="btn sm" type="button" disabled>기준 원본 보기</button></div>
              <details id="preset-options" class="advanced"><summary>고급 옵션</summary>
                <div class="adv-body">
                  <div id="preset-base-input"></div>
                  <div class="grid2"><label class="field"><span>내 즐겨찾기 그룹 (자동 감지)</span><select id="preset-fav"></select></label>
                    <div class="checks"><label class="check"><input id="preset-keep" type="checkbox"><span>원래 그룹에도 즐겨찾기 남기기</span></label><label class="check"><input id="preserve-settings" type="checkbox"><span>모델·생성 설정의 커스텀 변경도 병합</span></label></div></div>
                  <label class="field"><span>토글 키 이름이 바뀐 경우 · 옛키=새키 (한 줄에 하나)</span><textarea id="preset-aliases" rows="3" placeholder="old_ooc=new_ooc"></textarea></label>
                </div></details>
            </div>
            <div class="actionbar"><span id="files-hint" class="hint" role="status"></span><button id="run-preset" class="btn primary lg" type="button">프리셋 병합하기</button></div>
          </div>
          <div id="files-toggle" class="stack" hidden>
            <div class="card">
              <div class="card-head"><div><h2>토글 불러오기</h2><p class="lead">내 토글 · 즐겨찾기와 새 원본의 토글을 열어 줘. 내 토글을 비워 두면 새 원본에서 즐겨찾기를 처음부터 만들 수 있어. 프리셋 파일(.risup)이면 결과도 .risup으로, 텍스트만 쓰면 .txt로 저장해.</p></div></div>
              <div class="archive-bar"><label class="field"><span>보관함에서 이어서 작업</span><select id="toggle-release-select"></select></label><button id="load-stored-toggles" class="btn" type="button">보관한 토글 불러오기</button></div>
              <p id="toggle-release-status" class="hint" role="status" style="margin-top:8px"></p>
              <div id="toggle-slots" class="slots"></div>
              <details id="toggle-options" class="advanced"><summary>고급 옵션</summary>
                <div class="adv-body">
                  <div id="toggle-base-input"></div>
                  <div class="grid2"><label class="field"><span>내 즐겨찾기 그룹 (자동 감지)</span><select id="toggle-fav"></select></label><div class="checks"><label class="check"><input id="toggle-keep" type="checkbox"><span>원래 그룹에도 즐겨찾기 남기기</span></label></div></div>
                  <label class="field"><span>토글 키 이름이 바뀐 경우 · 옛키=새키 (한 줄에 하나)</span><textarea id="toggle-aliases" rows="3" placeholder="old_ooc=new_ooc"></textarea></label>
                  <div><button id="from-presets" class="btn sm" type="button">프리셋 업데이트에 불러온 파일에서 가져오기</button></div>
                </div></details>
            </div>
            <div class="actionbar"><span id="toggle-hint" class="hint" role="status"></span><button id="run-toggle" class="btn primary lg" type="button">토글 편집하기</button></div>
          </div>
        </section>
        <section id="step-conflicts" class="step-panel" role="tabpanel" aria-labelledby="tab-conflicts" hidden>
          <div class="card">
            <div class="card-head"><div><h2>충돌 해결</h2><p id="conflicts-progress" class="lead"></p></div><div class="row"><button id="all-local" class="btn sm" type="button">전부 내 커스텀본으로</button><button id="all-latest" class="btn sm" type="button">전부 새 원본으로</button></div></div>
            <div class="conflict-grid"><nav id="conflict-index" class="cindex" aria-label="충돌 항목"></nav><div id="conflicts-list"></div></div>
          </div>
        </section>
        <section id="step-prompts" class="step-panel" role="tabpanel" aria-labelledby="tab-prompts" hidden>
          <div class="card">
            <div class="card-head"><div><h2>프롬프트 비교 · 편집</h2><p id="prompt-summary" class="lead"></p></div>
              <div class="viewer-tools"><label>글자 크기 <select id="prompt-font" aria-label="뷰어 글자 크기"><option value="13">13px</option><option value="14" selected>14px</option><option value="16">16px</option><option value="18">18px</option></select></label><label><input id="prompt-wrap" type="checkbox" checked>줄바꿈</label></div></div>
            <p id="prompt-edit-status" class="status-line" role="status"></p>
            <div class="prompt-grid">
              <aside class="prompt-sidebar"><input id="prompt-search" type="search" placeholder="이름 · 본문 검색" aria-label="프롬프트 검색"><nav id="prompt-nav" class="prompt-nav" aria-label="프롬프트 항목"></nav></aside>
              <section class="prompt-pane" aria-label="참조 프리셋"><div class="prompt-pane-head"><div class="row"><h3><span class="tag theirs">참조</span></h3><select id="prompt-reference-source" aria-label="참조 프리셋 선택"><option value="latest">새 원본</option><option value="local">내 커스텀본</option><option value="base">비교 기준 원본</option></select></div><p id="prompt-reference-name" class="hint"></p></div><div id="prompt-reference-body" class="prompt-pane-body"></div></section>
              <section class="prompt-pane" aria-label="작업 중"><div class="prompt-pane-head"><div class="row"><h3><span class="tag mine" id="prompt-work-title">내 커스텀본</span></h3><button id="prompt-reset" class="btn sm" type="button" disabled>이 항목 되돌리기</button></div><p id="prompt-work-name" class="hint"></p></div><div id="prompt-work-body" class="prompt-pane-body"></div></section>
            </div>
          </div>
        </section>
        <section id="step-toggles" class="step-panel" role="tabpanel" aria-labelledby="tab-toggles" hidden>
          <div class="card">
            <div class="card-head"><div><h2>토글 즐겨찾기 · 배치</h2><p class="lead">왼쪽 카탈로그에서 토글을 담고, 오른쪽에서 그룹과 순서를 정해. 끌어다 놓거나 버튼으로 옮길 수 있어. ★ 표시한 그룹이 즐겨찾기야.</p></div><span id="toggle-count" class="badge"></span></div>
            <div id="warnings" class="stack" style="margin-bottom:12px"></div>
            <div class="editor-grid">
              <div class="pane"><h3>토글 카탈로그</h3>
                <div class="toolbar"><input id="search" type="search" placeholder="키 · 라벨 · 선택지 검색" aria-label="토글 검색"><select id="filter" aria-label="카탈로그 필터"><option value="all">전체</option><option value="fav">즐겨찾기만</option><option value="other">안 담은 것만</option></select></div>
                <div class="toolbar"><button id="add-selected" class="btn sm" type="button">체크한 토글 담기</button><button id="add-new" class="btn sm" type="button">신규 토글 모두 담기</button><button id="remove-missing" class="btn sm danger" type="button">새 원본에 없는 토글 제거</button></div>
                <div id="catalog" class="scroll"></div></div>
              <div class="pane"><div class="row spread"><h3>결과 배치</h3><button id="add-group" class="btn sm" type="button">+ 그룹 추가</button></div><div id="groups" class="scroll"></div></div>
            </div>
            <details class="advanced"><summary>토글 텍스트 직접 편집</summary><div class="adv-body"><textarea id="toggle-draft" aria-label="결과 토글 텍스트" rows="10"></textarea><div><button id="apply-toggle-text" class="btn sm" type="button">편집한 텍스트 적용</button></div></div></details>
          </div>
        </section>
        <section id="step-save" class="step-panel" role="tabpanel" aria-labelledby="tab-save" hidden>
          <div class="card">
            <div class="card-head"><div><h2 id="save-title">저장</h2><p id="save-lead" class="lead"></p></div></div>
            <ul id="checklist" class="checklist"></ul>
            <div id="save-names" class="grid2" style="margin-bottom:16px"><label class="field"><span>결과 프리셋 이름</span><input id="preset-name" type="text" placeholder="새 원본 이름 · 커스텀 편집"></label><label class="field"><span>보관함 이름 (프리셋 종류별로 구분)</span><input id="release-label" type="text" placeholder="비워 두면 프리셋 이름을 써"></label></div>
            <div class="actionbar"><button id="copy-output" class="btn" type="button">토글 텍스트 복사</button><button id="download-output" class="btn primary lg" type="button">저장</button></div>
            <textarea id="output" readonly hidden aria-label="완성 토글 텍스트"></textarea>
            <p id="output-help" class="hint" style="margin-top:12px"></p>
          </div>
          <div class="card" id="report-panel"><details><summary id="report-title" class="report-sum">변경 내역 대조</summary><div id="report" class="report"></div></details></div>
          <div class="actionbar"><button id="next-update" class="btn" type="button">다음 업데이트 준비</button></div>
        </section>
        <div id="stepnav" class="stepnav"></div>
      </main>
      <div id="toasts" class="toasts" popover="manual"></div>
      <dialog id="dlg" class="modal" aria-labelledby="dlg-title"></dialog>
      <dialog id="library" class="drawer" aria-labelledby="library-title">
        <div class="drawer-head"><div><h2 id="library-title">보관함</h2><p id="library-status" class="hint" role="status"></p></div><div class="row"><button id="reload-releases" class="btn sm" type="button">새로고침</button><button id="library-close" class="btn ghost sm icon" type="button" aria-label="보관함 닫기">✕</button></div></div>
        <div class="drawer-body">
          <p class="lead" style="margin:0">프리셋을 종류별로 보관해 두면 다음 업데이트 때 자동으로 비교 기준이 돼. 완성본을 저장하면 기준 원본은 새 원본으로 자동 교체돼.</p>
          <p id="library-note" class="note" role="status" hidden></p>
          <div id="library-list" class="stack"></div>
          <details id="library-add" class="advanced"><summary>프리셋 파일 직접 보관하기</summary>
            <div class="adv-body">
              <div class="grid2"><label class="field"><span>보관 항목</span><select id="library-select"></select></label><label class="field"><span>보관 이름</span><input id="library-label" type="text" placeholder="프리셋 종류별 이름"></label></div>
              <label class="field"><span>파일 종류</span><select id="library-role"><option value="base">비교 기준 원본 · 처음 등록</option><option value="personal">내 커스텀본 · 즐겨찾기</option><option value="latest">새 원본 · 편집 대기</option></select></label>
              <div id="library-inputs"></div>
              <div><button id="store-library" class="btn primary" type="button">보관하기</button></div>
            </div></details>
        </div>
      </dialog>`;
    const $ = id => document.getElementById(id);
    const el = (tag, text, className) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (className) e.className = className; return e; };
    const button = (text, fn, className = 'btn sm') => { const b = el('button', text, className); b.type = 'button'; b.addEventListener('click', fn); return b; };
    const reduceMotion = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const inputIds = ['preset-base', 'preset-local', 'preset-latest', 'toggle-base', 'toggle-local', 'toggle-latest'];
    const optionIds = ['preset-fav', 'preset-keep', 'preserve-settings', 'preset-name', 'preset-aliases', 'toggle-fav', 'toggle-keep', 'toggle-aliases'];
    const fresh = () => ({ choices: {}, current: null, groups: [], catalog: new Map(), homes: new Map(), favoriteUid: '', selected: new Set(), collapsed: new Set(), manual: false, stale: false, promptDraft: null, conflictId: '', conflictDrafts: {} });
    const state = { mode: 'preset', step: { preset: 'files', toggle: 'files' }, work: { preset: fresh(), toggle: fresh() }, drag: null, exporting: false,
      archive: { type: 'risu-preset-release-archive', version: 1, activeId: '', entries: [] }, baseline: null, toggleBaseline: null, filePresets: {}, archiveLoaded: false, archiveAvailable: false, nextBaseline: null, nextToggleBaseline: null, storing: false, toggleBaseManaged: false };
    const promptView = { key: '', source: 'latest' };
    const STEP_LABEL = { files: '파일', conflicts: '충돌', prompts: '프롬프트', toggles: '토글', save: '저장' };
    const stepsFor = mode => mode === 'preset' ? ['files', 'conflicts', 'prompts', 'toggles', 'save'] : ['files', 'conflicts', 'toggles', 'save'];
    const active = () => state.work[state.mode] || fresh();
    const unresolved = () => active().current?.conflicts.filter(c => !c.resolved).length || 0;
    const merged = () => !!active().current && !active().stale;
    const ready = () => merged() && !unresolved();
    const guard = fn => async (...args) => { try { await fn(...args); } catch (e) { console.error(e); notify(e.message, 'error'); } };
    const modeOf = id => id.startsWith('preset') || id === 'preserve-settings' ? 'preset' : id.startsWith('toggle') ? 'toggle' : 'library';

    // ---- Feedback: toasts, modal dialogs, popover menus -------------------------------------
    function notify(text, type = '') {
      if (!text) return;
      const root = $('toasts'), toast = el('div', null, 'toast ' + type);
      toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
      const close = button('✕', () => toast.remove(), 'btn ghost sm icon'); close.setAttribute('aria-label', '알림 닫기');
      toast.append(el('span', text, 'toast-text'), close); root.append(toast);
      while (root.children.length > 3) root.firstElementChild.remove();
      // Re-show so the toast stacks above any open modal (e.g. the library drawer).
      try { if (root.showPopover) { if (root.matches(':popover-open')) root.hidePopover(); root.showPopover(); } } catch (_) { /* popover unsupported */ }
      if ($('library').open) { const note = $('library-note'); note.textContent = text; note.hidden = false; note.dataset.type = type; }
      if (type !== 'error') setTimeout(() => toast.remove(), type === 'ok' ? 5000 : 7000);
    }
    // window.confirm/prompt can be blocked inside a sandboxed iframe, so use an in-page <dialog>.
    function openDialog({ title, message, confirmText = '확인', danger = false, field = null }) {
      return new Promise(resolve => {
        const d = $('dlg'), form = el('form'); d.replaceChildren(); d.returnValue = ''; form.method = 'dialog';
        const heading = el('h2', title); heading.id = 'dlg-title'; form.append(heading);
        if (message) form.append(el('p', message, 'lead'));
        let input = null;
        if (field) { const label = el('label', null, 'field'); input = el('input'); input.type = 'text'; input.value = field.value || ''; label.append(el('span', field.label), input); form.append(label); }
        const cancel = button('취소', () => d.close('cancel'), 'btn'), ok = el('button', confirmText, 'btn ' + (danger ? 'danger-solid' : 'primary')); ok.type = 'submit';
        const actions = el('div', null, 'dlg-actions'); actions.append(cancel, ok); form.append(actions);
        form.addEventListener('submit', e => { e.preventDefault(); if (input && !input.value.trim()) { input.focus(); return; } d.close('ok'); });
        d.append(form);
        d.addEventListener('close', () => resolve(d.returnValue === 'ok' ? (input ? input.value.trim() : true) : (input ? null : false)), { once: true });
        d.showModal(); (input || cancel).focus(); if (input) input.select();
      });
    }
    const canModal = () => typeof $('dlg').showModal === 'function';
    const nativeConfirm = message => globalThis.confirm ? globalThis.confirm(message) : false;
    const ask = (title, message, confirmText = '계속', danger = false) => canModal() ? openDialog({ title, message, confirmText, danger }).catch(() => nativeConfirm(message)) : Promise.resolve(nativeConfirm(message));
    const askText = (title, label, value = '') => canModal() ? openDialog({ title, field: { label, value } }).catch(() => globalThis.prompt ? globalThis.prompt(label, value) : null) : Promise.resolve(globalThis.prompt ? globalThis.prompt(label, value) : null);
    // The library drawer is a modal; close it while a confirm/prompt is shown so the two never stack.
    async function outsideLibrary(fn) { const was = $('library').open; if (was) closeLibrary(); try { return await fn(); } finally { if (was) openLibrary(); } }
    document.addEventListener('click', e => document.querySelectorAll('details.menu[open]').forEach(m => { if (!m.contains(e.target) || e.target.closest('.menu-list button')) m.removeAttribute('open'); }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('details.menu[open]').forEach(m => { m.removeAttribute('open'); m.querySelector('summary')?.focus(); }); });
    function menu(label, items) {
      const d = el('details', null, 'menu'), summary = el('summary', '⋯', 'btn ghost sm icon'), list = el('div', null, 'menu-list');
      summary.setAttribute('aria-label', label);
      items.forEach(item => { const b = button(item.text, item.fn, 'menu-item' + (item.danger ? ' danger' : '')); b.disabled = !!item.disabled; list.append(b); });
      d.append(summary, list); return d;
    }

    // ---- Theme -----------------------------------------------------------------------------
    const applyTheme = theme => { if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme; else delete document.documentElement.dataset.theme; };
    pref.get('preset-editor:theme').then(applyTheme);
    $('theme').addEventListener('click', () => {
      const systemDark = !globalThis.matchMedia || globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
      const next = (document.documentElement.dataset.theme || (systemDark ? 'dark' : 'light')) === 'dark' ? 'light' : 'dark';
      applyTheme(next); pref.set('preset-editor:theme', next);
    });

    // ---- Steps -----------------------------------------------------------------------------
    function stepEnabled(step) {
      const w = active(), ok = merged();
      if (step === 'files') return true;
      if (step === 'conflicts') return ok && w.current.conflicts.length > 0;
      if (step === 'prompts') return state.mode === 'preset' && (ok || ['local', 'latest', 'base'].some(inputPreset));
      if (step === 'toggles') return ready();
      if (step === 'save') return ok;
      return false;
    }
    function goStep(step, focus = true) {
      if (!stepEnabled(step)) return;
      state.step[state.mode] = step; render();
      if (!focus) return;
      const heading = $('step-' + step).querySelector('h2'); if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
      globalThis.scrollTo?.({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
    }
    function renderChrome() {
      document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
      const w = active(), cur = state.step[state.mode], root = $('steps'); root.replaceChildren();
      stepsFor(state.mode).forEach((s, i) => {
        const b = el('button', null, 'step'); b.type = 'button'; b.id = 'tab-' + s; b.dataset.step = s;
        b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(s === cur)); b.setAttribute('aria-controls', 'step-' + s); b.tabIndex = s === cur ? 0 : -1; b.disabled = !stepEnabled(s);
        const done = s === 'files' ? merged() : s === 'conflicts' ? merged() && w.current.conflicts.length > 0 && !unresolved() : s === 'save' ? !!w.current?.savedRecord : false;
        if (done) b.dataset.done = 'true';
        b.append(el('span', done && s !== cur ? '✓' : String(i + 1), 'n'), el('span', STEP_LABEL[s]));
        if (s === 'conflicts' && merged() && w.current.conflicts.length) { const n = unresolved(); b.append(el('span', n ? String(n) : '✓', 'count' + (n ? '' : ' ok'))); b.setAttribute('aria-label', '충돌, 미해결 ' + n + '개'); }
        b.addEventListener('click', () => goStep(s)); root.append(b);
      });
    }
    $('steps').addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      const tabs = [...$('steps').querySelectorAll('.step:not(:disabled)')]; if (!tabs.length) return;
      const i = tabs.indexOf(document.activeElement), next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      e.preventDefault(); goStep(tabs[next].dataset.step, false); $('tab-' + tabs[next].dataset.step)?.focus();
    });
    function renderStepNav() {
      const root = $('stepnav'), cur = state.step[state.mode]; root.replaceChildren();
      const order = stepsFor(state.mode).filter(stepEnabled), i = order.indexOf(cur);
      root.hidden = cur === 'files' || i < 0;
      if (root.hidden) return;
      if (i > 0) root.append(button('← ' + STEP_LABEL[order[i - 1]], () => goStep(order[i - 1]), 'btn'));
      else root.append(el('span'));
      if (i < order.length - 1) root.append(button('다음 · ' + STEP_LABEL[order[i + 1]] + ' →', () => goStep(order[i + 1]), 'btn primary'));
    }
    function switchMode(mode) {
      state.mode = mode; $('search').value = ''; $('filter').value = 'all'; render();
    }
    document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => switchMode(b.dataset.mode)));

    function invalidate(mode) {
      const w = state.work[mode]; if (!w) return;
      const had = !!w.current;
      w.stale = true; w.choices = {}; w.conflictId = ''; w.conflictDrafts = {};
      if (state.mode === mode) { render(); if (had) notify('입력이 바뀌었어. 다시 병합해 줘.'); }
    }
    function updateFavoriteSelect(mode, remembered) {
      const select = $(mode + '-fav');
      if (!select) return;
      const hadGroups = select.options.length > 1;
      const previous = remembered == null ? select.value : remembered;
      let groups = [];
      try {
        const text = mode === 'preset' ? C.parsePreset($('preset-local').value).customPromptTemplateToggle || '' : $('toggle-local').value;
        groups = C.parseToggles(text);
      } catch (_) { /* Invalid input is reported when the user runs migration. */ }
      select.replaceChildren(); const none = el('option', '지정하지 않음'); none.value = '-1'; select.appendChild(none);
      groups.forEach((g, i) => { const opt = el('option', (i + 1) + '. ' + (g.name || '그룹 밖') + ' (' + g.items.filter(it => it.type === 'item').length + ')'); opt.value = String(i); select.appendChild(opt); });
      const recommended = groups.findIndex(g => /즐겨찾기|fav/i.test(g.name));
      if ((remembered != null || hadGroups) && previous !== '' && [...select.options].some(o => o.value === String(previous))) select.value = String(previous);
      else select.value = String(recommended);
    }

    // ---- Input slots (drop zone / paste area) ---------------------------------------------
    function refreshSlot(id) {
      const card = document.querySelector('[data-slot="' + id + '"]'); if (!card) return;
      const filled = !!$(id).value.trim(), isPreset = id.startsWith('preset') || id === 'library-source';
      card.classList.toggle('filled', filled);
      card.querySelector('.clear').hidden = !filled;
      if (!isPreset) return;
      const overview = card.querySelector('.overview');
      if (!filled) { overview.textContent = ''; return; }
      try {
        const preset = C.parsePreset($(id).value), toggles = C.parseToggles(preset.customPromptTemplateToggle || '');
        overview.textContent = (preset.name || '이름 없는 프리셋') + ' · 프롬프트 블록 ' + (preset.promptTemplate?.length || 0) + '개 · 토글 ' + toggles.reduce((n, g) => n + g.items.filter(it => it.type === 'item').length, 0) + '개';
      } catch (_) { overview.textContent = '프리셋 형식을 확인하고 파일을 다시 불러와 줘.'; }
    }
    function makeInput(parent, id, { title, tone = '', optional = false, hint = '' }) {
      const isPreset = id.startsWith('preset') || id === 'library-source';
      const card = el('section', null, 'slot'); card.dataset.slot = id;
      const head = el('div', null, 'slot-head'); head.append(el('h3', title, 'tag ' + tone)); if (optional) head.append(el('span', '선택', 'badge'));
      card.append(head); if (hint) card.append(el('p', hint, 'hint'));
      const file = el('input'); file.type = 'file'; file.hidden = true; file.tabIndex = -1; file.accept = '.risup,.risupreset,.json,.preset' + (isPreset ? '' : ',.txt,.text');
      const area = el(isPreset ? 'input' : 'textarea'); area.id = id; area.setAttribute('aria-label', title);
      const status = el('p', '', 'file-status'); status.setAttribute('role', 'status');
      const clear = button('지우기', () => {
        area.value = ''; delete state.filePresets[id]; status.textContent = '';
        refreshSlot(id); prepareStoredBaseline(id); updateFavoriteSelect(modeOf(id)); invalidate(modeOf(id));
      }, 'btn ghost sm clear');
      if (isPreset) {
        area.type = 'hidden';
        const drop = button('', () => file.click(), 'drop'); drop.append(el('b', '파일 열기'), el('small', '여기로 끌어다 놓거나 눌러서 선택'));
        card.append(drop, status, el('p', null, 'overview'), clear, area, file);
      } else {
        area.placeholder = optional ? '없으면 비워 둬. 직접 붙여넣어도 돼.' : '=그룹 이름=group\nkey=표시 이름\n==groupEnd'; area.rows = 7; area.spellcheck = false;
        const bar = el('div', null, 'row'); bar.append(button('파일 열기', () => file.click(), 'btn sm'), clear, status);
        card.append(area, bar, file);
      }
      parent.appendChild(card); refreshSlot(id);
      area.addEventListener('input', () => { status.textContent = '텍스트 입력'; refreshSlot(id); delete state.filePresets[id]; selectUploadedReference(id); prepareStoredBaseline(id); updateFavoriteSelect(modeOf(id)); invalidate(modeOf(id)); });
      const read = guard(async f => {
        if (!f) return;
        if (f.size > 10 * 1024 * 1024) throw new Error('파일은 10MB 이하로 불러와 줘.');
        let text;
        if (isPreset || /\.(?:risup|risupreset|json|preset)$/i.test(f.name)) {
          const preset = await C.importPresetFile(f);
          state.filePresets[id] = C.sanitizePreset(preset);
          text = isPreset ? JSON.stringify(preset, null, 2) : preset.customPromptTemplateToggle || '';
        } else {
          text = (await f.text()).replace(/^\uFEFF/, '');
          if (/^\s*\{/.test(text)) { const preset = C.sanitizePreset(C.parsePreset(text)); state.filePresets[id] = preset; text = preset.customPromptTemplateToggle || ''; }
          else delete state.filePresets[id];
        }
        area.value = text; status.textContent = f.name + ' · ' + Math.round(f.size / 1024) + 'KB';
        refreshSlot(id); selectUploadedReference(id); prepareStoredBaseline(id); updateFavoriteSelect(modeOf(id)); invalidate(modeOf(id));
      });
      file.addEventListener('change', () => { read(file.files[0]); file.value = ''; });
      card.addEventListener('dragover', e => { if (e.dataTransfer?.types.includes('Files')) { e.preventDefault(); card.classList.add('dragover'); } });
      card.addEventListener('dragleave', () => card.classList.remove('dragover'));
      card.addEventListener('drop', e => { if (e.dataTransfer?.files.length) { e.preventDefault(); card.classList.remove('dragover'); read(e.dataTransfer.files[0]); } });
    }
    makeInput($('preset-slots'), 'preset-local', { title: '내 커스텀본', tone: 'mine', hint: '내가 고쳐서 쓰던 프리셋' });
    makeInput($('preset-slots'), 'preset-latest', { title: '새 원본', tone: 'theirs', hint: '새로 나온 최신 프리셋' });
    makeInput($('preset-base-input'), 'preset-base', { title: '옛 원본 직접 불러오기', optional: true, hint: '비워 두면 선택한 보관본으로 비교해. 다른 원본으로 비교하고 싶을 때만 써.' });
    makeInput($('toggle-slots'), 'toggle-local', { title: '내 토글 · 즐겨찾기', tone: 'mine', optional: true, hint: '비워 두면 즐겨찾기를 새로 만들어.' });
    makeInput($('toggle-slots'), 'toggle-latest', { title: '새 원본 토글', tone: 'theirs', hint: '필수' });
    makeInput($('toggle-base-input'), 'toggle-base', { title: '옛 원본 토글 직접 불러오기', optional: true, hint: '비워 두면 보관한 기준 토글을 써.' });
    makeInput($('library-inputs'), 'library-source', { title: '보관할 프리셋 파일' });
    updateFavoriteSelect('preset'); updateFavoriteSelect('toggle');
    optionIds.forEach(id => {
      if (id === 'preset-name' || id.endsWith('-keep')) return;
      $(id).addEventListener(id.includes('aliases') ? 'input' : 'change', () => invalidate(modeOf(id)));
    });
    $('preset-name').addEventListener('input', () => { const c = state.work.preset.current; if (c) { c.savedRecord = null; if (state.mode === 'preset' && state.step.preset === 'save') renderSave(); } });

    // ---- Merge ------------------------------------------------------------------------------
    const migrationOptions = mode => ({ favoriteIndex: Number($(mode + '-fav').value), keepInOriginal: $(mode + '-keep').checked,
      aliases: $(mode + '-aliases').value, preserveSettings: $('preserve-settings').checked, name: $('preset-name').value.trim() });
    function run() {
      const w = active(), mode = state.mode, options = migrationOptions(mode);
      let result;
      if (mode === 'preset') {
        if (!state.archiveLoaded) throw new Error('보관한 원본을 불러오는 중이야. 잠시 뒤 다시 눌러 줘.');
        const values = ['local', 'latest'].map(key => { try { return C.parsePreset($('preset-' + key).value); } catch (e) { throw new Error(({ local: '내 커스텀본', latest: '새 원본' })[key] + ': ' + e.message); } });
        let baseline = state.baseline?.preset || null;
        if ($('preset-base').value.trim()) { try { baseline = C.parsePreset($('preset-base').value); } catch (e) { throw new Error('옛 원본: ' + e.message); } }
        result = baseline ? C.mergePresets(baseline, ...values, options, w.choices) : C.mergeInitialPresets(...values, options, w.choices);
        result.release = C.sanitizePreset(values[1]); result.releaseId = state.baseline?.id || '';
        result.releaseLabel = $('release-label').value.trim() || state.baseline?.label || values[1].name || '프리셋';
      } else {
        const source = state.filePresets['toggle-latest'] || null;
        if (!$('toggle-latest').value.trim() && !source) throw new Error('새 원본 토글을 불러와 줘.');
        const baseline = $('toggle-base').value.trim() ? $('toggle-base').value :
          state.toggleBaseline ? state.toggleBaseline.toggleBaseline ?? state.toggleBaseline.preset?.customPromptTemplateToggle ?? null : null;
        const toggles = C.migrateToggles(baseline, $('toggle-local').value, $('toggle-latest').value, options, w.choices);
        result = { toggles, conflicts: toggles.conflicts, changes: [], warnings: toggles.warnings,
          release: clone(source), releaseId: state.toggleBaseline?.id || '', releaseLabel: state.toggleBaseline?.label || source?.name || '토글 프리셋', toggleSource: $('toggle-latest').value };
      }
      w.current = result; w.stale = false; w.manual = false; w.promptDraft = null; w.groups = clone(result.toggles.groups); w.selected.clear();
      w.catalog = new Map();
      w.groups.forEach(g => g.items.forEach(it => { if (it.type === 'item') w.catalog.set(it.key, clone(it)); }));
      w.homes = new Map();
      w.groups.forEach(g => g.items.forEach(it => { if (it.type === 'item' && !w.homes.has(it.key)) w.homes.set(it.key, { name: g.name, explicit: g.explicit }); }));
      const homeText = mode === 'preset' ? C.parsePreset($('preset-latest').value).customPromptTemplateToggle || '' : $('toggle-latest').value;
      const latestHomes = new Set();
      C.parseToggles(homeText).forEach(g => g.items.forEach(it => {
        if (it.type === 'item' && !latestHomes.has(it.key)) { w.homes.set(it.key, { name: g.name, explicit: g.explicit }); latestHomes.add(it.key); }
      }));
      const localText = mode === 'preset' ? C.parsePreset($('preset-local').value).customPromptTemplateToggle : $('toggle-local').value;
      const originalGroups = C.parseToggles(localText || ''), selected = originalGroups[options.favoriteIndex];
      const occurrence = originalGroups.slice(0, options.favoriteIndex).filter(g => g.name === selected?.name && g.explicit === selected?.explicit).length;
      w.favoriteUid = selected ? w.groups.filter(g => g.name === selected.name && g.explicit === selected.explicit)[occurrence]?.uid || '' : '';
      render();
      const pending = unresolved();
      notify(pending ? pending + '개 충돌이 있어. 각 항목에서 사용할 버전을 골라 줘.' : '병합을 마쳤어! 결과를 확인하고 저장해 줘.', pending ? '' : 'ok');
    }
    async function requestRun() {
      const w = active();
      if (w.manual && !(await ask('다시 병합할까?', '다시 병합하면 직접 편집한 프롬프트와 토글 배치가 초기화돼.', '다시 병합', true))) return;
      run(); goStep(unresolved() ? 'conflicts' : state.mode === 'preset' ? 'prompts' : 'toggles');
    }
    $('run-preset').addEventListener('click', guard(requestRun));
    $('run-toggle').addEventListener('click', guard(requestRun));

    // ---- Conflicts --------------------------------------------------------------------------
    const promptLabels = { mainPrompt: '메인 프롬프트', jailbreak: '추가 프롬프트', globalNote: '글로벌 노트', templateDefaultVariables: '기본 변수', instructChatTemplate: '인스트럭트 템플릿', JinjaTemplate: 'Jinja 템플릿', formatingOrder: '포맷 순서', name: '이름', text: '본문', innerFormat: '내부 포맷', role: '역할' };
    const toggleSections = { definitions: '정의', 'base-duplicates': '옛 원본의 중복 키', 'local-duplicates': '내 커스텀본의 중복 키', 'latest-duplicates': '새 원본의 중복 키' };
    function friendlyPath(path, first) {
      const parts = path.split('/').slice(1).map(p => p.replace(/~1/g, '/').replace(/~0/g, '~')), head = parts[0], rest = parts.slice(1);
      const map = list => list.map(p => promptLabels[p] || p).join(' › ');
      if (head === 'toggles') return '토글 › ' + rest.map(p => toggleSections[p] || p).join(' › ');
      if (head === 'promptTemplate') {
        const m = /^(block|added|personal)-(\d+)$/.exec(rest[0] || '');
        if (m) {
          const source = first ? (m[1] === 'personal' ? 'local' : 'latest') : (m[1] === 'block' ? 'base' : 'latest');
          const block = inputPreset(source)?.promptTemplate?.[Number(m[2])];
          return '프롬프트 블록 “' + (block ? block.name || block.type : '#' + (Number(m[2]) + 1)) + '”' + (rest.length > 1 ? ' › ' + map(rest.slice(1)) : '');
        }
        return rest[0] === '@order' ? '프롬프트 블록 순서' : '프롬프트 블록' + (rest.length ? ' › ' + map(rest) : '');
      }
      return (promptLabels[head] || head) + (rest.length ? ' › ' + map(rest) : '');
    }
    function renderConflicts() {
      const w = active(), list = $('conflicts-list'), index = $('conflict-index'); list.replaceChildren(); index.replaceChildren();
      const conflicts = w.current?.conflicts || [], first = !!w.current?.firstMigration;
      const left = unresolved();
      $('conflicts-progress').textContent = left ? '미해결 ' + left + '개 · 전체 ' + conflicts.length + '개. 모두 고르면 저장할 수 있어.' : '모든 충돌을 해결했어. 다음 단계로 넘어가도 돼.';
      $('all-local').disabled = $('all-latest').disabled = !conflicts.length;
      if (!conflicts.some(c => c.id === w.conflictId)) w.conflictId = (conflicts.find(c => !c.resolved) || conflicts[0])?.id || '';
      conflicts.forEach(c => {
        const item = button('', () => { w.conflictId = c.id; renderConflicts(); }, 'cidx' + (c.resolved ? ' resolved' : ''));
        item.append(el('span', friendlyPath(c.path, first)), el('small', c.resolved ? '✓ 선택 완료' : '● 선택 필요'));
        item.setAttribute('aria-current', String(c.id === w.conflictId)); index.appendChild(item);
        if (c.id !== w.conflictId) return;
        const box = el('div', null, 'conflict');
        const title = el('div'); title.append(el('h3', friendlyPath(c.path, first)), el('code', c.path), el('p', c.reason, 'hint')); box.append(title);
        const versions = el('div', null, 'versions' + (first ? '' : ' has-base'));
        (first ? [['mine', '내 커스텀본', c.local], ['theirs', '새 원본', c.latest]] : [['base', '옛 원본', c.base], ['mine', '내 커스텀본', c.local], ['theirs', '새 원본', c.latest]]).forEach(([tone, name, text]) => {
          let display = text;
          if (['array', 'object'].includes(c.valueType)) { try { display = structuredText(C.parseJSON(text)); } catch (_) { /* Missing-version labels are already readable. */ } }
          const d = el('div', null, 'ver ' + tone); d.append(el('b', name), el('pre', display)); versions.appendChild(d);
        }); box.appendChild(versions);
        const controls = el('div', null, 'choices');
        ['local', 'latest', 'delete'].forEach(mode => {
          const b = button(({ local: '내 커스텀본 사용', latest: '새 원본 사용', delete: '이 항목 삭제' })[mode], guard(() => decide(c.id, { mode })), 'btn');
          b.setAttribute('aria-pressed', String(w.choices[c.id]?.mode === mode)); controls.appendChild(b);
        }); box.appendChild(controls);
        if (['array', 'object'].includes(c.valueType)) { box.appendChild(el('p', '구조 항목은 사용할 버전만 고를 수 있어. 프롬프트 본문은 충돌을 모두 고른 뒤 “프롬프트” 단계에서 고쳐.', 'hint')); list.appendChild(box); return; }
        const details = el('details'); details.appendChild(el('summary', '직접 병합하기'));
        const area = el('textarea'); area.setAttribute('aria-label', friendlyPath(c.path, first) + ' 직접 병합');
        const choice = w.choices[c.id]; area.value = w.conflictDrafts[c.id] ?? (choice?.mode === 'custom' ? (typeof choice.value === 'string' ? choice.value : JSON.stringify(choice.value, null, 2)) : c.latestMissing ? c.local : c.latest);
        area.addEventListener('input', () => { w.conflictDrafts[c.id] = area.value; });
        details.appendChild(area); details.appendChild(button('직접 편집한 값 사용', guard(() => {
          const value = c.valueType === 'string' ? area.value : C.parseJSON(area.value);
          if (c.valueType === 'array' && !Array.isArray(value)) throw new Error('이 항목은 JSON 배열이어야 해.');
          if (c.valueType === 'object' && !object(value)) throw new Error('이 항목은 JSON 객체이어야 해.');
          if (!['array', 'object'].includes(c.valueType) && typeof value !== c.valueType) throw new Error('값의 형식이 맞지 않아: ' + c.valueType);
          return decide(c.id, { mode: 'custom', value });
        }), 'btn primary'));
        box.appendChild(details); list.appendChild(box);
      });
    }
    async function decide(id, choice) {
      const w = active();
      if (w.manual && !(await ask('선택을 바꿀까?', '충돌 선택을 바꾸면 직접 편집한 프롬프트와 토글 배치가 초기화돼.', '바꾸기', true))) return;
      w.choices[id] = choice; w.conflictId = ''; run();
    }
    const chooseAll = mode => guard(async () => {
      const w = active();
      if (w.manual && !(await ask('전체를 다시 선택할까?', '전체 충돌을 다시 선택하면 편집한 프롬프트와 토글 배치가 초기화돼.', '진행', true))) return;
      w.current.conflicts.forEach(c => { w.choices[c.id] = { mode }; }); run();
    });
    $('all-local').addEventListener('click', chooseAll('local'));
    $('all-latest').addEventListener('click', chooseAll('latest'));

    // ---- Prompt viewer / editor ------------------------------------------------------------
    const mergedPromptVisible = () => !!state.work.preset.current && !state.work.preset.stale;
    function inputPreset(source) {
      try {
        const text = $('preset-' + source).value;
        return text.trim() ? C.parsePreset(text) : source === 'base' ? state.baseline?.preset || null : null;
      } catch (_) { return null; }
    }
    function selectUploadedReference(id) {
      if (id === 'preset-latest' && inputPreset('latest')) promptView.source = 'latest';
      else if (id === 'preset-local' && !inputPreset('latest')) promptView.source = 'local';
      else if (id === 'preset-base' && !inputPreset('latest') && !inputPreset('local')) promptView.source = 'base';
    }
    function rowsFromPreset(preset, origin = 'result') {
      if (!preset) return [];
      const rows = (preset.promptTemplate || []).map((value, index) => ({ key: (origin === 'result' ? '' : origin + ':') + 'block:' + index, index, value, origin, title: value.name || (index + 1) + '. ' + value.type, subtitle: value.type + (value.role ? ' · ' + value.role : '') }));
      for (const key of PROMPTS) if (key !== 'promptTemplate' && own(preset, key)) rows.push({ key: 'field:' + key, field: key, value: preset[key], origin, title: promptLabels[key] || key, subtitle: key });
      return rows;
    }
    function matchPromptBlock(original, originals, blocks) {
      if (!original || !blocks) return undefined;
      for (const key of ['id', 'uuid']) if (original[key] != null) {
        const matches = blocks.filter(b => same(b[key], original[key]));
        if (matches.length === 1 && originals.filter(b => same(b[key], original[key])).length === 1) return matches[0];
      }
      const matches = blocks.filter(b => b.type === original.type && (b.name || '') === (original.name || ''));
      return matches.length === 1 && originals.filter(b => b.type === original.type && (b.name || '') === (original.name || '')).length === 1 ? matches[0] : undefined;
    }
    function promptRows() {
      const w = state.work.preset;
      if (mergedPromptVisible()) return rowsFromPreset(w.promptDraft || w.current.preset);
      const local = inputPreset('local'), source = referencePreset(), rows = rowsFromPreset(local, 'local');
      if (promptView.source === 'local' && local) return rows;
      for (const row of rowsFromPreset(source, 'reference')) {
        const shared = row.field ? rows.some(r => r.field === row.field) : !!matchPromptBlock(row.value, source.promptTemplate, local?.promptTemplate);
        if (!shared) { row.subtitle += ' · 참조 항목'; rows.push(row); }
      }
      return rows;
    }
    const selectedPromptRow = () => promptRows().find(row => row.key === promptView.key);
    const referencePreset = () => inputPreset(promptView.source);
    function referenceBlock(row, source) {
      if (row.field) return source && own(source, row.field) ? source[row.field] : undefined;
      if (!source?.promptTemplate) return undefined;
      // An index is valid only within the exact source the preview row came from.
      if (row.origin === 'reference') return source.promptTemplate[row.index];
      if (row.origin === 'local' && promptView.source === 'local') return source.promptTemplate[row.index];
      const originalPreset = row.origin === 'local' ? inputPreset('local') : state.work.preset.current.preset;
      const original = originalPreset?.promptTemplate?.[row.index];
      return matchPromptBlock(original, originalPreset?.promptTemplate || [], source.promptTemplate);
    }
    function structuredText(value) {
      const lines = [];
      function visit(current, depth, title) {
        if (lines.length >= 1000) return;
        const indent = '  '.repeat(depth), prefix = title ? title + ': ' : '';
        if (current == null || typeof current !== 'object') { lines.push(indent + prefix + (current == null ? '없음' : String(current))); return; }
        lines.push(indent + prefix + (Array.isArray(current) ? '항목 ' + current.length + '개' : ''));
        if (depth >= 10) { lines.push(indent + '  (하위 항목 생략)'); return; }
        const entries = Object.entries(current);
        entries.slice(0, 100).forEach(([key, entry]) => visit(entry, depth + 1, Array.isArray(current) ? String(Number(key) + 1) : key));
        if (entries.length > 100) lines.push(indent + '  (추가 항목 ' + (entries.length - 100) + '개)');
      }
      visit(value, 0, ''); return lines.join('\n');
    }
    const promptText = value => typeof value === 'string' ? value : value == null ? '' : structuredText(value);
    function renderPromptNav() {
      const root = $('prompt-nav'); root.replaceChildren();
      const query = $('prompt-search').value.trim().toLocaleLowerCase(), rows = promptRows();
      rows.filter(row => !query || (row.title + '\n' + promptText(row.value)).toLocaleLowerCase().includes(query)).forEach(row => {
        const b = button('', () => { promptView.key = row.key; renderPromptNav(); renderPromptDetail(); }, 'pnav');
        b.setAttribute('aria-current', String(promptView.key === row.key)); b.append(el('span', row.title), el('small', row.subtitle)); root.appendChild(b);
      });
      if (!root.childElementCount) root.appendChild(el('p', query ? '검색 결과가 없어.' : '표시할 프롬프트 항목이 없어.', 'hint'));
    }
    function markPromptEdit() {
      const w = state.work.preset; w.manual = true; w.current.savedRecord = null;
      $('prompt-edit-status').textContent = '수정 내용이 완성본에 반영돼. 저장 단계에서 파일로 저장해 줘.';
      renderChrome();
    }
    function writePromptField(row, key, value) {
      if (!ready() || state.mode !== 'preset' || state.exporting) return;
      const w = state.work.preset;
      if (!w.promptDraft) w.promptDraft = clone(w.current.preset);
      if (row.field) w.promptDraft[row.field] = value;
      else w.promptDraft.promptTemplate[row.index][key] = value;
      markPromptEdit(); renderPromptNav(); $('prompt-reset').disabled = false;
    }
    function renderPromptDetail() {
      const row = selectedPromptRow(), source = referencePreset(), reference = $('prompt-reference-body'), work = $('prompt-work-body');
      const isMerged = mergedPromptVisible(), local = inputPreset('local');
      reference.replaceChildren(); work.replaceChildren();
      $('prompt-reference-name').textContent = source?.name || '불러온 참조 프리셋 없음';
      $('prompt-work-name').textContent = row ? row.title + ' · ' + row.subtitle : '왼쪽에서 항목을 선택해 줘.';
      $('prompt-work-title').textContent = isMerged ? '작업 중' : '내 커스텀본';
      $('prompt-edit-status').textContent = isMerged && state.work.preset.promptDraft ? '직접 편집한 내용이 완성본에 반영돼 있어.' : '';
      $('prompt-reset').disabled = !isMerged || !row || !ready() || !state.work.preset.promptDraft || state.exporting;
      if (!row) {
        const e1 = el('div', null, 'empty'); e1.append(el('p', '새 원본을 불러오거나 보관한 프리셋을 선택해 줘.'), button('파일 단계로 가기', () => goStep('files'), 'btn sm'));
        reference.appendChild(e1); work.appendChild(el('p', '내 커스텀본을 불러오면 병합 전에도 내용을 볼 수 있어.', 'empty')); return;
      }
      const value = referenceBlock(row, source), editable = isMerged && state.mode === 'preset' && ready() && !state.exporting;
      if (value === undefined) reference.appendChild(el('p', '이 참조에 대응하는 항목이 없거나, 같은 이름의 블록이 여러 개라 확정할 수 없어.', 'empty'));
      else if (!row.field) {
        const meta = el('div', null, 'prompt-meta'); [value.name || '(이름 없음)', value.type, value.type2, value.role].filter(Boolean).forEach(t => meta.appendChild(el('span', t, 'badge'))); reference.appendChild(meta);
        const texts = ['text', 'innerFormat'].filter(key => typeof value[key] === 'string');
        if (texts.length) texts.forEach(key => { reference.append(el('p', promptLabels[key], 'hint'), el('pre', value[key], 'prompt-reference')); });
        else reference.appendChild(el('pre', promptText(value), 'prompt-reference'));
      } else reference.appendChild(el('pre', promptText(value), 'prompt-reference'));
      const workValue = isMerged || row.origin === 'local' ? row.value : row.field ? local?.[row.field] : undefined;
      if (workValue === undefined) { work.appendChild(el('p', '내 커스텀본에 대응하는 항목이 없어. 참조 내용을 확인한 뒤 두 프리셋을 병합해 줘.', 'empty')); applyPromptWrap(); return; }
      const addField = (key, content, multiline) => {
        const label = el('label', null, 'prompt-field'), area = el(multiline ? 'textarea' : 'input'), name = row.field ? row.title : promptLabels[key] || key;
        if (!multiline) area.type = 'text';
        label.appendChild(el('span', name)); area.value = content; area.readOnly = !editable;
        area.setAttribute('aria-label', '작업 중 ' + name); area.dataset.promptField = key;
        if (multiline) area.spellcheck = false;
        area.addEventListener('input', () => { writePromptField(row, key, area.value); if (!row.field && key === 'name') $('prompt-work-name').textContent = area.value || '(이름 없음)'; });
        label.appendChild(area); work.appendChild(label);
      };
      if (row.field) {
        if (typeof workValue === 'string') addField(row.field, workValue, true);
        else work.append(el('p', '이 항목은 구조 데이터야. 원래 형식 그대로 보존해.', 'hint'), el('pre', promptText(workValue), 'prompt-reference'));
      } else {
        const meta = el('div', null, 'prompt-meta'); [workValue.type, workValue.type2].filter(Boolean).forEach(t => meta.appendChild(el('span', t, 'badge'))); work.appendChild(meta);
        ['name', 'text', 'innerFormat', 'role'].forEach(key => { if (typeof workValue[key] === 'string' || key === 'name') addField(key, workValue[key] || '', key === 'text' || key === 'innerFormat'); });
      }
      if (!editable) work.prepend(el('p', state.exporting ? '저장 중이야. 저장을 마치면 편집할 수 있어.' : !isMerged ? '병합 전 미리보기야. 병합하면 여기서 바로 고칠 수 있어.' : '충돌을 모두 고르면 여기서 편집할 수 있어.', 'hint warn-text'));
      applyPromptWrap();
    }
    function applyPromptWrap() {
      const wrap = $('prompt-wrap').checked;
      document.querySelectorAll('#step-prompts textarea').forEach(area => { area.wrap = wrap ? 'soft' : 'off'; });
      document.querySelectorAll('#step-prompts .prompt-reference').forEach(pre => { pre.style.whiteSpace = wrap ? 'pre-wrap' : 'pre'; pre.style.overflowWrap = wrap ? 'anywhere' : 'normal'; });
    }
    function renderPromptViewer() {
      if (!referencePreset()) promptView.source = ['latest', 'local', 'base'].find(source => inputPreset(source)) || 'latest';
      $('prompt-reference-source').value = promptView.source;
      const rows = promptRows(); if (!rows.some(row => row.key === promptView.key)) promptView.key = rows[0]?.key || '';
      $('prompt-summary').textContent = !rows.length ? '파일 단계에서 프리셋을 불러오면 프롬프트가 여기에 보여.' : '항목 ' + rows.length + '개 · ' + (mergedPromptVisible() ? '왼쪽 참조와 오른쪽 병합 결과를 비교하면서 바로 고칠 수 있어.' : '병합 전에도 참조와 내 커스텀본을 비교해 볼 수 있어.');
      renderPromptNav(); renderPromptDetail();
    }
    $('baseline-view').addEventListener('click', () => { if (!inputPreset('base')) return; promptView.source = 'base'; $('prompt-search').value = ''; goStep('prompts'); });
    $('prompt-search').addEventListener('input', renderPromptNav);
    $('prompt-reference-source').addEventListener('change', () => { promptView.source = $('prompt-reference-source').value; const rows = promptRows(); if (!rows.some(row => row.key === promptView.key)) promptView.key = rows[0]?.key || ''; renderPromptNav(); renderPromptDetail(); });
    $('prompt-font').addEventListener('change', () => { document.documentElement.style.setProperty('--prompt-font', $('prompt-font').value + 'px'); });
    $('prompt-wrap').addEventListener('change', applyPromptWrap);
    $('prompt-reset').addEventListener('click', guard(() => {
      const row = selectedPromptRow(), w = state.work.preset; if (!row || !ready() || !w.promptDraft || state.exporting) return;
      if (row.field) w.promptDraft[row.field] = clone(w.current.preset[row.field]);
      else w.promptDraft.promptTemplate[row.index] = clone(w.current.preset.promptTemplate[row.index]);
      markPromptEdit(); renderPromptNav(); renderPromptDetail();
    }));

    // ---- Files step -------------------------------------------------------------------------
    function renderPromptBaseline() {
      const manual = !!$('preset-base').value.trim(), base = inputPreset('base');
      const origin = $('baseline-origin'), next = $('baseline-next'), name = $('baseline-name'), help = $('baseline-help');
      origin.hidden = !base; origin.textContent = manual ? '직접 불러온 원본' : '보관한 원본';
      $('baseline-view').disabled = !base;
      if (base) {
        name.textContent = base.name || (!manual && state.baseline?.label) || '(이름 없는 원본)';
        help.textContent = '이 원본을 기준으로 내 커스텀본과 새 원본을 대조해서, 내 변경과 업데이트 변경을 구분해.';
      } else if (manual) {
        name.textContent = '직접 불러온 원본 확인 필요'; help.textContent = '직접 불러온 원본을 읽을 수 없어. 파일을 다시 불러와 줘.';
      } else if (!state.archiveLoaded) {
        name.textContent = '보관한 원본을 불러오는 중…'; help.textContent = '불러오기가 끝나면 이번 비교에 쓸 원본이 표시돼.';
      } else if (!state.archiveAvailable) {
        name.textContent = '보관한 원본 확인 필요'; help.textContent = '보관 저장소를 읽지 못했어. 보관함에서 새로고침하거나 고급 옵션에서 옛 원본을 직접 불러와 줘.';
      } else {
        name.textContent = '비교 기준 원본 없음 · 첫 비교';
        help.textContent = '내 변경과 업데이트 변경을 자동으로 구분할 기준이 없어서, 차이가 있는 항목을 직접 골라야 해. 저장하면 새 원본이 다음 비교 기준으로 보관돼.';
      }
      next.hidden = !state.nextBaseline;
      next.textContent = state.nextBaseline ? '다음 비교용으로 보관한 원본: ' + releaseName(state.nextBaseline) + ' · 이번 비교 기준은 그대로야.' : '';
    }
    function renderFiles() {
      const isPreset = state.mode === 'preset';
      $('files-preset').hidden = !isPreset; $('files-toggle').hidden = isPreset;
      if (isPreset) {
        const missing = [!inputPreset('local') && '내 커스텀본', !inputPreset('latest') && '새 원본'].filter(Boolean);
        $('run-preset').disabled = !state.archiveLoaded || missing.length > 0 || state.exporting || state.storing;
        $('run-preset').textContent = merged() ? '다시 병합하기' : '프리셋 병합하기';
        $('files-hint').textContent = !state.archiveLoaded ? '보관한 원본을 불러오는 중이야…' : missing.length ? missing.join('과 ') + ' 파일을 불러오면 병합할 수 있어.' :
          active().stale && active().current ? '입력이 바뀌었어. 다시 병합해 줘.' : merged() ? '병합 결과가 있어. 위의 단계 탭에서 이어서 작업해.' : '준비됐어. 병합 버튼을 눌러 줘.';
        renderPromptBaseline();
      } else {
        const hasLatest = !!$('toggle-latest').value.trim() || !!state.filePresets['toggle-latest'];
        $('run-toggle').disabled = !hasLatest || state.exporting || state.storing;
        $('run-toggle').textContent = merged() ? '다시 병합하기' : '토글 편집하기';
        $('toggle-hint').textContent = !hasLatest ? '새 원본 토글을 불러오면 시작할 수 있어.' : active().stale && active().current ? '입력이 바뀌었어. 다시 병합해 줘.' : merged() ? '결과가 있어. 위의 단계 탭에서 이어서 작업해.' : '준비됐어.';
      }
    }

    // ---- Toggle editor ----------------------------------------------------------------------
    const STATUS_CLASS = { '신규': 'new', '변경': 'changed', '미포함': 'missing', '커스텀 추가': 'custom' };
    const favorite = () => active().groups.find(g => g.uid === active().favoriteUid);
    const favKeys = () => new Set((favorite()?.items || []).filter(it => it.type === 'item').map(it => it.key));
    function optionPills(item, report) {
      const wrap = el('div', null, 'pills');
      item.options?.forEach(opt => wrap.appendChild(el('span', opt || '(빈 선택지)', 'pill' + (report && !report.oldOptions.includes(opt) ? ' added' : ''))));
      return wrap;
    }
    function changed() { const w = active(); w.manual = true; if (w.current) w.current.savedRecord = null; render(); }
    function ensureFavorite() {
      const w = active(); let g = favorite();
      if (!g) { g = { uid: 'g' + (++uid), name: '⭐내 즐겨찾기', explicit: true, items: [] }; w.groups.unshift(g); w.favoriteUid = g.uid; }
      return g;
    }
    function homeGroup(key, excluded) {
      const w = active(), home = w.homes.get(key) || { name: '기타', explicit: true };
      let other = w.groups.find(x => x !== excluded && x.name === home.name && x.explicit === home.explicit);
      if (!other) {
        other = { uid: 'g' + (++uid), name: home.name === excluded?.name ? '기타' : home.name, explicit: home.explicit, items: [] };
        w.groups.push(other);
      }
      return other;
    }
    function addFavorite(keys) {
      if (!ready()) return;
      const w = active(), target = ensureFavorite(), keep = migrationOptions(state.mode).keepInOriginal;
      let count = 0;
      keys.forEach(key => {
        if (target.items.some(it => it.type === 'item' && it.key === key) || !w.catalog.has(key)) return;
        if (!keep) w.groups.forEach(g => { if (g !== target) g.items = g.items.filter(it => it.type !== 'item' || it.key !== key); });
        target.items.push(clone(w.catalog.get(key))); count++;
      });
      w.selected.clear(); changed(); notify(count + '개를 즐겨찾기에 담았어.', 'ok');
    }
    function removeFavorite(key) {
      const w = active(), g = favorite(); if (!g) return;
      const item = g.items.find(it => it.type === 'item' && it.key === key);
      g.items = g.items.filter(it => it.type !== 'item' || it.key !== key);
      if (item && !w.groups.some(x => x.items.some(it => it.type === 'item' && it.key === key))) homeGroup(key, g).items.push(item);
      changed();
    }
    ['preset', 'toggle'].forEach(mode => $(mode + '-keep').addEventListener('change', () => {
      const w = state.work[mode];
      if (state.mode !== mode || !w.current || w.stale || unresolved()) { invalidate(mode); return; }
      const fav = favorite();
      if (fav) {
        if ($(mode + '-keep').checked) fav.items.filter(it => it.type === 'item').forEach(it => {
          const target = homeGroup(it.key, fav);
          if (!target.items.some(x => x.type === 'item' && x.key === it.key)) target.items.push(clone(it));
        });
        else { const keys = favKeys(); w.groups.forEach(g => { if (g !== fav) g.items = g.items.filter(it => it.type !== 'item' || !keys.has(it.key)); }); }
      }
      changed(); notify('즐겨찾기와 직접 조정한 배치는 그대로 두고 중복 표시 옵션만 적용했어.', 'ok');
    }));
    function renderCatalog() {
      const w = active(), list = $('catalog'); list.replaceChildren();
      const keys = favKeys(), query = $('search').value.toLowerCase().trim(), filter = $('filter').value;
      for (const [key, item] of w.catalog) {
        if (query && ![key, item.label, ...(item.options || [])].join(' ').toLowerCase().includes(query)) continue;
        const inFav = keys.has(key);
        if (filter === 'fav' && !inFav || filter === 'other' && inFav) continue;
        const card = el('div', null, 'citem' + (inFav ? ' in-fav' : '')); card.draggable = true;
        card.addEventListener('dragstart', e => { state.drag = { key }; e.dataTransfer.setData('text/plain', key); e.dataTransfer.effectAllowed = 'copy'; });
        card.addEventListener('dragend', () => { state.drag = null; });
        const row = el('div', null, 'row'), checkbox = el('input'), title = el('div', null, 'grow');
        checkbox.type = 'checkbox'; checkbox.checked = w.selected.has(key); checkbox.setAttribute('aria-label', key + ' 선택');
        checkbox.addEventListener('change', () => { if (checkbox.checked) w.selected.add(key); else w.selected.delete(key); });
        title.append(el('div', key, 'key'), el('div', item.label, 'label'));
        const toggle = button(inFav ? '✓ 담김' : '★ 담기', () => inFav ? removeFavorite(key) : addFavorite([key]), 'btn sm' + (inFav ? ' on' : ''));
        toggle.setAttribute('aria-label', key + (inFav ? ' 즐겨찾기에서 빼기' : ' 즐겨찾기에 담기')); toggle.title = inFav ? '눌러서 즐겨찾기에서 빼기' : '즐겨찾기에 담기';
        row.append(checkbox, title, toggle);
        const report = w.current.toggles.changes.find(c => c.key === key), meta = el('div', null, 'pills');
        meta.append(el('span', item.control.toUpperCase(), 'badge')); if (report && report.status !== '동일') meta.append(el('span', report.status, 'badge ' + (STATUS_CLASS[report.status] || '')));
        card.append(row, meta, optionPills(item, report)); list.appendChild(card);
      }
      if (!list.childElementCount) list.appendChild(el('div', '표시할 토글이 없어.', 'empty'));
    }
    function moveItem(sourceUid, sourceIndex, targetUid, targetIndex) {
      const w = active(), source = w.groups.find(g => g.uid === sourceUid), target = w.groups.find(g => g.uid === targetUid);
      if (!source || !target || !source.items[sourceIndex]) return;
      const [item] = source.items.splice(sourceIndex, 1);
      if (source === target && sourceIndex < targetIndex) targetIndex--;
      target.items.splice(Math.max(0, Math.min(targetIndex, target.items.length)), 0, item); changed();
    }
    function dropAt(e, group, index) {
      if (!state.drag || !ready()) return;
      e.preventDefault(); e.stopPropagation();
      if (state.drag.key) {
        const w = active(), it = w.catalog.get(state.drag.key);
        if (it && !group.items.some(x => x.key === it.key)) {
          if (!migrationOptions(state.mode).keepInOriginal) w.groups.forEach(g => { g.items = g.items.filter(x => x.type !== 'item' || x.key !== it.key); });
          group.items.splice(Math.min(index, group.items.length), 0, clone(it)); changed();
        }
      } else moveItem(state.drag.uid, state.drag.index, group.uid, index);
      state.drag = null;
    }
    const iconButton = (text, label, fn, disabled = false, extra = '') => { const b = button(text, fn, 'btn ghost sm icon' + extra); b.setAttribute('aria-label', label); b.title = label; b.disabled = disabled; return b; };
    function renderGroups() {
      const w = active(), list = $('groups'); list.replaceChildren();
      w.groups.forEach((group, gIndex) => {
        const isFav = group.uid === w.favoriteUid, collapsed = w.collapsed.has(group.uid), gname = group.name || '그룹 밖';
        const box = el('div', null, 'group' + (isFav ? ' favorite' : '')), head = el('div', null, 'group-head');
        const fold = iconButton(collapsed ? '▸' : '▾', gname + (collapsed ? ' 펼치기' : ' 접기'), () => { if (collapsed) w.collapsed.delete(group.uid); else w.collapsed.add(group.uid); renderGroups(); });
        fold.setAttribute('aria-expanded', String(!collapsed));
        const star = iconButton(isFav ? '★' : '☆', isFav ? gname + ' 즐겨찾기 지정 해제' : gname + ' 그룹을 즐겨찾기로 지정', () => { w.favoriteUid = isFav ? '' : group.uid; changed(); }, false, isFav ? ' on' : ''); star.setAttribute('aria-pressed', String(isFav));
        head.append(fold, el('span', gname + ' · ' + group.items.filter(it => it.type === 'item').length, 'name'), star,
          iconButton('↑', gname + ' 그룹 위로', () => { if (gIndex > 0) { [w.groups[gIndex - 1], w.groups[gIndex]] = [w.groups[gIndex], w.groups[gIndex - 1]]; changed(); } }, gIndex === 0),
          iconButton('↓', gname + ' 그룹 아래로', () => { if (gIndex < w.groups.length - 1) { [w.groups[gIndex + 1], w.groups[gIndex]] = [w.groups[gIndex], w.groups[gIndex + 1]]; changed(); } }, gIndex === w.groups.length - 1),
          menu(gname + ' 그룹 메뉴', [
            { text: '이름 바꾸기', fn: guard(async () => {
              const input = await askText('그룹 이름 바꾸기', '그룹 이름', group.name || '기본'); const name = input == null ? '' : String(input).trim(); if (!name) return;
              if (/[=\r\n]/.test(name)) { notify('그룹 이름에 = 또는 줄바꿈은 넣을 수 없어.', 'error'); return; }
              group.name = name; group.explicit = true; changed(); }) },
            { text: '구분선 추가', fn: () => { group.items.unshift({ type: 'divider', raw: '==divider' }); changed(); } },
            { text: '그룹 삭제', danger: true, disabled: isFav, fn: guard(async () => { if (await ask('그룹을 삭제할까?', '이 그룹과 포함된 항목을 결과에서 삭제해. 카탈로그에서 다시 담을 수 있어.', '삭제', true)) { w.groups.splice(gIndex, 1); changed(); } }) }]));
        const body = el('div', null, 'group-body'); body.hidden = collapsed;
        body.addEventListener('dragover', e => { if (state.drag) { e.preventDefault(); body.classList.add('over'); } });
        body.addEventListener('dragleave', () => body.classList.remove('over'));
        body.addEventListener('drop', e => dropAt(e, group, group.items.length));
        group.items.forEach((item, index) => {
          const card = el('div', null, 'tcard' + (item.type === 'divider' ? ' divider' : item.type === 'raw' ? ' raw' : '')); card.draggable = true;
          const name = item.key || (item.type === 'divider' ? '구분선' : '텍스트');
          card.addEventListener('dragstart', e => { state.drag = { uid: group.uid, index }; e.dataTransfer.setData('text/plain', item.key || item.type); e.dataTransfer.effectAllowed = 'move'; card.classList.add('dragging'); });
          card.addEventListener('dragend', () => { state.drag = null; card.classList.remove('dragging'); });
          card.addEventListener('dragover', e => { if (state.drag) e.preventDefault(); }); card.addEventListener('drop', e => dropAt(e, group, index));
          const row = el('div', null, 'row spread');
          if (item.type === 'item') { const label = el('div', null, 'grow'); label.append(el('div', item.key, 'key'), el('div', item.label, 'label')); row.appendChild(label); }
          else row.appendChild(el('span', item.type === 'divider' ? '── 구분선 ──' : item.raw || '(빈 줄)', 'grow'));
          const controls = el('div', null, 'controls');
          controls.append(iconButton('↑', name + ' 위로', () => moveItem(group.uid, index, group.uid, index - 1), index === 0),
            iconButton('↓', name + ' 아래로', () => moveItem(group.uid, index, group.uid, index + 2), index === group.items.length - 1));
          const target = el('select'); target.setAttribute('aria-label', name + ' 다른 그룹으로 이동');
          w.groups.forEach(g => { const op = el('option', g.name || '그룹 밖'); op.value = g.uid; target.appendChild(op); }); target.value = group.uid;
          target.addEventListener('change', () => moveItem(group.uid, index, target.value, w.groups.find(g => g.uid === target.value).items.length));
          controls.append(target, iconButton('×', name + ' 결과에서 빼기', () => { group.items.splice(index, 1); changed(); }));
          row.appendChild(controls); card.appendChild(row);
          if (item.type === 'item') card.appendChild(optionPills(item, w.current.toggles.changes.find(c => c.key === item.key)));
          body.appendChild(card);
        });
        if (!group.items.length) body.appendChild(el('div', '토글을 여기로 끌어다 놓거나 카탈로그에서 담아 줘.', 'empty'));
        box.append(head, body); list.appendChild(box);
      });
      if (!list.childElementCount) list.appendChild(el('div', '아직 그룹이 없어. 그룹을 추가하거나 카탈로그에서 토글을 담아 줘.', 'empty'));
    }
    function renderToggles() {
      const w = active(); if (!ready()) return;
      renderCatalog(); renderGroups();
      const changes = w.current.toggles.changes, added = changes.filter(c => c.status === '신규').length, missing = changes.filter(c => c.status === '미포함').length;
      $('toggle-count').textContent = '즐겨찾기 ' + favKeys().size + '개 · 전체 ' + w.catalog.size + '개';
      $('add-new').textContent = '신규 토글 모두 담기' + (added ? ' (' + added + ')' : ''); $('add-new').disabled = !added;
      $('remove-missing').textContent = '새 원본에 없는 토글 제거' + (missing ? ' (' + missing + ')' : ''); $('remove-missing').disabled = !missing;
      $('warnings').replaceChildren(); (w.current.warnings || []).forEach(text => $('warnings').appendChild(el('p', text, 'note')));
      if (w.manual) $('warnings').appendChild(el('p', '결과 배치를 직접 수정했어. 지금 배치가 그대로 완성본에 들어가.', 'note'));
      $('toggle-draft').value = C.serializeToggles(w.groups); $('toggle-draft').scrollTop = 0;
    }
    $('search').addEventListener('input', () => { if (ready()) renderCatalog(); });
    $('filter').addEventListener('change', () => { if (ready()) renderCatalog(); });
    $('add-selected').addEventListener('click', () => { const keys = [...active().selected]; if (!keys.length) { notify('담을 토글을 먼저 체크해 줘.'); return; } addFavorite(keys); });
    $('add-new').addEventListener('click', () => addFavorite(active().current.toggles.changes.filter(c => c.status === '신규').map(c => c.key)));
    $('remove-missing').addEventListener('click', guard(async () => {
      const missing = new Set(active().current.toggles.changes.filter(c => c.status === '미포함').map(c => c.key));
      if (!missing.size) { notify('새 원본에 없는 토글이 없어.'); return; }
      if (!(await ask('새 원본에 없는 토글을 제거할까?', missing.size + '개 토글을 결과의 모든 그룹에서 빼. 내가 직접 만든 커스텀 토글일 수도 있으니 저장 단계의 변경 내역을 먼저 확인해 줘.', '제거', true))) return;
      active().groups.forEach(g => { g.items = g.items.filter(it => it.type !== 'item' || !missing.has(it.key)); }); changed();
    }));
    $('add-group').addEventListener('click', guard(async () => {
      const input = await askText('그룹 추가', '새 그룹 이름'); const name = input == null ? '' : String(input).trim(); if (!name) return;
      if (/[=\r\n]/.test(name)) { notify('그룹 이름에 = 또는 줄바꿈은 넣을 수 없어.', 'error'); return; }
      active().groups.push({ uid: 'g' + (++uid), name, explicit: true, items: [] }); changed();
    }));
    $('apply-toggle-text').addEventListener('click', guard(() => {
      const text = $('toggle-draft').value, check = C.migrateToggles(null, text, text);
      if (check.conflicts.length) throw new Error('같은 키가 서로 다른 정의로 중복돼 있어. 정의를 통일한 뒤 적용해 줘.');
      const w = active(), prior = favorite(), index = w.groups.indexOf(prior);
      w.groups = C.parseToggles(text);
      w.favoriteUid = w.groups[index]?.name === prior?.name ? w.groups[index].uid : '';
      w.groups.forEach(g => g.items.forEach(it => { if (it.type === 'item') w.catalog.set(it.key, clone(it)); })); changed(); notify('편집한 토글 텍스트를 적용했어.', 'ok');
    }));
    $('from-presets').addEventListener('click', guard(() => {
      ['base', 'local', 'latest'].forEach(key => {
        const preset = $('preset-' + key).value.trim() ? C.parsePreset($('preset-' + key).value) : key === 'base' ? state.baseline?.preset : null;
        $('toggle-' + key).value = preset?.customPromptTemplateToggle || '';
        if (preset) state.filePresets['toggle-' + key] = C.sanitizePreset(preset); else delete state.filePresets['toggle-' + key];
        setSlotStatus('toggle-' + key, preset ? '프리셋 업데이트의 파일에서 가져옴' : '');
      });
      state.toggleBaseline = clone(state.baseline); state.nextToggleBaseline = null; refreshReleases();
      updateFavoriteSelect('toggle', $('preset-fav').value); invalidate('toggle'); notify('프리셋 업데이트에 불러온 파일에서 토글 정의를 가져왔어.');
    }));
    function setSlotStatus(id, text) { const s = document.querySelector('[data-slot="' + id + '"] .file-status'); if (s) s.textContent = text; }

    // ---- Save step --------------------------------------------------------------------------
    function download(name, text, type) {
      const url = URL.createObjectURL(new Blob([text], { type })), a = el('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    function currentOutput() {
      const w = active(), text = C.serializeToggles(w.groups);
      if (state.mode !== 'preset') return text;
      const result = clone(w.promptDraft || w.current.preset);
      if (own(result, 'customPromptTemplateToggle') || text.trim()) result.customPromptTemplateToggle = text;
      result.name = $('preset-name').value.trim() || result.name;
      C.parsePreset(JSON.stringify(result));
      return JSON.stringify(C.sanitizePreset(result), null, 2);
    }
    function renderChecklist(w) {
      const root = $('checklist'); root.replaceChildren();
      const left = unresolved();
      [[true, '병합을 마쳤어', null],
        [left === 0, left ? '풀지 못한 충돌이 ' + left + '개 남았어' : '충돌을 모두 해결했어', left ? ['충돌 보러 가기', () => goStep('conflicts')] : null],
        [null, w.manual ? '직접 편집한 내용이 있어. 지금 상태 그대로 저장돼.' : '직접 편집한 내용은 없어.', null],
        [w.current.savedRecord ? true : null, w.current.savedRecord ? '저장했고 기준 원본을 새 원본으로 교체했어.' : '아직 저장하지 않았어.', null]].forEach(([ok, text, action]) => {
        const li = el('li'); li.dataset.ok = String(ok); li.append(el('span', ok === true ? '✓' : ok === false ? '!' : '–', 'dot'), el('span', text, 'grow'));
        if (action) li.append(button(action[0], action[1], 'btn sm')); root.append(li);
      });
    }
    function renderReport() {
      const w = active(), changes = w.current?.toggles.changes || [], root = $('report'); root.replaceChildren();
      const diff = changes.filter(c => c.status !== '동일');
      $('report-panel').hidden = !w.current || w.stale;
      $('report-title').textContent = '변경 내역 대조 · 토글 ' + diff.length + '개' + (state.mode === 'preset' ? ' / 프롬프트 커스텀 보존 ' + (w.current?.changes.length || 0) + '개' : '');
      if (diff.length) {
        const table = el('table'), head = el('tr'); ['상태 · 키', '내 정의', '새 원본 정의'].forEach(t => head.appendChild(el('th', t))); table.appendChild(head);
        diff.forEach(c => {
          const tr = el('tr'), status = el('td'), old = el('td'), latest = el('td');
          status.append(el('span', c.status, 'badge ' + (STATUS_CLASS[c.status] || '')), el('div', c.key, 'key'));
          old.appendChild(el('pre', c.local)); latest.appendChild(el('pre', c.latest));
          c.oldOptions.filter(x => !c.newOptions.includes(x)).forEach(x => old.appendChild(el('span', x, 'pill removed')));
          c.newOptions.filter(x => !c.oldOptions.includes(x)).forEach(x => latest.appendChild(el('span', x, 'pill added')));
          tr.append(status, old, latest); table.appendChild(tr);
        }); root.appendChild(table);
      } else root.appendChild(el('p', '달라진 토글이 없어.', 'hint'));
      (w.current?.changes || []).forEach(c => root.appendChild(el('p', (promptLabels[c.key] || c.key) + ' · ' + c.status, 'hint')));
    }
    function renderSave() {
      const w = active(), mode = state.mode, isPreset = mode === 'preset';
      if (!w.current) return;
      const valid = ready(), binaryOutput = isPreset || (mode === 'toggle' && !!w.current.release);
      $('save-title').textContent = valid ? '저장' : '저장 전에 확인할 게 있어';
      $('save-lead').textContent = isPreset ? '프롬프트 편집 내용과 토글 배치를 .risup 파일로 저장해. 저장하면 기준 원본이 새 원본으로 바뀌고, 내 커스텀 완성본도 보관함에 남아.' :
        binaryOutput ? '새 원본 프리셋에 결과 토글을 넣어 .risup으로 저장해. 저장하면 기준 토글과 완성본이 보관함에 남아. 아래 텍스트는 토글만 복사할 때 써.' :
          '완성 토글 텍스트를 .txt로 저장하거나 복사해서 RisuAI의 커스텀 프롬프트 토글 입력란에 붙여넣어. 저장하면 토글 비교 기준도 새 정의로 바뀌어.';
      renderChecklist(w);
      $('save-names').hidden = !isPreset; $('output').hidden = isPreset; $('copy-output').hidden = isPreset; $('next-update').parentElement.hidden = !isPreset;
      $('copy-output').disabled = !valid; $('download-output').disabled = !valid || state.exporting || state.storing; $('next-update').disabled = !valid || state.exporting || !w.current.savedRecord;
      $('download-output').textContent = state.exporting ? '파일 만드는 중…' : binaryOutput ? '.risup 파일로 저장' : '.txt 파일로 저장';
      $('output-help').textContent = isPreset ? '“다음 업데이트 준비”는 저장한 뒤에 쓸 수 있어. 완성본이 내 커스텀본이 되고 방금 쓴 새 원본이 비교 기준이 돼.' : '';
      $('output-help').className = 'hint';
      try { $('output').value = currentOutput(); }
      catch (e) { $('download-output').disabled = $('copy-output').disabled = $('next-update').disabled = true; $('output').value = ''; $('output-help').textContent = '결과 형식을 확인해 줘: ' + e.message; $('output-help').className = 'hint warn-text'; }
      renderReport();
    }
    $('download-output').addEventListener('click', guard(async () => {
      if (state.exporting || state.storing) return;
      if (!ready()) throw new Error('충돌을 해결하고 다시 병합한 뒤 저장해 줘.');
      const text = currentOutput(), mode = state.mode;
      const current = active().current, release = clone(current.release), releaseId = current.releaseId;
      const releaseLabel = mode === 'preset' ? $('release-label').value.trim() || current.releaseLabel : current.releaseLabel;
      const preset = mode === 'preset' ? C.parsePreset(text) : release ? { ...clone(release), customPromptTemplateToggle: text, name: (release.name || '프리셋') + ' · 커스텀 토글' } : null;
      const name = preset ? String(preset.name || 'risu').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_') + '_preset.risup' : 'risu_toggles.txt';
      state.exporting = true; renderSave();
      try {
        const bytes = preset ? await C.exportPresetFile(preset) : text;
        download(name, bytes, preset ? 'application/octet-stream' : 'text/plain;charset=utf-8');
        try {
          const record = await archiveRelease(release, releaseId, releaseLabel, { personalPreset: preset,
            toggleBaseline: mode === 'preset' ? release.customPromptTemplateToggle || '' : current.toggleSource,
            personalToggles: mode === 'preset' ? preset.customPromptTemplateToggle || '' : text });
          current.savedRecord = state.mode === mode && active().current === current && !active().stale && currentOutput() === text ? clone(record) : null; current.releaseId = record.id;
          if (mode === 'toggle') state.nextToggleBaseline = clone(record); else state.nextBaseline = clone(record);
          notify('파일을 저장하고 기준 원본을 새 원본으로 교체했어. 내 커스텀 완성본도 보관했어.', 'ok');
        } catch (e) { notify('파일은 만들었지만 기준 원본 교체에 실패했어: ' + e.message + ' 보관함에서 새로고침해서 저장소를 확인해 줘.', 'error'); }
      } finally { state.exporting = false; render(); }
    }));
    $('copy-output').addEventListener('click', guard(async () => {
      if (!ready() || state.mode === 'preset') return;
      const text = currentOutput();
      try { await navigator.clipboard.writeText(text); }
      catch (_) {
        $('output').focus(); $('output').select();
        if (!document.execCommand('copy')) throw new Error('자동 복사가 막혀 있어. 선택된 텍스트를 Ctrl+C로 복사해 줘.');
      }
      notify('토글 텍스트를 복사했어.', 'ok');
    }));
    $('next-update').addEventListener('click', guard(() => {
      if (!ready() || state.mode !== 'preset' || state.exporting) return;
      const result = currentOutput(), record = active().current.savedRecord;
      if (!record) throw new Error('완성본을 먼저 저장해 줘. 기준 원본 교체는 저장할 때만 처리해.');
      state.baseline = clone(record); state.nextBaseline = null; $('preset-base').value = '';
      $('preset-local').value = result; $('preset-latest').value = ''; $('preset-name').value = '';
      delete state.filePresets['preset-local']; delete state.filePresets['preset-latest'];
      setSlotStatus('preset-local', '직전에 저장한 완성본'); setSlotStatus('preset-latest', ''); setSlotStatus('preset-base', '');
      updateFavoriteSelect('preset'); refreshReleases();
      state.work.preset = fresh(); state.step.preset = 'files'; render();
      notify('직전 완성본을 내 커스텀본으로, 방금 쓴 새 원본을 비교 기준으로 설정했어. 다음 업데이트 파일만 불러오면 돼!', 'ok');
    }));

    // ---- Whole-screen render ---------------------------------------------------------------
    function render() {
      inputIds.concat('library-source').forEach(refreshSlot);
      const mode = state.mode;
      if (!stepEnabled(state.step[mode])) state.step[mode] = 'files';
      const cur = state.step[mode];
      renderChrome();
      ['files', 'conflicts', 'prompts', 'toggles', 'save'].forEach(s => { $('step-' + s).hidden = s !== cur; });
      ({ files: renderFiles, conflicts: renderConflicts, prompts: renderPromptViewer, toggles: renderToggles, save: renderSave })[cur]();
      renderStepNav();
    }

    // ---- Work files (save / restore) -------------------------------------------------------
    const storageKey = 'preset-editor:project:v1';
    function project() {
      const inputs = {}, options = {}, work = {};
      inputIds.forEach(id => {
        let text = $(id).value;
        if (id.startsWith('preset') && text.trim()) text = JSON.stringify(C.sanitizePreset(C.parsePreset(text)), null, 2);
        inputs[id] = text;
      });
      optionIds.forEach(id => { options[id] = $(id).type === 'checkbox' ? $(id).checked : $(id).value; });
      Object.entries(state.work).forEach(([mode, w]) => { work[mode] = { choices: clone(w.choices),
        processed: !!w.current && !w.stale, draft: w.current && !w.stale ? C.serializeToggles(w.groups) : null,
        favoriteIndex: w.groups.findIndex(g => g.uid === w.favoriteUid), manual: w.manual, savedRecord: clone(w.current?.savedRecord || null),
        promptDraft: mode === 'preset' && w.promptDraft && !w.stale ? C.sanitizePreset(w.promptDraft) : null }; });
      return { type: 'preset-editor-project', version: 2, mode: state.mode, inputs, options, work, baseline: clone(state.baseline), toggleBaseline: clone(state.toggleBaseline), toggleBaseManaged: state.toggleBaseManaged === true,
        filePresets: clone(Object.fromEntries(inputIds.filter(id => own(state.filePresets, id)).map(id => [id, state.filePresets[id]]))) };
    }
    async function restore(data) {
      if (!object(data) || data.type !== 'preset-editor-project' || ![1, 2].includes(data.version) || !object(data.inputs) || !object(data.options)) throw new Error('에디터에서 저장한 작업 파일이 필요해.');
      // v1 files had a separate favorites-builder tab. It is now the toggle editor with an empty "my toggles" slot.
      const inputs = { ...data.inputs };
      if (data.mode === 'builder' && typeof inputs['builder-source'] === 'string' && !String(inputs['toggle-latest'] || '').trim()) inputs['toggle-latest'] = inputs['builder-source'];
      if (inputIds.some(id => typeof inputs[id] !== 'string')) throw new Error('작업 파일의 입력 데이터가 올바르지 않아.');
      if (data.baseline != null) C.validateReleases({ type: 'risu-preset-release-archive', version: 1, entries: [data.baseline] });
      if (data.toggleBaseline != null) C.validateReleases({ type: 'risu-preset-release-archive', version: 1, entries: [data.toggleBaseline] });
      const restoredPrompt = data.work?.preset?.promptDraft == null ? null : C.sanitizePreset(C.parsePreset(JSON.stringify(data.work.preset.promptDraft)));
      const restoredPresets = {};
      if (object(data.filePresets)) for (const id of inputIds) if (data.filePresets[id] != null) {
        const preset = C.sanitizePreset(C.parsePreset(JSON.stringify(data.filePresets[id])));
        if (!id.startsWith('toggle') || (preset.customPromptTemplateToggle || '') === inputs[id]) restoredPresets[id] = preset;
      }
      if ((active().manual || inputIds.some(id => $(id).value.trim())) && !(await ask('작업을 바꿀까?', '지금 입력과 결과를 저장한 작업으로 바꿔.', '바꾸기', true))) return;
      inputIds.forEach(id => { $(id).value = inputs[id]; setSlotStatus(id, ''); });
      // Old v1 projects had a required explicit baseline. New projects pin their own saved basis.
      state.baseline = data.baseline ? clone(data.baseline) : null; state.nextBaseline = null;
      state.toggleBaseline = clone(data.toggleBaseline || null); state.nextToggleBaseline = null; state.filePresets = restoredPresets;
      state.toggleBaseManaged = data.toggleBaseManaged === true;
      $('preset-options').open = !!$('preset-base').value.trim(); refreshReleases();
      updateFavoriteSelect('preset', data.options['preset-fav']); updateFavoriteSelect('toggle', data.options['toggle-fav']);
      optionIds.forEach(id => { if (id.endsWith('-fav')) return; if ($(id).type === 'checkbox') $(id).checked = data.options[id] === true; else $(id).value = typeof data.options[id] === 'string' ? data.options[id] : ''; });
      const desired = data.mode === 'builder' ? 'toggle' : ['preset', 'toggle'].includes(data.mode) ? data.mode : 'preset';
      ['preset', 'toggle'].forEach(mode => {
        state.work[mode] = fresh(); state.mode = mode; state.step[mode] = 'files';
        const saved = data.work?.[mode];
        if (saved && object(saved.choices)) state.work[mode].choices = saved.choices;
        if (saved?.processed && !(data.mode === 'builder' && mode === 'toggle')) {
          run(); const w = state.work[mode];
          if (mode === 'preset' && restoredPrompt && !unresolved()) w.promptDraft = clone(restoredPrompt);
          if (saved.savedRecord) { C.validateReleases({ type: 'risu-preset-release-archive', version: 1, entries: [saved.savedRecord] }); w.current.savedRecord = clone(saved.savedRecord); }
          if (!unresolved() && typeof saved.draft === 'string') {
            w.groups = C.parseToggles(saved.draft); w.favoriteUid = w.groups[saved.favoriteIndex]?.uid || ''; w.manual = saved.manual === true;
            w.groups.forEach(g => g.items.forEach(it => { if (it.type === 'item') w.catalog.set(it.key, clone(it)); }));
          }
          state.step[mode] = unresolved() ? 'conflicts' : mode === 'preset' ? 'prompts' : 'toggles';
        }
      });
      switchMode(desired); notify('저장한 작업을 불러왔어. 입력과 결과 배치가 복원됐어.', 'ok');
    }
    $('save-project').addEventListener('click', guard(async () => {
      const data = JSON.stringify(project());
      if (api) await api.pluginStorage.setItem(storageKey, data); else localStorage.setItem(storageKey, data);
      notify('작업을 앱에 저장했어. 입력 · 충돌 선택 · 수정한 배치가 함께 들어가.', 'ok');
    }));
    $('restore-project').addEventListener('click', guard(async () => {
      const data = api ? await api.pluginStorage.getItem(storageKey) : localStorage.getItem(storageKey);
      if (!data) throw new Error('앱에 저장한 작업이 없어. 작업 파일을 열어도 돼.');
      await restore(C.parseJSON(data));
    }));
    $('export-project').addEventListener('click', guard(() => { download('risu_migration_project.json', JSON.stringify(project(), null, 2), 'application/json;charset=utf-8'); notify('작업 파일을 내보냈어.', 'ok'); }));
    $('import-project').addEventListener('click', () => $('project-file').click());
    $('project-file').addEventListener('change', guard(async () => {
      const f = $('project-file').files[0]; if (!f) return; if (f.size > 10 * 1024 * 1024) throw new Error('작업 파일은 10MB 이하로 불러와 줘.');
      try { await restore(C.parseJSON(await f.text())); } finally { $('project-file').value = ''; }
    }));

    // ---- Library (archive of baselines) ----------------------------------------------------
    const releaseStorageKey = 'preset-editor:releases:v1', ARCHIVE_LIMIT = 32;
    const emptyArchive = () => ({ type: 'risu-preset-release-archive', version: 1, activeId: '', entries: [] });
    const readStorage = key => api ? api.pluginStorage.getItem(key) : Promise.resolve(localStorage.getItem(key));
    const writeStorage = (key, value) => api ? api.pluginStorage.setItem(key, value) : Promise.resolve(localStorage.setItem(key, value));
    const releaseName = entry => entry?.preset?.name || entry?.pendingPreset?.name || entry?.personalPreset?.name || entry?.label || '토글 전용';
    const newId = () => globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
    function fillReleaseSelect(id, entries, selected, emptyLabel) {
      const select = $(id); select.replaceChildren();
      const first = el('option', emptyLabel); first.value = ''; select.appendChild(first);
      entries.forEach(entry => { const option = el('option', entry.label + ' · ' + releaseName(entry)); option.value = entry.id; select.appendChild(option); });
      select.value = selected || '';
    }
    function refreshReleases() {
      const entries = state.archive.entries.slice();
      if (state.baseline && !entries.some(entry => entry.id === state.baseline.id)) entries.push(state.baseline);
      if (state.toggleBaseline && !entries.some(entry => entry.id === state.toggleBaseline.id)) entries.push(state.toggleBaseline);
      fillReleaseSelect('release-select', entries, state.baseline?.id, '보관본 없음 · 첫 편집 / 새 프리셋');
      fillReleaseSelect('toggle-release-select', entries, state.toggleBaseline?.id, '보관본 없음 · 파일 / 텍스트 사용');
      fillReleaseSelect('library-select', state.archive.entries, $('library-select').value, '새 보관 항목 만들기');
      if (!state.archiveLoaded) $('release-status').textContent = '보관한 원본을 불러오는 중이야…';
      else if (!state.archiveAvailable) $('release-status').textContent = '보관 저장소를 읽지 못했어. 첫 편집이나 옛 원본 직접 불러오기는 가능하지만, 자동 보관은 저장소를 확인한 뒤에 쓸 수 있어.';
      else if ($('preset-base').value.trim()) $('release-status').textContent = '이번 비교는 직접 불러온 옛 원본을 써. 비워 두면 선택한 보관본으로 비교해.';
      else if (state.baseline?.preset) $('release-status').textContent = '이번 비교 기준: ' + releaseName(state.baseline) + ' · ' + new Date(state.baseline.savedAt).toLocaleString() + (state.nextBaseline ? ' / 다음 비교용 새 원본도 보관했어.' : '');
      else $('release-status').textContent = state.nextBaseline ? '첫 편집의 새 원본을 보관했어: ' + state.nextBaseline.label + '. 다음 원본을 불러오거나 “다음 업데이트 준비”를 누르면 자동으로 비교해.' : '첫 사용이야. 차이가 있는 구문 · 블록을 직접 골라야 해. 저장하면 새 원본이 자동 보관돼.';
      $('toggle-release-status').textContent = state.toggleBaseline ? '선택한 보관 항목: ' + state.toggleBaseline.label + '. “보관한 토글 불러오기”를 누르면 기준 · 내 커스텀본 · 대기 중인 새 원본을 가져와.' : '보관함에 저장한 항목을 고를 수 있어. 파일이나 토글 텍스트를 바로 불러와도 돼.';
      renderPromptBaseline(); renderLibrary();
    }
    function prepareStoredBaseline(id) {
      if (id === 'preset-latest' && state.nextBaseline && !$('preset-base').value.trim()) {
        try {
          const latest = C.sanitizePreset(C.parsePreset($('preset-latest').value));
          if (!C.same(latest, state.nextBaseline.preset)) {
            state.baseline = clone(state.nextBaseline); state.nextBaseline = null; $('preset-base').value = '';
            $('release-label').value = state.baseline.label;
          }
        } catch (_) { /* Wait for a complete valid new input. */ }
      }
      if (id.startsWith('preset')) refreshReleases();
      if (id === 'toggle-base') state.toggleBaseManaged = false;
      if (id === 'toggle-latest' && state.nextToggleBaseline && state.toggleBaseManaged) {
        if ($('toggle-latest').value !== state.nextToggleBaseline.toggleBaseline) {
          state.toggleBaseline = clone(state.nextToggleBaseline); state.nextToggleBaseline = null;
          $('toggle-base').value = state.toggleBaseline.toggleBaseline ?? state.toggleBaseline.preset?.customPromptTemplateToggle ?? '';
        }
      }
      if (id.startsWith('toggle')) refreshReleases();
    }
    async function loadReleases() {
      const raw = await readStorage(releaseStorageKey);
      const archive = raw ? C.validateReleases(C.parseJSON(raw)) : emptyArchive();
      state.archive = archive; state.archiveAvailable = true;
      state.baseline = clone(archive.entries.find(entry => entry.id === archive.activeId) || null); state.nextBaseline = null;
      state.toggleBaseline = clone(state.baseline); state.nextToggleBaseline = null;
      fillReleaseSelect('library-select', archive.entries, archive.activeId, '새 보관 항목 만들기');
      $('library-label').value = state.baseline?.label || '';
      $('release-label').value = state.baseline?.label || '';
    }
    // Always re-read storage first so another open plugin instance's presets are preserved.
    async function mutateArchive(mutator) {
      if (!state.archiveAvailable) throw new Error('보관 저장소를 먼저 정상적으로 불러와야 해.');
      const raw = await readStorage(releaseStorageKey);
      const archive = raw ? C.validateReleases(C.parseJSON(raw)) : emptyArchive();
      const result = mutator(archive);
      const serialized = JSON.stringify(archive); C.validateReleases(C.parseJSON(serialized));
      await writeStorage(releaseStorageKey, serialized); state.archive = archive;
      return result;
    }
    const checkLimit = (archive, id) => { if (!archive.entries.some(entry => entry.id === id) && archive.entries.length >= ARCHIVE_LIMIT) throw new Error('보관함은 최대 ' + ARCHIVE_LIMIT + '개까지야. 안 쓰는 항목을 삭제해 줘.'); };
    async function archiveRelease(preset, id, label, completed = {}) {
      if (!id && state.nextBaseline && C.same(preset, state.nextBaseline.preset)) id = state.nextBaseline.id;
      const record = await mutateArchive(archive => {
        const previous = archive.entries.find(entry => entry.id === id);
        const rec = { ...clone(previous || {}), id: id || newId(), label: String(label || preset?.name || '프리셋').slice(0, 200),
          preset: preset ? C.sanitizePreset(C.parsePreset(JSON.stringify(preset))) : clone(previous?.preset || null), savedAt: new Date().toISOString() };
        checkLimit(archive, rec.id);
        rec.toggleBaseline = completed.toggleBaseline ?? preset?.customPromptTemplateToggle ?? '';
        rec.personalToggles = completed.personalToggles ?? '';
        if (completed.personalPreset) rec.personalPreset = C.sanitizePreset(C.parsePreset(JSON.stringify(completed.personalPreset)));
        else if (rec.personalPreset) rec.personalPreset.customPromptTemplateToggle = rec.personalToggles;
        if (rec.pendingPreset && preset && C.same(C.sanitizePreset(rec.pendingPreset), C.sanitizePreset(preset))) delete rec.pendingPreset;
        const index = archive.entries.findIndex(entry => entry.id === rec.id);
        if (index < 0) archive.entries.push(rec); else archive.entries[index] = rec;
        archive.activeId = rec.id; return rec;
      });
      refreshReleases(); return record;
    }
    function storedEntry(id) {
      const entry = state.archive.entries.find(entry => entry.id === id);
      if (!entry) throw new Error('보관함에서 항목을 먼저 선택해 줘.');
      return clone(entry);
    }
    function loadStoredPresets(id) {
      const entry = storedEntry(id); state.baseline = clone(entry); state.nextBaseline = null;
      $('preset-base').value = ''; $('release-label').value = entry.label;
      $('preset-local').value = entry.personalPreset ? JSON.stringify(entry.personalPreset, null, 2) : '';
      const latest = entry.pendingPreset || entry.preset;
      $('preset-latest').value = latest ? JSON.stringify(latest, null, 2) : '';
      delete state.filePresets['preset-local']; delete state.filePresets['preset-latest'];
      setSlotStatus('preset-local', entry.personalPreset ? '보관함에서 불러옴' : ''); setSlotStatus('preset-latest', latest ? '보관함에서 불러옴' : ''); setSlotStatus('preset-base', '');
      updateFavoriteSelect('preset'); refreshReleases(); invalidate('preset');
      notify('보관한 커스텀본과 새 원본을 불러왔어.' + (!entry.personalPreset ? ' 내 커스텀본 파일도 불러와 줘.' : '') + (!entry.pendingPreset ? ' 업데이트가 있다면 새 원본 파일을 불러와 줘.' : ''), 'ok');
    }
    function loadStoredToggles(id) {
      const entry = storedEntry(id); state.toggleBaseline = clone(entry); state.nextToggleBaseline = null;
      const fullLatest = entry.pendingPreset || (entry.preset && (!own(entry, 'toggleBaseline') || (entry.preset.customPromptTemplateToggle || '') === entry.toggleBaseline) ? entry.preset : null);
      const presets = { base: entry.preset, local: entry.personalPreset, latest: fullLatest };
      const texts = { base: entry.toggleBaseline ?? entry.preset?.customPromptTemplateToggle ?? '',
        local: entry.personalToggles ?? entry.personalPreset?.customPromptTemplateToggle ?? entry.preset?.customPromptTemplateToggle ?? '',
        latest: fullLatest?.customPromptTemplateToggle ?? entry.toggleBaseline ?? '' };
      for (const key of ['base', 'local', 'latest']) {
        const input = 'toggle-' + key; $(input).value = texts[key]; setSlotStatus(input, '보관함에서 불러옴');
        if (presets[key] && (presets[key].customPromptTemplateToggle || '') === texts[key]) state.filePresets[input] = clone(presets[key]); else delete state.filePresets[input];
      }
      state.toggleBaseManaged = true;
      updateFavoriteSelect('toggle'); refreshReleases(); invalidate('toggle'); notify('보관한 기준 토글 · 내 즐겨찾기 · 새 원본 토글을 불러왔어. 배치를 확인하고 병합해 줘.', 'ok');
    }
    function renderLibrary() {
      const entries = state.archive.entries;
      $('library-count').hidden = !entries.length; $('library-count').textContent = String(entries.length);
      $('store-library').disabled = !state.archiveAvailable || state.storing || state.exporting;
      $('library-status').textContent = !state.archiveAvailable ? '보관 저장소를 읽지 못했어. 새로고침으로 다시 확인해 줘.' : state.storing ? '프리셋 파일을 보관하는 중이야…' : '보관 항목 ' + entries.length + ' / ' + ARCHIVE_LIMIT + '개';
      const list = $('library-list'); list.replaceChildren();
      if (!entries.length) list.appendChild(el('p', '아직 보관한 프리셋이 없어. 완성본을 저장하면 자동으로 쌓여.', 'empty'));
      entries.forEach(entry => {
        const current = state.baseline?.id === entry.id, card = el('article', null, 'entry' + (current ? ' current' : ''));
        const head = el('div', null, 'row spread'), title = el('div', null, 'grow'); title.append(el('h3', entry.label), el('p', releaseName(entry), 'hint'));
        head.append(title); if (current) head.append(el('span', '사용 중', 'badge custom')); card.append(head);
        const facts = el('ul', null, 'facts');
        [['기준 원본', entry.preset ? releaseName(entry) : own(entry, 'toggleBaseline') ? '토글 텍스트' : '없음'], ['내 커스텀본', entry.personalPreset || own(entry, 'personalToggles') ? '있음' : '없음'], ['새 원본 대기', entry.pendingPreset ? entry.pendingPreset.name || '이름 없음' : '없음']]
          .forEach(([k, v]) => facts.append(el('li', k + ': ' + v, 'badge')));
        const actions = el('div', null, 'row');
        actions.append(
          button('프리셋 업데이트에 쓰기', guard(() => { loadStoredPresets(entry.id); state.step.preset = 'files'; switchMode('preset'); closeLibrary(); }), 'btn sm primary'),
          button('토글 편집에 쓰기', guard(() => { loadStoredToggles(entry.id); state.step.toggle = 'files'; switchMode('toggle'); closeLibrary(); }), 'btn sm'),
          button('이름 변경', guard(() => renameEntry(entry)), 'btn sm ghost'), button('삭제', guard(() => deleteEntry(entry)), 'btn sm ghost danger'));
        card.append(facts, actions); list.appendChild(card);
      });
    }
    async function renameEntry(entry) {
      const input = await outsideLibrary(() => askText('보관 이름 바꾸기', '보관 이름', entry.label)); const name = input == null ? '' : String(input).trim().slice(0, 200); if (!name) return;
      await mutateArchive(archive => { const target = archive.entries.find(e => e.id === entry.id); if (!target) throw new Error('보관 항목을 찾지 못했어. 새로고침해 줘.'); target.label = name; });
      if (state.baseline?.id === entry.id) { state.baseline.label = name; $('release-label').value = name; }
      if (state.toggleBaseline?.id === entry.id) state.toggleBaseline.label = name;
      refreshReleases(); notify('이름을 바꿨어.', 'ok');
    }
    async function deleteEntry(entry) {
      if (!(await outsideLibrary(() => ask('보관 항목을 삭제할까?', '“' + entry.label + '”의 기준 원본 · 커스텀본 · 대기 중인 새 원본이 모두 지워져. 되돌릴 수 없어.', '삭제', true)))) return;
      await mutateArchive(archive => { archive.entries = archive.entries.filter(e => e.id !== entry.id); if (archive.activeId === entry.id) archive.activeId = ''; });
      if (state.baseline?.id === entry.id) { state.baseline = null; state.nextBaseline = null; $('release-label').value = ''; invalidate('preset'); }
      if (state.toggleBaseline?.id === entry.id) { state.toggleBaseline = null; state.nextToggleBaseline = null; invalidate('toggle'); }
      refreshReleases(); notify('보관 항목을 삭제했어.', 'ok');
    }
    const openLibrary = () => { const d = $('library'); if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else d.setAttribute('open', ''); $('library-note').hidden = true; renderLibrary(); };
    const closeLibrary = () => { const d = $('library'); if (d.open) { if (typeof d.close === 'function') d.close(); else d.removeAttribute('open'); } };
    $('open-library').addEventListener('click', openLibrary);
    $('library-close').addEventListener('click', closeLibrary);
    $('library').addEventListener('click', e => { if (e.target === $('library')) closeLibrary(); });
    $('load-stored-presets').addEventListener('click', guard(() => loadStoredPresets($('release-select').value)));
    $('load-stored-toggles').addEventListener('click', guard(() => loadStoredToggles($('toggle-release-select').value)));
    $('release-select').addEventListener('change', () => {
      state.baseline = clone(state.archive.entries.find(entry => entry.id === $('release-select').value) || null); state.nextBaseline = null;
      $('preset-base').value = ''; $('release-label').value = state.baseline?.label || ''; refreshReleases(); invalidate('preset');
    });
    $('toggle-release-select').addEventListener('change', () => {
      state.toggleBaseline = clone(state.archive.entries.find(entry => entry.id === $('toggle-release-select').value) || null); state.nextToggleBaseline = null;
      $('toggle-base').value = ''; state.toggleBaseManaged = true; refreshReleases(); invalidate('toggle');
    });
    $('library-select').addEventListener('change', () => { $('library-label').value = state.archive.entries.find(entry => entry.id === $('library-select').value)?.label || ''; });
    $('reload-releases').addEventListener('click', guard(async () => { await loadReleases(); refreshReleases(); invalidate('preset'); invalidate('toggle'); notify('보관한 원본을 다시 불러왔어. 비교할 프리셋 종류가 맞는지 확인해 줘.', 'ok'); }));
    $('store-library').addEventListener('click', guard(async () => {
      if (state.storing || state.exporting) return;
      if (!state.archiveAvailable) throw new Error('보관 저장소를 먼저 정상적으로 불러와야 해.');
      const preset = C.sanitizePreset(C.parsePreset($('library-source').value));
      const selected = $('library-select').value, role = $('library-role').value, label = $('library-label').value.trim();
      state.storing = true; renderLibrary();
      try {
        const record = await mutateArchive(archive => {
          const previous = archive.entries.find(entry => entry.id === selected);
          if (selected && !previous) throw new Error('선택한 보관 항목이 없어. 새로고침해 줘.');
          const rec = { ...clone(previous || {}), id: selected || newId(), label: (label || previous?.label || preset.name || '프리셋').slice(0, 200), savedAt: new Date().toISOString() };
          checkLimit(archive, rec.id);
          if (role === 'base') {
            if (rec.preset) throw new Error('이미 기준 원본이 있어. 파일 종류를 “새 원본”으로 골라 보관해 줘. 기준 교체는 완성본을 저장할 때 처리돼.');
            rec.preset = preset; if (!own(rec, 'toggleBaseline')) rec.toggleBaseline = preset.customPromptTemplateToggle || '';
          } else if (role === 'personal') { rec.personalPreset = preset; rec.personalToggles = preset.customPromptTemplateToggle || ''; }
          else if (role === 'latest') rec.pendingPreset = preset;
          else throw new Error('보관할 파일 종류를 골라 줘.');
          const index = archive.entries.findIndex(entry => entry.id === rec.id);
          if (index < 0) archive.entries.push(rec); else archive.entries[index] = rec;
          archive.activeId = rec.id; return rec;
        });
        fillReleaseSelect('library-select', state.archive.entries, record.id, '새 보관 항목 만들기'); refreshReleases();
        notify(role === 'latest' ? '새 원본을 대기 상태로 보관했어. 기준 원본은 완성본을 저장할 때 교체돼.' : '프리셋 파일을 보관했어. 위 목록에서 바로 이어서 작업할 수 있어.', 'ok');
      } finally { state.storing = false; renderLibrary(); }
    }));

    // ---- Start ------------------------------------------------------------------------------
    render();
    if (api) {
      $('close').hidden = false; $('close').addEventListener('click', guard(() => api.hideContainer()));
      const setting = await api.registerSetting('프리셋 에디터', async () => { await api.showContainer('fullscreen'); }, '🖊️', 'html');
      await api.onUnload(async () => { if (setting?.id) await api.unregisterUIPart(setting.id); });
    }
    try { await loadReleases(); }
    catch (e) { state.archiveAvailable = false; notify('보관한 원본을 읽지 못했어: ' + e.message, 'error'); }
    state.archiveLoaded = true; refreshReleases(); render();
  }
})();
