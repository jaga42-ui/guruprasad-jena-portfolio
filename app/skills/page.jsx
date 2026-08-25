import SkillsScreen from './screen';
import { pageMeta } from '@/app/seo';

export const metadata = pageMeta(
  "Skills — Guruprasad Jena",
  "The full-stack toolkit — React and Next.js on the front, Node and Express behind it, MongoDB and Redis underneath, and the AI tooling I actually ship with.",
  "/skills",
);

export default function Page() {
  return <SkillsScreen />;
}
