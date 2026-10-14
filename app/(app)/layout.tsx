import { Hud } from "@/components/shell/hud";
import { NavDock } from "@/components/shell/nav";

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
      <Hud />

      <div className="flex min-h-0 flex-1 gap-4 px-3 sm:px-5">
        {/* Desktop dock */}
        <div className="hidden shrink-0 items-center pb-16 lg:flex">
          <NavDock orientation="vertical" />
        </div>

        <main
          className="
            flex
            min-w-0
            flex-1
            flex-col
            overflow-x-hidden
            overflow-y-auto
            overscroll-contain
            px-1
            pb-28
            lg:pb-8
          "
        >
          {children}
        </main>
      </div>

      {/* Mobile dock */}
      <div className="fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 flex justify-center lg:hidden">
        <NavDock orientation="horizontal" />
      </div>
    </div>
  );
}
