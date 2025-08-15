import ScrollToTop from './ScrollToTop';
import BackToHome from './BackToHome';
{/* import ChatButton from './ChatButton'; /> */}

export default function FloatingButtons() {
  return (
    <div className="fixed bottom-[72px] right-4 z-[60] flex flex-col items-end gap-1.5">
      <ScrollToTop />
      <BackToHome />
     {/* <ChatButton /> */}
    </div>
  );
}
