export interface HospitalData {
  id: string;
  nombre: string;
  especialidad: string;
  copago: number;
  distancia_km: number;
  calificacion: number;
  en_red: boolean;
  recomendado?: boolean;
}

export const HospitalCard = ({ data }: { data: HospitalData }) => {
  return (
    <div 
      className={`p-4 rounded-xl border bg-white flex flex-col gap-3 relative overflow-hidden transition-all 
      ${data.recomendado 
        ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' 
        : 'border-gray-200 shadow-sm hover:border-gray-300'
      }`}
    >
      {data.recomendado && (
        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
          🏆 Mejor Opción
        </div>
      )}
      <div className="flex justify-between items-start pt-1">
        <div className="pr-10">
          <h3 className="font-bold text-slate-800 text-lg leading-tight">{data.nombre}</h3>
          <p className="text-sm text-gray-500 capitalize">{data.especialidad}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap 
          ${data.en_red ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {data.en_red ? '✅ En Red' : '⚠️ Fuera de red'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-2 border-t border-gray-100 pt-3">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 mb-1">Copago Estimado</span>
          <span className={`font-bold text-xl ${data.recomendado ? 'text-blue-700' : 'text-slate-800'}`}>
            ${data.copago}
          </span>
        </div>
        <div className="flex flex-col border-l border-gray-100 pl-3">
          <span className="text-xs text-gray-500 mb-1">Distancia</span>
          <span className="font-semibold text-slate-700 text-sm mt-auto">{data.distancia_km} km</span>
        </div>
        <div className="flex flex-col border-l border-gray-100 pl-3">
          <span className="text-xs text-gray-500 mb-1">Rating</span>
          <span className="font-semibold text-slate-700 text-sm mt-auto">⭐ {data.calificacion}</span>
        </div>
      </div>
    </div>
  );
};