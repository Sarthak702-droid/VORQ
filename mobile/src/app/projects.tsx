import { Page } from "../components/ui";
import { Documents } from "../components/Documents";
import { useWorkspace } from "../state/Workspace";
export default function Projects() {
  const { company } = useWorkspace();
  return (
    <Page title="Projects" subtitle="Your assigned sites and project details.">
      {company ? <Documents key={company} module="projects" /> : null}
    </Page>
  );
}
