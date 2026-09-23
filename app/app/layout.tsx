export default function AppShellLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#FAF8F3]">
      {children}
    </div>
  );
}
