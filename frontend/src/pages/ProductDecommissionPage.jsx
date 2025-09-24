import { useCallback, useEffect, useMemo, useState } from 'react';
import ProductTable from '../components/ProductTable';
import { useAuth } from '../hooks/useAuth';
import { getProductStatusBadge, getProductStatusLabel } from '../utils/productStatus';

function ProductDecommissionPage() {
  const { request, hasRole } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canManage = hasRole('ADMIN', 'MANAGER');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await request('/products');
      setProducts(data);
    } catch (err) {
      setError(err.message || 'No se pudo obtener el inventario.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (canManage) {
      loadProducts();
    }
  }, [loadProducts, canManage]);

  const activeProducts = useMemo(
    () => products.filter((product) => product.status !== 'DECOMMISSIONED'),
    [products]
  );

  const decommissionedProducts = useMemo(
    () => products.filter((product) => product.status === 'DECOMMISSIONED'),
    [products]
  );

  useEffect(() => {
    setSelectedProductId((current) => {
      if (!activeProducts.length) {
        return null;
      }
      if (current && activeProducts.some((item) => item._id === current)) {
        return current;
      }
      return activeProducts[0]._id;
    });
  }, [activeProducts]);

  const selectedProduct = useMemo(
    () => activeProducts.find((product) => product._id === selectedProductId) || null,
    [activeProducts, selectedProductId]
  );

  useEffect(() => {
    setReason('');
    setFormError('');
  }, [selectedProductId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!selectedProduct) {
      setFormError('Selecciona un producto disponible.');
      return;
    }

    if (selectedProduct.status !== 'AVAILABLE') {
      setFormError('Debes liberar la asignación antes de dar de baja este producto.');
      return;
    }

    if (!reason.trim()) {
      setFormError('Indica el motivo de la baja.');
      return;
    }

    setSubmitting(true);
    try {
      await request(`/products/${selectedProduct._id}/decommission`, {
        method: 'POST',
        data: { reason: reason.trim() },
      });
      setReason('');
      await loadProducts();
    } catch (submitError) {
      setFormError(submitError.message || 'No se pudo dar de baja el producto.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManage) {
    return (
      <section className="dashboard-section">
        <div className="card">
          <h2>Dar de baja productos</h2>
          <p className="muted">Solo los administradores o encargados pueden dar de baja equipos.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div>
          <h2>Dar de baja productos</h2>
          <p className="muted">Registra la baja de equipos e indica el motivo correspondiente.</p>
        </div>
        <div className="section-actions">
          <button type="button" className="secondary" onClick={loadProducts} disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar inventario'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="dashboard-grid secondary">
        <ProductTable
          products={activeProducts}
          onSelect={setSelectedProductId}
          selectedProductId={selectedProductId}
        />
        <div className="card">
          <div className="card-header">
            <h3>Baja de inventario</h3>
            <p className="muted">
              Selecciona un producto disponible y detalla el motivo de la baja.
            </p>
          </div>

          {!selectedProduct && (
            <p className="muted">No hay productos disponibles para dar de baja.</p>
          )}

          {selectedProduct && (
            <form className="form-grid" onSubmit={handleSubmit}>
              <div className="full-width">
                <strong>{selectedProduct.name}</strong>{' '}
                <span className="muted">({selectedProduct.serialNumber})</span>
              </div>
              <div className="full-width">
                <span className={getProductStatusBadge(selectedProduct.status)}>
                  {getProductStatusLabel(selectedProduct.status)}
                </span>
              </div>
              {selectedProduct.status === 'ASSIGNED' && selectedProduct.currentAssignment && (
                <div className="full-width muted small-text">
                  Actualmente asignado a {selectedProduct.currentAssignment.assignedTo} en{' '}
                  {selectedProduct.currentAssignment.location}.
                </div>
              )}
              <label className="full-width">
                Motivo
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={4}
                  placeholder="Describe la razón de la baja"
                  disabled={selectedProduct.status !== 'AVAILABLE'}
                />
              </label>
              {formError && <p className="error">{formError}</p>}
              <button
                type="submit"
                className="danger"
                disabled={submitting || selectedProduct.status !== 'AVAILABLE'}
              >
                {submitting ? 'Registrando...' : 'Registrar baja'}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Historial de bajas</h3>
          <p className="muted">Consulta los equipos dados de baja y su motivo.</p>
        </div>
        <div className="table-responsive">
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Producto</th>
                <th>N° serie</th>
                <th>Motivo</th>
                <th>Registrado</th>
              </tr>
            </thead>
            <tbody>
              {decommissionedProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    Aún no se registran bajas.
                  </td>
                </tr>
              )}
              {decommissionedProducts.map((product) => (
                <tr key={product._id}>
                  <td>{product.name}</td>
                  <td>{product.serialNumber}</td>
                  <td>{product.decommissionReason || '—'}</td>
                  <td>
                    {product.decommissionedAt
                      ? new Date(product.decommissionedAt).toLocaleString('es-CL')
                      : '—'}
                    {product.decommissionedBy?.name ? ` · ${product.decommissionedBy.name}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default ProductDecommissionPage;
