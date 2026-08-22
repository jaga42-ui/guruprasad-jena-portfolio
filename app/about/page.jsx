import AboutScreen from './screen';
import { pageMeta } from '@/app/seo';

export const metadata = pageMeta(
  "About — Guruprasad Jena",
  "The long-form version: how I got here, what I studied, and what I keep coming back to.",
  "/about",
);

export default function Page() {
  return <AboutScreen />;
}
