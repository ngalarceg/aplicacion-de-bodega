import { useEffect, useState } from 'react';
import { getProductStatusBadge, getProductStatusLabel, isDecommissioned } from '../utils/productStatus';

const emptyState = {
  assignedTo: '',
  location: '',
  assignmentDate: '',
  notes: '',
};

function ProductAssignmentPanel({
  product,
  onAssign,
  onUnassign,
  isProcessing,
  canManage,
}) {
  const [values, setValues] = useState(emptyState);
  const [error, setError] = useState('');

  useEffect(() => {
    setValues(emptyState);
    setError('');
  }, [product?._id]);

  if (!product) {
    return (
      <div className="card">
        <div className="card-header">
          <h3>Detalles del producto</h3>
        </div>
        <p className="muted">Selecciona un producto para ver sus detalles.</p>
      </div>
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssign = async (event) => {
    event.preventDefault();
    setError('');

    if (isProductDecommissioned) {
      setError('Este producto está dado de baja y no puede asignarse.');
      return;
    }

    if (!values.assignedTo || !values.location) {
      setError('Completa los campos obligatorios.');
      return;
    }

    try {
      await onAssign({
        assignedTo: values.assignedTo,
        location: values.location,
        assignmentDate: values.assignmentDate || undefined,
        notes: values.notes || undefined,
      });
      setValues(emptyState);
    } catch (assignError) {
      setError(assignError.message || 'No se pudo asignar el producto.');
    }
  };

  const handleUnassign = async () => {
    setError('');

    if (isProductDecommissioned) {
      setError('El producto está dado de baja.');
      return;
    }

    try {
      await onUnassign({
        location: values.location || product.currentAssignment?.location,
        notes: values.notes || undefined,
      });
      setValues(emptyState);
    } catch (assignError) {
      setError(assignError.message || 'No se pudo desasignar el producto.');
    }
  };

  const isProductDecommissioned = product ? isDecommissioned(product.status) : false;
  const currentAssignment = product.currentAssignment;
  const productName = product.productModel?.name || product.name;
  const productPartNumber = product.productModel?.partNumber || product.partNumber;
  const productDescription = product.productModel?.description ?? product.description ?? '';

  return (
    <div className="card">
      <div className="card-header">
        <h3>Detalles del producto</h3>
        <p className="muted">
          {product.type === 'PURCHASED' ? 'Equipo adquirido' : 'Equipo en arriendo'} — creado el{' '}
          {new Date(product.createdAt).toLocaleDateString('es-CL')}
        </p>
      </div>

      <div className="detail-grid">
        <div>
          <strong>Nombre:</strong> {productName}
        </div>
        <div>
          <strong>N° serie:</strong> {product.serialNumber}
        </div>
        <div>
          <strong>N° parte:</strong> {productPartNumber}
        </div>
        <div>
          <strong>{product.type === 'PURCHASED' ? 'Inventario' : 'ID arriendo'}:</strong>{' '}
          {product.type === 'PURCHASED' ? product.inventoryNumber || '—' : product.rentalId}
        </div>
        <div>
          <strong>Guía:</strong> {product.dispatchGuide?.guideNumber || '—'}
        </div>
        <div>
          <strong>Estado:</strong>{' '}
          <span className={getProductStatusBadge(product.status)}>
            {getProductStatusLabel(product.status)}
          </span>
        </div>
        {productDescription && (
          <div className="full-width muted small-text">
            <strong>Descripción:</strong> {productDescription}
          </div>
        )}
        {isProductDecommissioned && product.decommissionReason && (
          <div className="muted small-text">
            Motivo de baja: {product.decommissionReason}
          </div>
        )}
      </div>

      <section className="assignment-section">
        <h4>Asignación actual</h4>
        {currentAssignment ? (
          <div className="assignment-box">
            <p>
              <strong>{currentAssignment.assignedTo}</strong>
            </p>
            <p className="muted">
              Ubicación: {currentAssignment.location} ·{' '}
              {new Date(currentAssignment.assignmentDate).toLocaleString('es-CL')}
            </p>
            {canManage && (
              <button
                type="button"
                className="secondary"
                onClick={handleUnassign}
                disabled={isProcessing || isProductDecommissioned}
              >
                {isProcessing ? 'Procesando...' : 'Liberar'}
              </button>
            )}
          </div>
        ) : isProductDecommissioned ? (
          <p className="muted">El producto está dado de baja.</p>
        ) : (
          <p className="muted">El producto está disponible.</p>
        )}
      </section>

      <section>
        <h4>{currentAssignment ? 'Reasignar producto' : 'Asignar producto'}</h4>
        {isProductDecommissioned ? (
          <p className="muted">Este producto está dado de baja y no puede asignarse.</p>
        ) : canManage ? (
            <form className="form-grid" onSubmit={handleAssign}>
              <label>
                Usuario
              <input
                name="assignedTo"
                value={values.assignedTo}
                onChange={handleChange}
                placeholder="Nombre del colaborador"
                required
              />
              </label>
              <label>
                Ubicación
              <input
                name="location"
                value={values.location}
                onChange={handleChange}
                placeholder="Ej: Oficina Santiago"
                required
              />
            </label>
            <label>
              Fecha de asignación
              <input
                type="datetime-local"
                name="assignmentDate"
                value={values.assignmentDate}
                onChange={handleChange}
              />
            </label>
            <label className="full-width">
              Notas
              <textarea
                name="notes"
                value={values.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Comentarios adicionales"
              />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="primary" disabled={isProcessing}>
              {isProcessing
                ? 'Procesando...'
                : currentAssignment
                ? 'Actualizar asignación'
                : 'Asignar'}
            </button>
          </form>
        ) : (
          <p className="muted">
            Solo los usuarios con rol administrador o encargado pueden gestionar asignaciones.
          </p>
        )}
      </section>
    </div>
  );
}

ProductAssignmentPanel.defaultProps = {
  product: null,
  isProcessing: false,
  onAssign: () => Promise.resolve(),
  onUnassign: () => Promise.resolve(),
  canManage: false,
};

export default ProductAssignmentPanel;
