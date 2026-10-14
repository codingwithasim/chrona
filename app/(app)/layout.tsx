import { Hud } from "@/components/shell/hud";
import { NavDock, NavRail } from "@/components/shell/nav";
import { RightPanel } from "@/components/right-panel/right-panel";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-ui
      data-passthrough
      className="fixed inset-0 flex flex-col overflow-hidden"
    >
      <Hud showPanelTrigger />

      <div className="flex min-h-0 flex-1 gap-5 px-3 sm:px-5">
        {/* Desktop menu */}
        <NavRail className="hidden lg:flex" />

        <main
          className="
            min-w-0
            flex-1
            overflow-y-auto
            overscroll-contain
            px-2
            pt-2
            pb-32
            lg:pb-8
          "
        >
          {children}
        </main>

        {/* Desktop controls */}
        <RightPanel className="hidden xl:flex" />
      </div>

      {/* Mobile menu */}
      <NavDock className="lg:hidden" />
    </div>
  );
}
