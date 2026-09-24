function Hoy() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-brand">Hoy</h1>
        <p className="text-gray-500 mt-1">Gestiones urgentes del día</p>

        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-10 text-center">
          <p className="text-gray-400 text-sm">
            Aquí se mostrarán las gestiones vencidas, de hoy y próximas (Sprint 2).
          </p>
        </div>
      </div>
    </div>
  );
}

export default Hoy;