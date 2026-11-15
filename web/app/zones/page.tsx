import { AppShell } from "@/components/nav/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { OwnerTodo } from "@/components/ui/OwnerTodo";
import { PAGES } from "@/lib/pages";

const page = PAGES.find((p) => p.href === "/zones")!;

export default function Page() {
  return (
    <AppShell>
      <PageHeader page={page} />
      <OwnerTodo page={page} />
    </AppShell>
  );
}
