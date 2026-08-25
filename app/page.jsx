import HomeScreen from './screen';
import { pageMeta } from '@/app/seo';

export const metadata = pageMeta(
  "Guruprasad Jena — Full-Stack Developer",
  "Full-stack developer — TypeScript, Next.js, Node.js, MongoDB. Four products live: job-matching, developer tools, editorial and an emergency-response network.",
  "/",
);

export default function Page() {
  return <HomeScreen />;
}
