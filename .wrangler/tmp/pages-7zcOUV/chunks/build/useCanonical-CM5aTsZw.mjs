import{v as t,u as a,m as n}from"../virtual/entry.mjs";function useCanonical(r){const e=n(),s=String(e.public.siteUrl).replace(/\/+$/,""),i=t.computed(()=>{const a=t.toValue(r),n=a.startsWith("/")?a:`/${a}`;return`${s}${n}`});a({link:[{rel:"canonical",href:i}]})}export{useCanonical as u};
//# sourceMappingURL=useCanonical-CM5aTsZw.mjs.map
