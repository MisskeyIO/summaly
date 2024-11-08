import{URL}from"node:url";import*as cheerio from"cheerio";import{decode as decodeHtml}from"html-entities";import cleanupTitle from"./utils/cleanup-title.js";import clip from"./utils/clip.js";import{get,head,scpaping}from"./utils/got.js";async function getOEmbedPlayer($,pageUrl){const href=$('link[type="application/json+oembed"]').attr("href");if(!href){return null}const oEmbedUrl=(()=>{try{return new URL(href,pageUrl)}catch{return null}})();if(!oEmbedUrl){return null}const oEmbed=await get(oEmbedUrl.href).catch(()=>null);if(!oEmbed){return null}const body=(()=>{try{return JSON.parse(oEmbed)}catch{}})();if(!body||body.version!=="1.0"||!["rich","video"].includes(body.type)){return null}if(!body.html.startsWith("<iframe ")||!body.html.endsWith("</iframe>")){return null}const oEmbedHtml=cheerio.load(body.html);const iframe=oEmbedHtml("iframe");if(iframe.length!==1){return null}if(iframe.parents().length!==2){return null}const url=iframe.attr("src");if(!url){return null}try{if(new URL(url).protocol!=="https:"){return null}}catch(e){return null}let width=Number(iframe.attr("width")??body.width);if(Number.isNaN(width)){width=null}const height=Math.min(Number(iframe.attr("height")??body.height),1024);if(Number.isNaN(height)){return null}const safeList=["autoplay","clipboard-write","fullscreen","encrypted-media","picture-in-picture","web-share"];const ignoredList=["gyroscope","accelerometer"];const allowedPermissions=(iframe.attr("allow")??"").split(/\s*;\s*/g).filter(s=>s).filter(s=>!ignoredList.includes(s));if(iframe.attr("allowfullscreen")===""){allowedPermissions.push("fullscreen")}if(allowedPermissions.some(allow=>!safeList.includes(allow))){return null}return{url,width,height,allow:allowedPermissions}}export default(async(_url,opts)=>{let lang=opts?.lang;if(lang&&!RegExp(/^[\w-]+(\s*,\s*[\w-]+)*$/).exec(lang))lang=null;const url=typeof _url==="string"?new URL(_url):_url;const res=await scpaping(url.href,{lang:lang||undefined,userAgent:opts?.userAgent,responseTimeout:opts?.responseTimeout,operationTimeout:opts?.operationTimeout,contentLengthLimit:opts?.contentLengthLimit,contentLengthRequired:opts?.contentLengthRequired});const $=res.$;const twitterCard=$('meta[name="twitter:card"]').attr("content")||$('meta[property="twitter:card"]').attr("content");let title=$('meta[property="og:title"]').attr("content")||$('meta[name="twitter:title"]').attr("content")||$('meta[property="twitter:title"]').attr("content")||$("title").text();if(title===undefined||title===null){return null}title=clip(decodeHtml(title),100);let image=$('meta[property="og:image"]').attr("content")||$('meta[name="twitter:image"]').attr("content")||$('meta[property="twitter:image"]').attr("content")||$('link[rel="image_src"]').attr("href")||$('link[rel="apple-touch-icon"]').attr("href")||$('link[rel="apple-touch-icon image_src"]').attr("href");image=image?new URL(image,url.href).href:null;const playerUrl=twitterCard!=="summary_large_image"&&$('meta[name="twitter:player"]').attr("content")||twitterCard!=="summary_large_image"&&$('meta[property="twitter:player"]').attr("content")||$('meta[property="og:video"]').attr("content")||$('meta[property="og:video:secure_url"]').attr("content")||$('meta[property="og:video:url"]').attr("content");const playerWidth=Number.parseInt($('meta[name="twitter:player:width"]').attr("content")||$('meta[property="twitter:player:width"]').attr("content")||$('meta[property="og:video:width"]').attr("content")||"");const playerHeight=Number.parseInt($('meta[name="twitter:player:height"]').attr("content")||$('meta[property="twitter:player:height"]').attr("content")||$('meta[property="og:video:height"]').attr("content")||"");let description=$('meta[property="og:description"]').attr("content")||$('meta[name="twitter:description"]').attr("content")||$('meta[property="twitter:description"]').attr("content")||$('meta[name="description"]').attr("content");description=description?clip(decodeHtml(description),300):null;if(title===description){description=null}const siteName=decodeHtml($('meta[property="og:site_name"]').attr("content")||$('meta[name="application-name"]').attr("content")||url.host);const favicon=$('link[rel="shortcut icon"]').attr("href")||$('link[rel="icon"]').attr("href")||"/favicon.ico";const activityPub=$('link[rel="alternate"][type="application/activity+json"]').attr("href")||null;const sensitive=$("meta[property='mixi:content-rating']").attr("content")==="1";const find=async path=>{const target=new URL(path,url.href);try{await head(target.href);return target}catch(e){return null}};const getIcon=async()=>{return await find(favicon)||null};const[icon,oEmbed]=await Promise.all([getIcon(),getOEmbedPlayer($,url.href)]);title=cleanupTitle(title,siteName);if(title===""){title=siteName}return{title:title||null,icon:icon?.href||null,description:description||null,thumbnail:image||null,player:oEmbed??{url:playerUrl||null,width:Number.isNaN(playerWidth)?null:playerWidth,height:Number.isNaN(playerHeight)?null:playerHeight,allow:["autoplay","encrypted-media","fullscreen"]},sitename:siteName||null,sensitive,activityPub}});