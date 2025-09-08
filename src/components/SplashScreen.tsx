'use client';
const SplashScreen = () => (
  <div className="bg-gradient-to-b from-[#009448] to-[#007E3A] text-white flex flex-col h-screen font-sans p-8">
    <div className="flex-1 flex flex-col items-center justify-center">
      <h1 className="text-3xl text-center tracking-wider">
        <span className="font-extrabold text-white">NEDBANK</span>
        <span className="font-light text-[#D4FF00]">MONEY</span>
        <sup className="text-xs font-light text-[#D4FF00]">TM</sup>
      </h1>
    </div>
    <p className="text-xs text-center text-white/80">
      Nedbank Ltd Reg No 1951/000009/06. Licensed financial services<br /> provider (FSP9363) and registered credit provider (NCRCP16)
    </p>
  </div>
);

export default SplashScreen;
