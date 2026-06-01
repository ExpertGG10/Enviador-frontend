import React from 'react'
import { useState } from 'react'
import AccountPage from '@/components/AccountPage'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Home from '@/components/Home'
import { LoginPage } from '@/components/LoginPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import SendPage from '@/components/SendPage'
import { SignupPage } from '@/components/SignupPage'
import WhatsAppInboxPage from '@/components/WhatsAppInboxPage'
import { type AppPage } from '@/types/navigation'

export default function App() {
  const [page, setPage] = useState<AppPage>('home')

  // Pages that don't require authentication
  const publicPages: AppPage[] = ['home', 'login', 'signup']
  const isPublicPage = publicPages.includes(page)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Show header on all pages except login and signup */}
      {page !== 'login' && page !== 'signup' && (
        <Header onNavigate={setPage} currentPage={page} />
      )}
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {page === 'home' && <Home onNavigate={setPage} />}
        {page === 'login' && <LoginPage onNavigate={setPage} />}
        {page === 'signup' && <SignupPage onNavigate={setPage} />}
        {page === 'send' && (
          <ProtectedRoute onNavigate={setPage}>
            <SendPage onNavigate={setPage} />
          </ProtectedRoute>
        )}
        {page === 'account' && (
          <ProtectedRoute onNavigate={setPage}>
            <AccountPage />
          </ProtectedRoute>
        )}
        {page === 'contact' && (
          <ProtectedRoute onNavigate={setPage}>
            <div>Contato (em breve)</div>
          </ProtectedRoute>
        )}
        {page === 'whatsapp' && (
          <ProtectedRoute onNavigate={setPage}>
            <WhatsAppInboxPage onNavigate={setPage} />
          </ProtectedRoute>
        )}
      </main>

      {/* Show footer on all pages except login and signup */}
      {page !== 'login' && page !== 'signup' && <Footer />}
    </div>
  )
}
