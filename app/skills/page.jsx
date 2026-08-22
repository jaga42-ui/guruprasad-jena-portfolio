import SkillsScreen from './screen';
import { pageMeta } from '@/app/seo';

export const metadata = pageMeta(
  "Skills — Guruprasad Jena",
  "The stack I build with and the tools I actually reach for, rated honestly.",
  "/skills",
);

export default function Page() {
  return <SkillsScreen />;
}
