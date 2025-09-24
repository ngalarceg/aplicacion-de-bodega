import { useCallback, useEffect, useMemo, useState } from 'react';
import ProductTable from '../components/ProductTable';
import { useAuth } from '../hooks/useAuth';
import { getProductStatusBadge, getProductStatusLabel } from '../utils/productStatus';

const STATUS_FILTERS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'AVAILABLE', label: 'Disponibles' },
  { value: 'ASSIGNED', label: 'Asignados' },
  { value: 'DECOMMISSIONED', label: 'Dados de baja' },
];

function formatType(type) {
  if (type === 'PURCHASED') {
    return 'Compra';
  }
  if (type === 'RENTAL') {
    return 'Arriendo';
  }
  return type;
}

function InventoryPage() {
  const { request, hasRole } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleting, setDeleting] = useState(false);

  const canManage = hasRole('ADMIN', 'MANAGER');

  const applyFilter = useCallback(
    (list, filterValue = statusFilter) => {
      if (filterValue === 'ALL') {
        return list;
      }
      return list.filter((item) => item.status === filterValue);
    },
    [statusFilter]
  );

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await request('/products');
      setProducts(data);
      const filtered = applyFilter(data);
      setSelectedProductId((current) => {
        if (!filtered.length) {
          return null;
        }
        if (current && filtered.some((item) => item._id === current)) {
          return current;
        }
        return filtered[0]._id;
      });
    } catch (err) {
      setError(err.message || 'No se pudo obtener el inventario.');
    } finally {
      setLoading(false);
    }
  }, [request, applyFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => applyFilter(products), [products, applyFilter]);

  const selectedProduct = useMemo(
    () => products.find((product) => product._id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const handleFilterChange = (event) => {
    const value = event.target.value;
    setStatusFilter(value);
    setSelectedProductId((current) => {
      const filtered = applyFilter(products, value);
      if (!filtered.length) {
        return null;
      }
      if (current && filtered.some((item) => item._id === current)) {
        return current;
      }
      return filtered[0]._id;
    });
  };

  const handleDeleteProduct = useCallback(async () => {
    if (!selectedProduct || !canManage) {
      return;
    }

    if (selectedProduct.status === 'ASSIGNED') {
      alert('Debes liberar la asignación antes de eliminar el producto.');
      return;
    }

    const confirmed = window.confirm(
      '¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.'
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    try {
      await request(`/products/${selectedProduct._id}`, { method: 'DELETE' });
      await loadProducts();
    } catch (err) {
      alert(err.message || 'No se pudo eliminar el producto.');
    } finally {
      setDeleting(false);
    }
  }, [selectedProduct, canManage, request, loadProducts]);

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div>
          <h2>Inventario</h2>
          <p className="muted">Consulta el detalle de los productos registrados en bodega.</p>
        </div>
        <div className="section-actions">
          <label className="inline-filter">
            Estado
            <select value={statusFilter} onChange={handleFilterChange}>
              {STATUS_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="secondary" onClick={loadProducts} disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="dashboard-grid">
        <ProductTable
          products={filteredProducts}
          onSelect={setSelectedProductId}
          selectedProductId={selectedProductId}
        />
        <div className="card">
          <div className="card-header">
            <h3>Detalle del producto</h3>
            <p className="muted">
              {selectedProduct
                ? `Registrado el ${new Date(selectedProduct.createdAt).toLocaleDateString('es-CL')}`
                : 'Selecciona un producto para ver su detalle.'}
            </p>
          </div>

          {!selectedProduct && <p className="muted">No hay productos que coincidan con el filtro.</p>}

          {selectedProduct && (
            <>
              <div className="detail-grid">
                <div>
                  <strong>Nombre:</strong> {selectedProduct.name}
                </div>
                <div>
                  <strong>Tipo:</strong> {formatType(selectedProduct.type)}
                </div>
                <div>
                  <strong>N° serie:</strong> {selectedProduct.serialNumber}
                </div>
                <div>
                  <strong>N° parte:</strong> {selectedProduct.partNumber}
                </div>
                {selectedProduct.type === 'PURCHASED' ? (
                  <div>
                    <strong>N° inventario:</strong> {selectedProduct.inventoryNumber || '—'}
                  </div>
                ) : (
                  <div>
                    <strong>ID arriendo:</strong> {selectedProduct.rentalId}
                  </div>
                )}
                <div>
                  <strong>Guía:</strong> {selectedProduct.dispatchGuide?.guideNumber || '—'}
                </div>
                {selectedProduct.description && (
                  <div className="full-row">
                    <strong>Descripción:</strong> {selectedProduct.description}
                  </div>
                )}
                <div className="full-row">
                  <strong>Estado:</strong>{' '}
                  <span className={getProductStatusBadge(selectedProduct.status)}>
                    {getProductStatusLabel(selectedProduct.status)}
                  </span>
                </div>
              </div>

              {selectedProduct.status === 'ASSIGNED' && selectedProduct.currentAssignment && (
                <div className="assignment-box">
                  <p>
                    <strong>{selectedProduct.currentAssignment.assignedTo}</strong> ·{' '}
                    {selectedProduct.currentAssignment.assignedToAdAccount}
                  </p>
                  <p className="muted">
                    Ubicación: {selectedProduct.currentAssignment.location} ·{' '}
                    {new Date(
                      selectedProduct.currentAssignment.assignmentDate
                    ).toLocaleString('es-CL')}
                  </p>
                </div>
              )}

              {selectedProduct.status === 'DECOMMISSIONED' && (
                <div className="assignment-box">
                  <p>
                    <strong>Motivo de baja:</strong> {selectedProduct.decommissionReason}
                  </p>
                  <p className="muted">
                    Registrado el{' '}
                    {selectedProduct.decommissionedAt
                      ? new Date(selectedProduct.decommissionedAt).toLocaleString('es-CL')
                      : '—'}
                    {selectedProduct.decommissionedBy?.name
                      ? ` · Por ${selectedProduct.decommissionedBy.name}`
                      : ''}
                  </p>
                </div>
              )}

              {canManage && (
                <div className="section-actions">
                  <button
                    type="button"
                    className="danger"
                    onClick={handleDeleteProduct}
                    disabled={deleting || selectedProduct.status === 'ASSIGNED'}
                  >
                    {deleting ? 'Eliminando...' : 'Eliminar producto'}
                  </button>
                </div>
              )}
              {canManage && selectedProduct.status === 'ASSIGNED' && (
                <p className="muted small-text">
                  Debes liberar la asignación antes de eliminar el producto.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default InventoryPage;
