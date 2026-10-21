import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// エラーメッセージを日本語にする（CI のログで読めるように）
z.config(z.locales.ja());

// CMS（public/admin/config.yml）で入力された値をここで検証する。
// 文字数の上限などを超えるとビルドが失敗するので、デザインが崩れたまま公開されることはない。

const news = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/news" }),
  schema: z.object({
    title: z.string().max(60),
    date: z.coerce.date(),
    summary: z.string().max(140).optional(),
    cover: z.string().optional(),
    coverAlt: z.string().max(100).optional(),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string().max(40),
    category: z.enum(["設計下流", "問題解決", "イノベーション"]),
    stage: z.enum(["企画", "小プレゼン", "設計", "大プレゼン", "完了"]),
    summary: z.string().max(140),
    methods: z.array(z.string()).default([]),
    cover: z.string().optional(),
    coverAlt: z.string().max(100).optional(),
    order: z.number().default(10),
    draft: z.boolean().default(false),
  }),
});

const tone = z.enum(["light", "dark"]).default("light");

const section = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hero"),
    eyebrow: z.string().max(60).optional(),
    title: z.string().max(30),
    lead: z.string().max(160),
    ctaLabel: z.string().max(20).optional(),
    ctaHref: z.string().optional(),
  }),
  z.object({
    type: z.literal("statement"),
    tone,
    eyebrow: z.string().max(60).optional(),
    title: z.string().max(40),
    body: z.string().max(400),
    left: z.object({ label: z.string().max(20), items: z.array(z.string().max(20)).max(5) }),
    right: z.object({ label: z.string().max(20), items: z.array(z.string().max(20)).max(5) }),
  }),
  z
    .object({
      type: z.literal("flow"),
      tone,
      eyebrow: z.string().max(60).optional(),
      title: z.string().max(40),
      body: z.string().max(300).optional(),
      steps: z.array(z.string().max(10)).min(2).max(6),
      focusCount: z.number().int().min(1).max(6),
      focusLabel: z.string().max(20),
    })
    .refine((s) => s.focusCount <= s.steps.length, {
      message: "「先頭から何個を強調するか」が工程の数より多くなっています",
      path: ["focusCount"],
    }),
  z.object({
    type: z.literal("steps"),
    tone,
    eyebrow: z.string().max(60).optional(),
    title: z.string().max(40),
    items: z
      .array(
        z.object({
          label: z.string().max(12),
          title: z.string().max(20),
          body: z.string().max(140),
          role: z.enum(["proposer", "partner", "investor", "none"]).default("none"),
        }),
      )
      .min(1)
      .max(6),
  }),
  z.object({
    type: z.literal("tags"),
    tone,
    eyebrow: z.string().max(60).optional(),
    title: z.string().max(40),
    body: z.string().max(200).optional(),
    tags: z.array(z.string().max(12)).max(20),
  }),
  z.object({
    type: z.literal("cards"),
    tone,
    eyebrow: z.string().max(60).optional(),
    title: z.string().max(40),
    items: z
      .array(z.object({ title: z.string().max(20), body: z.string().max(160), note: z.string().max(60).optional() }))
      .min(1)
      .max(6),
  }),
  z.object({
    type: z.literal("info"),
    tone,
    eyebrow: z.string().max(60).optional(),
    title: z.string().max(40),
    items: z
      .array(z.object({ label: z.string().max(12), value: z.string().max(60) }))
      .min(1)
      .max(10),
  }),
  z.object({
    type: z.literal("news"),
    tone,
    title: z.string().max(40),
    limit: z.number().int().min(1).max(6).default(3),
  }),
  z.object({
    type: z.literal("projects"),
    tone,
    title: z.string().max(40),
    body: z.string().max(200).optional(),
  }),
  z.object({
    type: z.literal("join"),
    title: z.string().max(40),
    body: z.string().max(300),
    formUrl: z
      .union([z.literal(""), z.url({ message: "入部フォームの URL は https:// から始まる形で入力してください" })])
      .optional(),
    buttonLabel: z.string().max(20),
  }),
]);

export type Section = z.infer<typeof section>;

const pages = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string().max(40),
    description: z.string().max(160),
    sections: z.array(section).min(1),
  }),
});

export const collections = { news, projects, pages };
