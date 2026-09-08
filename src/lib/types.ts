export type Product = { id: string; name: string; url?: string; description: string; price?: string; imageUrl?: string; features: string[]; createdAt: string };
export type ContentVariant = { id: string; productId: string; angle: string; hook: string; script: string; cta: string; caption: string; hashtags: string[]; duration: number };
export type GenerationRequest = { product: Product; variants: number; tone: "viral" | "review" | "educational" | "story" };
