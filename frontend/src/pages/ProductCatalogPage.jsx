import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const initialFormState = {
  name: '',
  partNumber: '',
  description: '',
};

function ProductCatalogPage() {
  const { request, hasRole } = useAuth();
  const canManage = hasRole('ADMIN', 'MANAGER');

  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formValues, setFormValues] = useState(initialFormState);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sortedModels = useMemo(
    () =>
      [...models].sort((a, b) => {
        const nameComparison = a.name.localeCompare(b.name, 'es');
        if (nameComparison !== 0) {
          return nameComparison;
        }
        return a.partNumber.localeCompare(b.partNumber, 'es');
      }),
    [models]
  );

  const loadModels = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await request('/product-models');
      setModels(data);
    } catch (err) {
      setModels([]);
      setError(err.message || 'No se pudieron obtener los modelos registrados.');
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (canManage) {
      loadModels();
    }
  }, [canManage, loadModels]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!formValues.name.trim() || !formValues.partNumber.trim()) {
      setFormError('Completa el nombre y el número de parte.');
      return;
    }

    setSubmitting(true);
    try {
      await request('/product-models', {
        method: 'POST',
        data: {
          name: formValues.name.trim(),
          partNumber: formValues.partNumber.trim(),
          description: formValues.description.trim() || undefined,
        },
      });
      setFormValues(initialFormState);
      await loadModels();
    } catch (err) {
      setFormError(err.message || 'No se pudo registrar el modelo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManage) {
    return (
      <section className="dashboard-section">
        <div className="card">
          <h2>Catálogo de productos</h2>
          <p className="muted">
            Solo los administradores o encargados pueden administrar el catálogo de productos.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div>
          <h2>Catálogo de productos</h2>
          <p className="muted">
            Define los modelos disponibles para evitar duplicidades al registrar unidades nuevas.
          </p>
        </div>
        <div className="section-actions">
          <button type="button" className="secondary" onClick={loadModels} disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar catálogo'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="dashboard-grid secondary">
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-header">
            <h3>Nuevo modelo</h3>
            <p className="muted">
              Ingresa el nombre y número de parte del producto que se utilizará al registrar unidades.
            </p>
          </div>
          <div className="form-grid">
            <label>
              Nombre
              <input
                name="name"
                value={formValues.name}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Número de parte
              <input
                name="partNumber"
                value={formValues.partNumber}
                onChange={handleChange}
                required
              />
            </label>
            <label className="full-width">
              Descripción
              <textarea
                name="description"
                value={formValues.description}
                onChange={handleChange}
                rows={3}
                placeholder="Opcional"
              />
            </label>
          </div>
          {formError && <p className="error">{formError}</p>}
          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Registrar modelo'}
          </button>
          <p className="muted small-text">
            Luego podrás seleccionar estos modelos al ingresar unidades en{' '}
            <Link to="/productos/nuevo">Ingresar producto</Link>.
          </p>
        </form>

        <div className="card">
          <div className="card-header">
            <h3>Modelos registrados</h3>
            <p className="muted">Listado de productos disponibles para asignar en el inventario.</p>
          </div>
          <div className="table-responsive">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>N° de parte</th>
                  <th>Descripción</th>
                  <th>Creado</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4} className="muted">
                      Cargando catálogo...
                    </td>
                  </tr>
                )}
                {!loading && sortedModels.length === 0 && (
                  <tr>
                    <td colSpan={4} className="muted">
                      Aún no hay modelos registrados.
                    </td>
                  </tr>
                )}
                {sortedModels.map((model) => (
                  <tr key={model._id}>
                    <td>{model.name}</td>
                    <td>{model.partNumber}</td>
                    <td>{model.description || '—'}</td>
                    <td>{new Date(model.createdAt).toLocaleDateString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductCatalogPage;
