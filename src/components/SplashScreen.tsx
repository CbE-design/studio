'use client';
const SplashScreen = () => (
  <div className="bg-gradient-to-b from-[#008A4D] to-[#00703C] text-white flex flex-col items-center justify-between h-screen font-sans p-8">
    <div className="w-full flex-grow flex flex-col justify-start pt-16">
        <h1 className="text-3xl text-center tracking-wider">
            <span className="font-extrabold">NEDBANK</span><span className="font-light">MONEY</span><sup className="text-xs font-light">TM</sup>
        </h1>
    </div>
    <div className="flex-grow flex items-center justify-center">
        <svg
            width="150"
            height="150"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white/50"
            >
            <path d="M41 42C41 39.7909 42.7909 38 45 38H68C70.2091 38 72 39.7909 72 42V52C72 54.2091 70.2091 56 68 56H45C42.7909 56 41 54.2091 41 52V42Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M64 45H70" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M67 49H70" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M48 64H59" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M46 90H37C34.7909 90 33 88.2091 33 86V54C33 51.7909 34.7909 50 37 50H63C65.2091 50 67 51.7909 67 54V60" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="50" cy="79" r="2" fill="currentColor"/>
            <path d="M69 35C69 32.2386 71.2386 30 74 30H79.5C80.8807 30 82 28.8807 82 27.5V27.5C82 26.1193 80.8807 25 79.5 25H77" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M46.8333 34C48.0308 27.8 53.4018 20.3 61.5 20.3C69.5982 20.3 75.8333 26.5354 75.8333 34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M29 33.5C29 27.149 34.149 22 40.5 22C43.8413 22 46.8553 23.4116 48.889 25.6888" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M45.1667 47.3333C45.1667 45.4924 46.6591 44 48.5 44C50.3409 44 51.8333 45.4924 51.8333 47.3333C51.8333 48.4816 51.2147 49.5015 50.252 50.0633L48.5 51L46.748 50.0633C45.7853 49.5015 45.1667 48.4816 45.1667 47.3333Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M48.5 41V44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M48.5 31.6667V36.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M41.6667 38.5H44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M53 38.5H55.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M44.5 34L46.1667 35.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M50.8333 35.6667L52.5 34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M36 61L34 62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M38.5 65.5L37 66.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M33 65H31" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    </div>

    <p className="text-xs text-center text-white/80 flex-grow-0">
      Nedbank Ltd Reg No 1951/000009/06. Licensed financial services<br /> provider (FSP9363) and registered credit provider (NCRCP16)
    </p>
  </div>
);

export default SplashScreen;
