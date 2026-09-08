export const VIDEO_TEMPLATES = [
 { id:"viral-product", name:"Viral Product", description:"Fast hook, punchy captions, quick cuts", duration:[20,35] },
 { id:"problem-solution", name:"Problem → Solution", description:"Pain point followed by product demonstration", duration:[25,45] },
 { id:"three-reasons", name:"3 Reasons", description:"Three concrete reasons to consider the product", duration:[25,40] },
 { id:"honest-review", name:"Honest Review", description:"Balanced review with pros and cons", duration:[35,60] },
 { id:"top-list", name:"Top List", description:"Rank multiple products or variants", duration:[30,60] },
 { id:"story", name:"Mini Story", description:"Story-first product recommendation", duration:[30,50] },
] as const;
export type VideoTemplate = typeof VIDEO_TEMPLATES[number];
