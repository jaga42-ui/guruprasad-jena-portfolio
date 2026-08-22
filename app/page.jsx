import HomeScreen from './screen';
import { pageMeta } from '@/app/seo';

export const metadata = pageMeta(
  "Guruprasad Jena — Scrapbook",
  "Full-stack developer. Four products live, two repos open — a scrapbook of the work and the person behind it.",
  "/",
);

export default function Page() {
  return <HomeScreen />;
}
