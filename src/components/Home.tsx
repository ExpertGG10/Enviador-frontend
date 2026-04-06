import React from 'react'

type HomeProps = {
  onNavigate?: (page: 'home' | 'send' | 'account' | 'contact') => void
}

export default function Home({ onNavigate }: HomeProps) {
  return (
    <main className="py-20 px-6">
      {/* HERO */}
      <section className="text-center max-w-4xl mx-auto">
        <div className="flex justify-center gap-3 mb-6">
          <span className="px-3 py-1 rounded-full border text-sm">WhatsApp</span>
          <span className="px-3 py-1 rounded-full border text-sm">Email</span>
        </div>

        <h1 className="text-5xl font-extrabold leading-tight mb-6">
          Envie mensagens por{' '}
          <span className="text-green-600">WhatsApp</span>{' '}
          ou{' '}
          <span className="text-blue-600">Email</span>{' '}
          com facilidade
        </h1>

        <p className="text-slate-600 text-lg mb-8">
          Prepare listas, edite mensagens com placeholders e envie em massa
          com controle e visibilidade.
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => onNavigate?.('send')}
            className="btn btn-primary px-6"
          >
            Começar agora
          </button>
          <button className="btn btn-ghost px-6">
            Entrar na conta
          </button>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="mt-24">
        <h2 className="text-center text-2xl font-bold mb-10">Como funciona</h2>

        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card
            title="Listas"
            desc="Organize seus contatos em listas segmentadas"
            icon="👥"
          />
          <Card
            title="Mensagem"
            desc="Crie mensagens com placeholders dinâmicos"
            icon="✏️"
          />
          <Card
            title="Envio"
            desc="Dispare em massa com controle total"
            icon="📤"
          />
          <Card
            title="Respostas"
            desc="Acompanhe respostas em tempo real"
            icon="📥"
          />
        </div>
      </section>
    </main>
  )
}

function Card({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="border rounded-xl p-6 hover:shadow-md transition bg-white">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-slate-600 text-sm">{desc}</p>
    </div>
  )
}