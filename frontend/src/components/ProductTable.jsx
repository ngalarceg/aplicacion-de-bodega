function formatType(type) {
  if (type === 'PURCHASED') {
    return 'Compra';
  }
  if (type === 'RENTAL') {
    return 'Arriendo';
  }
  return type;
}

function ProductTable({ products, onSelect, selectedProductId }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Detalle de inventario</h3>
        <p className="muted">Selecciona un producto para ver sus detalles y gestionar asignaciones.</p>
      </div>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>N° serie</th>
              <th>N° parte</th>
              <th>Inventario / ID</th>
              <th>Guía</th>
              <th>Asignación actual</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  Aún no hay productos registrados.
                </td>
              </tr>
            )}
            {products.map((product) => {
              const isSelected = product._id === selectedProductId;
              return (
                <tr
                  key={product._id}
                  className={isSelected ? 'selected' : ''}
                  onClick={() => onSelect(product._id)}
                >
                  <td>{product.name}</td>
                  <td>{formatType(product.type)}</td>
                  <td>{product.serialNumber}</td>
                  <td>{product.partNumber}</td>
                  <td>
                    {product.type === 'PURCHASED'
                      ? product.inventoryNumber || '—'
                      : product.rentalId}
                  </td>
                  <td>{product.dispatchGuide?.guideNumber || '—'}</td>
                  <td>
                    {product.currentAssignment ? (
                      <span>
                        {product.currentAssignment.assignedTo}{' '}
                        <span className="muted">({product.currentAssignment.location})</span>
                      </span>
                    ) : (
                      <span className="status success">Disponible</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductTable;
