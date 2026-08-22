import ContactScreen from './screen';
import { pageMeta } from '@/app/seo';

export const metadata = pageMeta(
  "Contact — Guruprasad Jena",
  "Open to work from Odisha, India. One address, three links, and a reply within the day.",
  "/contact",
);

export default function Page() {
  return <ContactScreen />;
}
