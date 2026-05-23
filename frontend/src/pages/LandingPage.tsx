import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const planesDisponibles = [
  { id: 1, nombre: 'Plan Básico',  desc: 'Deducible alto, ideal para imprevistos mayores.',        copagoEj: '$80 general',  color: 'bg-slate-50 text-slate-700 border-slate-300'  },
  { id: 2, nombre: 'Plan Plata',   desc: 'Equilibrio entre prima mensual y costos de bolsillo.',   copagoEj: '$50 general',  color: 'bg-gray-100 text-gray-800 border-gray-400'    },
  { id: 3, nombre: 'Plan Oro',     desc: 'Menor deducible, mayor cobertura en especialistas.',     copagoEj: '$30 general',  color: 'bg-yellow-50 text-yellow-800 border-yellow-400' },
  { id: 4, nombre: 'Plan Platino', desc: 'Sin deducible, copagos fijos mínimos en toda la red.',   copagoEj: '$5 general',   color: 'bg-cyan-50 text-cyan-800 border-cyan-400'      },
];


const FadeInSection = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: false, amount: 0.3, margin: "-50px" }}
    transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }} // Suavizado estilo Apple
  >
    {children}
  </motion.div>
);

export function LandingPage() {
  const navigate = useNavigate();
  const [planSeleccionado, setPlanSeleccionado] = useState(planesDisponibles[1]);
  const [deducibleCumplido, setDeducibleCumplido] = useState(false);

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans selection:bg-blue-200 overflow-x-hidden">
      
      <section className="min-h-[90vh] flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <span className="text-7xl md:text-9xl block mb-10">🤖</span>
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8 max-w-5xl mx-auto leading-[0.95]">
            Salud transparente. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              Sin sorpresas.
            </span>
          </h1>
          <p className="text-2xl md:text-3xl text-gray-500 max-w-3xl mx-auto mb-14 font-medium leading-relaxed">
            Baymax calcula tu copago exacto y encuentra el mejor hospital de tu red antes de que te atiendas.
          </p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => document.getElementById('seccion-planes')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-5 px-10 rounded-full transition-colors text-xl shadow-lg"
          >
            Descubre cómo funciona
          </motion.button>
        </motion.div>
      </section>

      <section className="py-40 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <FadeInSection>
            <h2 className="text-4xl md:text-6xl font-bold text-center mb-28 tracking-tight max-w-3xl mx-auto leading-tight">
              Inteligencia agéntica que cuida tu bolsillo.
            </h2>
          </FadeInSection>

          <div className="grid md:grid-cols-3 gap-16">
            <FadeInSection delay={0.1}>
              <div className="text-center flex flex-col items-center">
                <div className="bg-white border border-gray-100 shadow-inner w-20 h-20 rounded-3xl flex items-center justify-center mb-8 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 tracking-tight">1. Di tu síntoma</h3>
                <p className="text-gray-500 text-lg leading-relaxed">
                  Cuéntale a Baymax cómo te sientes en español o inglés. Él determina la especialidad médica exacta.
                </p>
              </div>
            </FadeInSection>
            
            <FadeInSection delay={0.2}>
              <div className="text-center flex flex-col items-center">
                <div className="bg-white border border-gray-100 shadow-inner w-20 h-20 rounded-3xl flex items-center justify-center mb-8 text-cyan-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 tracking-tight">2. Cruce de Datos</h3>
                <p className="text-gray-500 text-lg leading-relaxed">
                  Baymax consulta tu plan de seguro en tiempo real, calculando deducibles y coberturas específicas.
                </p>
              </div>
            </FadeInSection>

            <FadeInSection delay={0.3}>
              <div className="text-center flex flex-col items-center">
                <div className="bg-white border border-gray-100 shadow-inner w-20 h-20 rounded-3xl flex items-center justify-center mb-8 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 tracking-tight">3. Mejor Opción</h3>
                <p className="text-gray-500 text-lg leading-relaxed">
                  Recibes un ranking de hospitales de la red ordenados por el menor copago para tu bolsillo.
                </p>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      <section id="seccion-planes" className="py-40 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-5">
                Selecciona tu plan para empezar.
              </h2>
              <p className="text-2xl text-gray-500 max-w-2xl mx-auto font-medium">
                Esta información es vital para que Baymax calcule tu cobertura exacta.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-16">
              {planesDisponibles.map((plan) => (
                <motion.div
                  key={plan.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPlanSeleccionado(plan)}
                  className={`p-8 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between h-full shadow-sm
                    ${planSeleccionado.id === plan.id 
                      ? `${plan.color} ring-2 ring-offset-4 ring-blue-500 border-transparent shadow-xl` 
                      : 'bg-white text-slate-800 border-gray-100 hover:border-blue-300'
                    }
                  `}
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-extrabold text-2xl tracking-tight">{plan.nombre}</h3>
                      {planSeleccionado.id === plan.id && (
                        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          Seleccionado
                        </span>
                      )}
                    </div>
                    <p className={`text-lg mb-6 leading-relaxed ${planSeleccionado.id === plan.id ? 'opacity-90' : 'text-gray-500'}`}>
                      {plan.desc}
                    </p>
                  </div>
                  <div className={`border-t pt-5 mt-auto ${planSeleccionado.id === plan.id ? 'border-black/10' : 'border-gray-100'}`}>
                    <span className="text-xs uppercase tracking-wider font-semibold opacity-70">Ejemplo Consulta General:</span>
                    <span className="block font-extrabold text-2xl mt-1">{plan.copagoEj}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Toggle deducible */}
            <div className="flex flex-col items-center gap-4 mt-10 mb-6">
              <p className="text-xl font-semibold text-slate-700">¿Ya cumpliste tu deducible anual?</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeducibleCumplido(false)}
                  className={`px-8 py-3 rounded-full font-semibold text-lg border-2 transition-all ${
                    !deducibleCumplido
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-gray-200 hover:border-slate-400'
                  }`}
                >
                  No todavía
                </button>
                <button
                  onClick={() => setDeducibleCumplido(true)}
                  className={`px-8 py-3 rounded-full font-semibold text-lg border-2 transition-all ${
                    deducibleCumplido
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-slate-600 border-gray-200 hover:border-green-400'
                  }`}
                >
                  Sí, ya lo cumplí
                </button>
              </div>
              <p className="text-sm text-gray-400">
                {deducibleCumplido
                  ? 'Tus copagos serán los más bajos de tu plan.'
                  : 'Tus copagos incluyen el costo antes del deducible.'}
              </p>
            </div>

            <div className="flex justify-center mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/chat', { state: { planActivo: planSeleccionado, deducibleCumplido } })}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-14 rounded-full transition-colors shadow-2xl flex items-center gap-3 text-2xl"
              >
                <span>Hablar con Baymax</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </motion.button>
            </div>
          </FadeInSection>
        </div>
      </section>

    </div>
  );
}