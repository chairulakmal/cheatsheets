export interface Topic {
  slug: string;
  title: string;
  live: boolean;
}

export const topics: Topic[] = [
  { slug: "typescript", title: "TypeScript", live: true },
  { slug: "react",      title: "React",      live: true },
  { slug: "vue",        title: "Vue",        live: true },
  { slug: "rails",      title: "Rails",      live: false },
  { slug: "elixir",     title: "Elixir",     live: false },
];
