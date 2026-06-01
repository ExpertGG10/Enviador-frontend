import React from 'react'
import { useState } from 'react'
import AccountPage from '@/domains/account/components/AccountPage'
import { LoginPage } from '@/domains/auth/components/LoginPage'
import { ProtectedRoute } from '@/domains/auth/components/ProtectedRoute'
import Home from '@/domains/home/components/Home'
import WhatsAppInboxPage from '@/domains/inbox/components/WhatsAppInboxPage'
import SendPage from '@/domains/send/components/SendPage'
import { SignupPage } from '@/domains/auth/components/SignupPage'
import Footer from '@/shared/components/Footer'
import Header from '@/shared/components/Header'
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
