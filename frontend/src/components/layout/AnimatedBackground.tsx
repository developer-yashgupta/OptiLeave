'use client'

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#EBE8E7] via-[#F6F4F4] to-[#AAAAAA]" />
      
      {/* Animated orbs */}
      <div className="absolute -top-24 -left-24 w-[400px] h-[400px] bg-[#7000ff] rounded-full blur-[80px] opacity-45 animate-float" />
      <div className="absolute -bottom-12 -right-12 w-[300px] h-[300px] bg-[#00d4ff] rounded-full blur-[80px] opacity-45 animate-float-delayed" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-[#ff0055] rounded-full blur-[80px] opacity-45 animate-float-delayed-2" />
    </div>
  )
}
