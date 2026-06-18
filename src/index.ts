export interface Topic {
  slug: string;
  title: string;
  live: boolean;
}

export const topics: Topic[] = [
  { slug: "javascript", title: "JavaScript", live: true },
  { slug: "typescript", title: "TypeScript", live: true },
  { slug: "react", title: "React", live: true },
  { slug: "nextjs", title: "Next.js", live: true },
  { slug: "vue", title: "Vue", live: true },
  { slug: "nuxt", title: "Nuxt", live: true },
  { slug: "rails", title: "Rails", live: false },
  { slug: "elixir", title: "Elixir", live: false },
  { slug: "python", title: "Python", live: false },
];
