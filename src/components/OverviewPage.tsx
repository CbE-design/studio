'use client';
import { Bell, Eye, ChevronLeft, ChevronRight, FileText, Umbrella, Car, ShoppingCart, GitPullRequest, CreditCard, Banknote, Home, FileBadge, MessageSquare } from 'lucide-react';
import Image from 'next/image';

const OverviewPage = ({ userId, overviewPagesData, balances, carouselIndex, handleCarouselScroll, scrollToPage, setCurrentView, scrollContainerRef }) => {
  const getOnClickHandler = (action) => (typeof action === 'string' ? () => setCurrentView(action) : () => {});

  const widgets = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        >
          <path d="M12 10c-2.3 0-4-1.8-4-4s1.7-4 4-4 4 1.8 4 4-1.7 4-4 4zM8.5 10H6c-1.7 0-3 1.3-3 3v2c0 1.7 1.3 3 3 3h12c1.7 0 3-1.3 3-3v-2c0-1.7-1.3-3-3-3h-2.5" />
          <path d="M12.5 10.5c.3.3.5.7.5 1.1 0 .4-.2.8-.5 1.1-.3.3-.7.5-1.1.5s-.8-.2-1.1-.5c-.3-.3-.5-.7-.5-1.1 0-.4.2.8.5-1.1.3-.3.7-.5 1.1-.5s.8.2 1.1.5z" />
          <path d="M12 8v-1" />
          <path d="M12 15v1" />
          <path d="M10.5 9.5l-.7-.7" />
          <path d="M14.2 13.2l.7.7" />
          <path d="M13.5 9.5l.7-.7" />
          <path d="M9.8 13.2l-.7.7" />
        </svg>
      ),
      text: 'Offers for you'
    },
    { icon: <FileText size={24} />, text: 'Applications' },
    { icon: <Umbrella size={24} />, text: 'Insure', badge: 5 },
    { icon: <Car size={24} />, text: 'Discs and fines' },
    { icon: <ShoppingCart size={24} />, text: 'Shop', badge: 1 },
    { icon: <GitPullRequest size={24} />, text: 'PayShap Request' },
    { icon: <Banknote size={24} />, text: 'Quick Pay' },
    { icon: <CreditCard size={24} />, text: 'Get cash' },
    { icon: <Home size={24} />, text: 'Home loans' },
    { icon: <FileBadge size={24} />, text: 'Statements and docs', onClick: () => setCurrentView('statementAccount') },
  ];

  const today = new Date();
  const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear().toString().slice(-2)}`;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-b from-[#009E4D] to-[#008055]">
        <header className="bg-transparent text-primary-foreground p-4 flex justify-between items-center w-full flex-shrink-0">
          <div className="flex items-center space-x-4">
            <Image
              src="https://firebasestorage.googleapis.com/v0/b/van-schalkwyk-trust-mobile.firebasestorage.app/o/Nedbank_idvPPE6CB0_1.png?alt=media&token=aa008132-7cf7-4971-b859-e64a8ac3aa47"
              alt="Logo"
              width={28}
              height={28}
            />
            <span className="text-lg font-semibold text-primary-foreground">Van Schalkwyk Family Trust</span>
          </div>
          <div className="flex items-center space-x-4">
            <Bell size={24} className="text-primary-foreground" />
            <MessageSquare size={24} className="text-primary-foreground" />
          </div>
        </header>
        <div className="bg-transparent">
          <div ref={scrollContainerRef} onScroll={handleCarouselScroll} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth">
            {overviewPagesData.map((page) => (
              <div key={page.id} className="w-full flex-shrink-0 snap-center">
                <div className="text-primary-foreground p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <h1 className="text-lg font-bold text-primary-foreground">{page.title}</h1>
                    <Eye size={20} className="text-primary-foreground" />
                  </div>
                  <div className="space-y-0">
                    {page.content.filter(item => item.type === 'account' || item.type === 'item').map((item, itemIndex) => {
                      const value = item.balanceKey ? `R${balances[item.balanceKey].toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}` : item.value;
                      return (
                        <div key={itemIndex} className="cursor-pointer py-3 border-b border-green-600 last:border-b-0" onClick={getOnClickHandler(item.onClick)}>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-light">{item.title}</p>
                              <p className="text-lg font-normal">{value}</p>
                            </div>
                            <ChevronRight size={20} className="text-primary-foreground" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {page.content.filter(item => item.type === 'action').map((item, itemIndex) => (
                  <div key={itemIndex} className="bg-[#005A30] px-4 py-4 text-primary-foreground">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm">{item.title}</p>
                        {item.value && <p className="text-lg font-semibold">{item.value}</p>}
                      </div>
                      <button className={`font-bold ${item.color === 'yellow' ? 'text-[#D4FF00]' : 'text-primary-foreground'}`}>{item.actionText}</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex justify-center items-center py-4 space-x-3">
            <ChevronLeft size={20} className={carouselIndex > 0 ? "text-white cursor-pointer" : "text-white/50"} onClick={() => scrollToPage(carouselIndex - 1)} />
            {overviewPagesData.map((_, index) => (
              <div key={index} onClick={() => scrollToPage(index)} className={`cursor-pointer rounded-full transition-all duration-300 ${index === carouselIndex ? 'w-3 h-3 bg-white' : 'w-2 h-2 bg-green-300/50'}`}></div>
            ))}
            <ChevronRight size={20} className={carouselIndex < overviewPagesData.length - 1 ? "text-white cursor-pointer" : "text-white/50"} onClick={() => scrollToPage(carouselIndex + 1)} />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-16 bg-gray-100">
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4 text-gray-800">My widgets</h2>
          <div className="grid grid-cols-4 gap-4">
            {widgets.map((widget) => (
              <div key={widget.text} className="flex flex-col items-center text-center cursor-pointer" onClick={widget.onClick}>
                <div className="relative bg-white p-4 rounded-xl shadow-md flex items-center justify-center w-16 h-16">
                  {widget.icon}
                  {widget.badge && (
                    <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {widget.badge}
                    </div>
                  )}
                </div>
                <span className="mt-2 text-xs text-gray-700">{widget.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
