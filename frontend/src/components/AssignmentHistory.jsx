function AssignmentHistory({ history, loading }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Historial de asignaciones</h3>
      </div>
      <div className="table-responsive">
        <table className="data-table compact">
          <thead>
            <tr>
              <th>Acción</th>
              <th>Usuario asignado</th>
              <th>Cuenta AD</th>
              <th>Ubicación</th>
              <th>Fecha</th>
              <th>Registrado por</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="muted">
                  Cargando movimientos...
                </td>
              </tr>
            )}
            {!loading && history.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  No hay movimientos registrados.
                </td>
              </tr>
            )}
            {history.map((item) => (
              <tr key={item._id}>
                <td>
                  <span className={item.action === 'ASSIGN' ? 'status info' : 'status warning'}>
                    {item.action === 'ASSIGN' ? 'Asignación' : 'Desasignación'}
                  </span>
                </td>
                <td>{item.assignedTo}</td>
                <td>{item.assignedToAdAccount}</td>
                <td>{item.location}</td>
                <td>{new Date(item.assignmentDate).toLocaleString('es-CL')}</td>
                <td>{item.performedBy?.name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

AssignmentHistory.defaultProps = {
  history: [],
  loading: false,
};

export default AssignmentHistory;
