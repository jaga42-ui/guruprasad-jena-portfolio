import ProjectsScreen from './screen';
import { pageMeta } from '@/app/seo';

export const metadata = pageMeta(
  "Projects — Guruprasad Jena",
  "Four shipped products — Umbrix, GetFreeToolsAI, Veritas Picks and Sahayam — each with its architecture, the decisions behind it, what failed and what I would rebuild.",
  "/projects",
);

export default function Page() {
  return <ProjectsScreen />;
}
