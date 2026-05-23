import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { HospitalCard } from "../components/HospitalCard";
import type { HospitalData } from "../components/HospitalCard";

type Mensaje = {
  id: number;
  rol: "agente" | "usuario";
  texto: string;
  hospitales?: HospitalData[];
};

type BackendHospital = {
  id: number;
  nombre: string;
  ciudad: string;
  distancia_km: number;
  calificacion: number;
  telefono: string;
  es_red: boolean;
  especialidad: string;
  tipo_visita: string;
  copago: number;
};

type BackendResponse = {
  mensaje_agente: string;
  especialidad_sugerida: string;
  tipo_visita: string;
  copago_estimado: number;
  needs_clarification: boolean;
  clarification_question: string;
  opciones: BackendHospital[];
};

function generarSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const planActivo = location.state?.planActivo ?? { id: 2, nombre: "Plan Plata" };
  const deducibleCumplido: boolean = location.state?.deducibleCumplido ?? false;

  const [sessionId] = useState(generarSessionId);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: 1,
      rol: "agente",
      texto: `Hola, soy Baymax 🤖 Tu plan activo es **${planActivo.nombre}** con deducible ${deducibleCumplido ? "ya cumplido ✅" : "aún no cumplido"}. Cuéntame tu síntoma y calcularé tu copago exacto.`,
    },
  ]);

  const [inputTexto, setInputTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const mensajesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const manejarEnvio = async () => {
    if (inputTexto.trim() === "" || cargando) return;

    const textoUsuario = inputTexto;

    setMensajes((prev) => [
      ...prev,
      { id: Date.now(), rol: "usuario", texto: textoUsuario },
    ]);
    setInputTexto("");
    setCargando(true);

    try {
      const respuesta = await fetch("http://localhost:8000/api/agente/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planActivo.id,
          sintoma: textoUsuario,
          session_id: sessionId,
          deductible_met: deducibleCumplido,
        }),
      });

      if (!respuesta.ok) throw new Error("Error del servidor");

      const datos: BackendResponse = await respuesta.json();

      const hospitalesMapeados: HospitalData[] = datos.opciones.map(
        (h, idx) => ({
          id: String(h.id),
          nombre: h.nombre,
          especialidad: h.especialidad.replace("_", " "),
          copago: h.copago,
          distancia_km: h.distancia_km,
          calificacion: h.calificacion,
          en_red: h.es_red,
          recomendado: idx === 0,
        }),
      );

      setMensajes((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          rol: "agente",
          texto: datos.mensaje_agente,
          hospitales: datos.needs_clarification ? [] : hospitalesMapeados,
        },
      ]);
    } catch {
      setMensajes((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          rol: "agente",
          texto: "Lo siento, tuve un problema al conectarme. Verifica que el backend esté encendido.",
        },
      ]);
    } finally {
      setCargando(false);
    }
  };

  const manejarTeclaEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") manejarEnvio();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-gray-700 transition-colors mr-1"
            title="Volver"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span className="text-2xl">🤖</span>
          <h1 className="text-xl font-bold text-slate-800">Baymax — Asistente de Salud</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold border border-blue-200">
            {planActivo.nombre}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${
            deducibleCumplido
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {deducibleCumplido ? "Deducible ✅" : "Deducible pendiente"}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center">
        <div className="w-full max-w-3xl space-y-6">
          {mensajes.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 ${msg.rol === "usuario" ? "items-end" : "items-start"}`}
            >
              <span className={`text-xs font-bold text-gray-500 ${msg.rol === "usuario" ? "mr-1" : "ml-1"}`}>
                {msg.rol === "usuario" ? "Tú" : "Baymax ⚪—⚪"}
              </span>

              <div
                className={`border p-4 shadow-sm max-w-[85%] leading-relaxed
                ${msg.rol === "usuario"
                  ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm border-blue-700"
                  : "bg-white text-slate-800 rounded-2xl rounded-tl-sm border-gray-200"
                }`}
              >
                {msg.rol === "agente" ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      strong: ({ children }) => (
                        <strong className="font-bold">{children}</strong>
                      ),
                      p: ({ children }) => (
                        <p className="mb-1 last:mb-0">{children}</p>
                      ),
                    }}
                  >
                    {msg.texto}
                  </ReactMarkdown>
                ) : (
                  msg.texto
                )}
              </div>

              {msg.hospitales && msg.hospitales.length > 0 && (
                <div className="w-full max-w-[85%] mt-2 flex flex-col gap-3">
                  {msg.hospitales.map((hosp) => (
                    <HospitalCard key={hosp.id} data={hosp} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {cargando && (
            <div className="flex items-start gap-1 ml-1">
              <span className="text-xs font-bold text-gray-500">Baymax ⚪—⚪</span>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex gap-1 items-center ml-0 mt-5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              </div>
            </div>
          )}

          <div ref={mensajesEndRef} />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 p-4 flex justify-center">
        <div className="w-full max-w-3xl flex gap-3">
          <input
            type="text"
            value={inputTexto}
            onChange={(e) => setInputTexto(e.target.value)}
            onKeyDown={manejarTeclaEnter}
            disabled={cargando}
            placeholder="Ej: Tengo un dolor fuerte en la cabeza con náuseas..."
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm disabled:bg-gray-50"
          />
          <button
            onClick={manejarEnvio}
            disabled={inputTexto.trim() === "" || cargando}
            className={`font-medium px-6 py-3 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2
              ${inputTexto.trim() === "" || cargando
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
          >
            <span>Enviar</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default ChatPage;
