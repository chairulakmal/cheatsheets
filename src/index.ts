export interface Topic {
  slug: string;
  title: string;
  live: boolean;
  /**
   * Senior-level page. `advanced: true` marks the approved exceptions to the
   * beginner-prose convention (see CLAUDE.md "Audience"): fuller prose and
   * tradeoff analysis instead of one-sentence intros. These render in a separate
   * "Advanced" section on the homepage. Default (omitted) = beginner-focused.
   */
  advanced?: boolean;
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
  { slug: "typescript-patterns", title: "TypeScript Patterns", live: false, advanced: true },
  { slug: "react-patterns", title: "React Patterns", live: true, advanced: true },
  { slug: "nextjs-patterns", title: "Next.js Patterns", live: false, advanced: true },
  { slug: "react-vs-vue", title: "React vs Vue", live: false, advanced: true },
  { slug: "vue-patterns", title: "Vue Patterns", live: true, advanced: true },
  { slug: "nuxt-patterns", title: "Nuxt Patterns", live: false, advanced: true },
];
