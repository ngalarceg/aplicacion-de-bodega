import { useCallback, useEffect, useMemo, useState } from 'react';
import AssignmentHistory from '../components/AssignmentHistory';
import DispatchGuideManager from '../components/DispatchGuideManager';
import ProductAssignmentPanel from '../components/ProductAssignmentPanel';
import ProductForm from '../components/ProductForm';
import ProductTable from '../components/ProductTable';
import { getApiUrl } from '../api/client';
import { useAuth } from '../hooks/useAuth';

function Dashboard() {
  const { user, token, logout, hasRole, request } = useAuth();
  const [products, setProducts] = useState([]);
  const [productsError, setProductsError] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dispatchGuides, setDispatchGuides] = useState([]);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [assignmentProcessing, setAssignmentProcessing] = useState(false);
  const [uploadingGuide, setUploadingGuide] = useState(false);
  const [adUsers, setAdUsers] = useState([]);
  const [adError, setAdError] = useState('');

  const canManage = hasRole('ADMIN', 'MANAGER');
  const canAccessGuides = canManage;

  const selectedProduct = useMemo(
    () => products.find((product) => product._id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    setProductsError('');
    try {
      const data = await request('/products');
      setProducts(data);
      setSelectedProductId((current) => {
        if (!data.length) {
          return null;
        }
        if (!current) {
          return data[0]._id;
        }
        return data.some((item) => item._id === current) ? current : data[0]._id;
      });
    } catch (error) {
      setProductsError(error.message || 'No se pudo obtener el inventario.');
    } finally {
      setLoadingProducts(false);
    }
  }, [request]);

  const loadAssignmentHistory = useCallback(
    async (productId) => {
      if (!productId) {
        setAssignmentHistory([]);
        return;
      }
      setHistoryLoading(true);
      try {
        const history = await request(`/products/${productId}/assignments`);
        setAssignmentHistory(history);
      } catch (error) {
        setAssignmentHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    [request]
  );

  const loadDispatchGuides = useCallback(async () => {
    if (!canAccessGuides) {
      return;
    }
    setGuidesLoading(true);
    try {
      const guides = await request('/dispatch-guides');
      setDispatchGuides(guides);
    } catch (error) {
      console.error('No se pudieron cargar las guías de despacho', error);
    } finally {
      setGuidesLoading(false);
    }
  }, [canAccessGuides, request]);

  const loadAdUsers = useCallback(async () => {
    if (!canManage) {
      setAdUsers([]);
      return;
    }
    try {
      const users = await request('/ad/users');
      setAdUsers(users);
      setAdError('');
    } catch (error) {
      setAdError('No se pudieron sincronizar los usuarios de Active Directory simulado.');
      setAdUsers([]);
    }
  }, [canManage, request]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (selectedProductId) {
      loadAssignmentHistory(selectedProductId);
    } else {
      setAssignmentHistory([]);
    }
  }, [selectedProductId, loadAssignmentHistory]);

  useEffect(() => {
    loadDispatchGuides();
    loadAdUsers();
  }, [loadDispatchGuides, loadAdUsers]);

  const handleCreateProduct = useCallback(
    async (payload) => {
      setCreatingProduct(true);
      try {
        await request('/products', {
          method: 'POST',
          data: payload,
        });
        await loadProducts();
      } finally {
        setCreatingProduct(false);
      }
    },
    [request, loadProducts]
  );

  const handleAssignProduct = useCallback(
    async (payload) => {
      if (!selectedProductId) {
        return;
      }
      setAssignmentProcessing(true);
      try {
        await request(`/products/${selectedProductId}/assign`, {
          method: 'POST',
          data: payload,
        });
        await loadProducts();
        await loadAssignmentHistory(selectedProductId);
      } finally {
        setAssignmentProcessing(false);
      }
    },
    [request, selectedProductId, loadProducts, loadAssignmentHistory]
  );

  const handleUnassignProduct = useCallback(
    async (payload) => {
      if (!selectedProductId) {
        return;
      }
      setAssignmentProcessing(true);
      try {
        await request(`/products/${selectedProductId}/unassign`, {
          method: 'POST',
          data: payload,
        });
        await loadProducts();
        await loadAssignmentHistory(selectedProductId);
      } finally {
        setAssignmentProcessing(false);
      }
    },
    [request, selectedProductId, loadProducts, loadAssignmentHistory]
  );

  const handleUploadGuide = useCallback(
    async (formData) => {
      setUploadingGuide(true);
      try {
        await request('/dispatch-guides', {
          method: 'POST',
          formData,
        });
        await loadDispatchGuides();
      } finally {
        setUploadingGuide(false);
      }
    },
    [request, loadDispatchGuides]
  );

  const handleDownloadGuide = useCallback(
    async (guide) => {
      try {
        const response = await fetch(`${getApiUrl()}/dispatch-guides/${guide._id}/download`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('No se pudo descargar el archivo.');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = guide.fileName || `${guide.guideNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        alert(error.message || 'No se pudo descargar la guía.');
      }
    },
    [token]
  );

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Bienvenido, {user.name}</h1>
          <p className="muted">Rol: {user.role}</p>
        </div>
        <button type="button" className="logout" onClick={logout}>
          Cerrar sesión
        </button>
      </header>

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Inventario general</h2>
            <p className="muted">Revisa el stock total disponible en bodega.</p>
          </div>
          <div className="section-actions">
            <button
              type="button"
              className="secondary"
              onClick={loadProducts}
              disabled={loadingProducts}
            >
              {loadingProducts ? 'Actualizando...' : 'Actualizar stock'}
            </button>
          </div>
        </div>

        {productsError && (
          <div className="card">
            <strong>Error:</strong> {productsError}
          </div>
        )}

        <ProductTable
          products={products}
          onSelect={setSelectedProductId}
          selectedProductId={selectedProductId}
        />
      </section>

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Asignaciones</h2>
            <p className="muted">
              Gestiona la entrega de equipos y revisa el historial de movimientos.
            </p>
          </div>
        </div>

        {adError && canManage && (
          <div className="card">
            <strong>Advertencia:</strong> {adError}
          </div>
        )}

        <div className="dashboard-grid">
          <ProductAssignmentPanel
            product={selectedProduct}
            onAssign={handleAssignProduct}
            onUnassign={handleUnassignProduct}
            adUsers={adUsers}
            isProcessing={assignmentProcessing}
            canManage={canManage}
          />
          <AssignmentHistory history={assignmentHistory} loading={historyLoading} />
        </div>
      </section>

      {canManage && (
        <section className="dashboard-section">
          <div className="section-header">
            <div>
              <h2>Ingresos</h2>
              <p className="muted">
                Registra nuevos equipos y respáldalos con su guía de despacho.
              </p>
            </div>
          </div>

          <div className="dashboard-grid secondary">
            <ProductForm
              onSubmit={handleCreateProduct}
              dispatchGuides={dispatchGuides}
              isSubmitting={creatingProduct}
            />
            {canAccessGuides && (
              <DispatchGuideManager
                guides={dispatchGuides}
                onUpload={handleUploadGuide}
                onRefresh={loadDispatchGuides}
                onDownload={handleDownloadGuide}
                isUploading={uploadingGuide || guidesLoading}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default Dashboard;
