import { useState, useRef, useEffect } from "react";
import { HospitalCard } from "../components/HospitalCard";
import type { HospitalData } from "../components/HospitalCard";

type Mensaje = {
  id: number;
  rol: "agente" | "usuario";
  texto: string;
  hospitales?: HospitalData[];
};

// Lo que responde tu backend en el array "opciones"
type OpcionClinicaBackend = {
  clinica_id?: string;
  clinica_nombre: string;
  copago_estimado: string | number;
  distancia_km?: number;
  rating?: number;
  en_red?: boolean;
};

function App() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: 1,
      rol: "agente",
      texto:
        "Hola, soy Baymax, tu asistente médico personal. ¿En una escala del 1 al 10, cómo calificarías tu dolor?",
    },
    {
      id: 2,
      rol: "usuario",
      texto: "Tengo un dolor fuerte en el pecho y me cuesta respirar.",
    },
    {
      id: 3,
      rol: "agente",
      texto:
        "Basándome en tus síntomas, te recomiendo acudir a Urgencias o a un Cardiólogo lo antes posible. Con tu Plan Plata, estas son tus mejores opciones en la red:",
      hospitales: [
        {
          id: "h001",
          nombre: "Hospital del Norte",
          especialidad: "Cardiología",
          copago: 100,
          distancia_km: 2.1,
          calificacion: 4.5,
          en_red: true,
          recomendado: true,
        },
        {
          id: "h003",
          nombre: "Centro Médico Sur",
          especialidad: "Urgencias",
          copago: 200,
          distancia_km: 1.2,
          calificacion: 3.9,
          en_red: true,
        },
      ],
    },
  ]);

  const [inputTexto, setInputTexto] = useState("");
  const [cargando, setCargando] = useState(false); // NUEVO - Controla el estado de espera de la API
  const mensajesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  // const manejarEnvio = () => {
  //   if (inputTexto.trim() === "") return;

  //   const nuevoMensaje: Mensaje = {
  //     id: Date.now(),
  //     rol: "usuario",
  //     texto: inputTexto,
  //   };

  //   setMensajes((prevMensajes) => [...prevMensajes, nuevoMensaje]);

  //   setInputTexto("");
  // };

  const manejarEnvio = async () => {
    if (inputTexto.trim() === "" || cargando) return;

    const textoUsuario = inputTexto;

    // 1. Insertamos el mensaje del usuario en el chat inmediatamente
    const nuevoMensajeUsuario: Mensaje = {
      id: Date.now(),
      rol: "usuario",
      texto: textoUsuario,
    };

    setMensajes((prevMensajes) => [...prevMensajes, nuevoMensajeUsuario]);
    setInputTexto("");
    setCargando(true); // Encendemos el estado de carga

    try {
      // 2. Conexión directa con tu endpoint de Django
      const respuesta = await fetch("http://localhost:8000/api/agente/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numero_poliza: "POL-001", // Cambia esto por una póliza real de tu DB al probar
          sintoma: textoUsuario,
        }),
      });

      if (!respuesta.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      const datos = await respuesta.json();

      // 3. Mapeamos las 'opciones' de Django al formato 'HospitalData' que usa tu interfaz
      const hospitalesMapeados = datos.opciones.map(
        (opc: OpcionClinicaBackend, index: number) => ({
          id: opc.clinica_id || `h-${index}`,
          nombre: opc.clinica_nombre,
          especialidad: datos.especialidad_sugerida,
          copago:
            typeof opc.copago_estimado === "string"
              ? parseFloat(opc.copago_estimado)
              : opc.copago_estimado,
          distancia_km: opc.distancia_km || 1.5,
          calificacion: opc.rating || 4.2,
          en_red: opc.en_red !== false,
        }),
      );

      // 4. Agregamos la respuesta real de Baymax con sus respectivas tarjetas
      const respuestaBaymax: Mensaje = {
        id: Date.now() + 1,
        rol: "agente",
        texto:
          datos.mensaje_agente ||
          `Te sugiero consultar la especialidad de ${datos.especialidad_sugerida}.`,
        hospitales: hospitalesMapeados,
      };

      setMensajes((prevMensajes) => [...prevMensajes, respuestaBaymax]);
    } catch (error) {
      console.error("Error conectando al backend:", error);

      // Si Django está apagado, le avisa limpiamente al usuario
      setMensajes((prevMensajes) => [
        ...prevMensajes,
        {
          id: Date.now() + 1,
          rol: "agente",
          texto:
            "Lo siento, tuve un problema al conectarme con mis servidores médicos. Por favor, verifica que el backend esté encendido.",
        },
      ]);
    } finally {
      setCargando(false); // Apagamos el estado de carga
    }
  };

  const manejarTeclaEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      manejarEnvio();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <h1 className="text-xl font-bold text-slate-800">
            Baymax - Asistente de Salud
          </h1>
        </div>
        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold border border-blue-200">
          Plan Activo: Plata
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center">
        <div className="w-full max-w-3xl space-y-6">
          {mensajes.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 ${msg.rol === "usuario" ? "items-end" : "items-start"}`}
            >
              <span
                className={`text-xs font-bold text-gray-500 ${msg.rol === "usuario" ? "mr-1" : "ml-1"}`}
              >
                {msg.rol === "usuario" ? "Tú" : "Baymax ⚪—⚪"}
              </span>

              <div
                className={`border p-4 shadow-sm max-w-[85%] leading-relaxed 
                ${
                  msg.rol === "usuario"
                    ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm border-blue-700"
                    : "bg-white text-slate-800 rounded-2xl rounded-tl-sm border-gray-200"
                }`}
              >
                {msg.texto}
              </div>

              {msg.hospitales && (
                <div className="w-full max-w-[85%] mt-2 flex flex-col gap-3">
                  {msg.hospitales.map((hosp) => (
                    <HospitalCard key={hosp.id} data={hosp} />
                  ))}
                </div>
              )}
            </div>
          ))}

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
            placeholder="Ej: Tengo un dolor fuerte en la cabeza con náuseas..."
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
          />
          <button
            onClick={manejarEnvio}
            disabled={inputTexto.trim() === ""}
            className={`font-medium px-6 py-3 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2
              ${
                inputTexto.trim() === ""
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
          >
            <span>Enviar</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
