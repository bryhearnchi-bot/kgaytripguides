export default function BottomSafeArea() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-transparent pb-[env(safe-area-inset-bottom)] pointer-events-none" />
  );
}
