import ProjectsScreen from './screen';
import { pageMeta } from '@/app/seo';

export const metadata = pageMeta(
  "Projects — Guruprasad Jena",
  "Four case files — Umbrix, GetFreeToolsAI, Veritas Picks and Sahayam — plotted as blueprint sheets.",
  "/projects",
);

export default function Page() {
  return <ProjectsScreen />;
}
