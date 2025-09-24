import { useCallback, useEffect, useState } from 'react';
import ProductForm from '../components/ProductForm';
import { useAuth } from '../hooks/useAuth';

function ProductEntryPage() {
  const { request, hasRole } = useAuth();
  const [dispatchGuides, setDispatchGuides] = useState([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [guidesError, setGuidesError] = useState('');
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const canManage = hasRole('ADMIN', 'MANAGER');

  const loadDispatchGuides = useCallback(async () => {
    setLoadingGuides(true);
    setGuidesError('');
    try {
      const guides = await request('/dispatch-guides');
      setDispatchGuides(guides);
    } catch (error) {
      setGuidesError(error.message || 'No se pudieron obtener las guías de despacho.');
      setDispatchGuides([]);
    } finally {
      setLoadingGuides(false);
    }
  }, [request]);

  useEffect(() => {
    if (canManage) {
      loadDispatchGuides();
    }
  }, [loadDispatchGuides, canManage]);

  const handleCreateProduct = useCallback(
    async (payload) => {
      setCreatingProduct(true);
      setSuccessMessage('');
      try {
        await request('/products', {
          method: 'POST',
          data: payload,
        });
        setSuccessMessage('Producto registrado correctamente.');
      } catch (error) {
        setSuccessMessage('');
        throw error;
      } finally {
        setCreatingProduct(false);
      }
    },
    [request]
  );

  if (!canManage) {
    return (
      <section className="dashboard-section">
        <div className="card">
          <h2>Ingresar producto</h2>
          <p className="muted">
            Solo los administradores o encargados pueden registrar nuevos productos.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div>
          <h2>Ingresar producto</h2>
          <p className="muted">
            Registra equipos nuevos y asócialos a la guía de despacho correspondiente.
          </p>
        </div>
        <div className="section-actions">
          <button
            type="button"
            className="secondary"
            onClick={loadDispatchGuides}
            disabled={loadingGuides}
          >
            {loadingGuides ? 'Actualizando...' : 'Actualizar guías'}
          </button>
        </div>
      </div>

      {guidesError && (
        <div className="card">
          <strong>Error:</strong> {guidesError}
        </div>
      )}

      {successMessage && (
        <div className="card success-card">
          <strong>Éxito:</strong> {successMessage}
        </div>
      )}

      <ProductForm
        onSubmit={handleCreateProduct}
        dispatchGuides={dispatchGuides}
        isSubmitting={creatingProduct}
      />
    </section>
  );
}

export default ProductEntryPage;
