import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-white border-t mt-8">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row md:justify-between gap-4 items-center">
        <div>
          <div className="font-semibold">Rio Software</div>
          <div className="text-sm text-slate-500">Construindo o futuro com simplicidade.</div>
        </div>
        <div className="flex gap-6 text-sm text-slate-600">
          <a href="mailto:mateusaragao.sm@gmail.com" className="hover:underline">mateusaragao.sm@gmail.com</a>
          <a href="tel:+5521982033351" className="hover:underline">+55 (21) 98203-3351</a>
        </div>
        <div className="text-sm text-slate-500">© {new Date().getFullYear()} Rio Software</div>
      </div>
    </footer>
  )
} 
