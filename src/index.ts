export type TopicGroup = 'fundamentals' | 'frameworks' | 'backend';

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
  /** Homepage grouping for non-advanced topics. */
  group?: TopicGroup;
}

export const topics: Topic[] = [
  { slug: "javascript", title: "JavaScript", live: true, group: "fundamentals" },
  { slug: "typescript", title: "TypeScript", live: true, group: "fundamentals" },
  { slug: "html", title: "HTML", live: true, group: "fundamentals" },
  { slug: "css", title: "CSS", live: true, group: "fundamentals" },
  { slug: "git", title: "Git", live: false, group: "fundamentals" },
  { slug: "bash", title: "Bash", live: false, group: "fundamentals" },
  { slug: "vue", title: "Vue", live: true, group: "frameworks" },
  { slug: "nuxt", title: "Nuxt", live: true, group: "frameworks" },
  { slug: "react", title: "React", live: true, group: "frameworks" },
  { slug: "nextjs", title: "Next.js", live: true, group: "frameworks" },
  { slug: "rails", title: "Rails", live: false, group: "backend" },
  { slug: "elixir", title: "Elixir", live: false, group: "backend" },
  { slug: "python", title: "Python", live: false, group: "backend" },
  { slug: "vue-patterns", title: "Vue Patterns", live: true, advanced: true },
  { slug: "nuxt-patterns", title: "Nuxt Patterns", live: false, advanced: true },
  { slug: "react-vs-vue", title: "React vs Vue", live: false, advanced: true },
  { slug: "react-patterns", title: "React Patterns", live: true, advanced: true },
  { slug: "nextjs-patterns", title: "Next.js Patterns", live: false, advanced: true },
  { slug: "typescript-patterns", title: "TypeScript Patterns", live: false, advanced: true },
];
