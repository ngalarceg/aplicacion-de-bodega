import { useState } from 'react';

const initialState = {
  name: '',
  description: '',
  type: 'PURCHASED',
  serialNumber: '',
  partNumber: '',
  inventoryNumber: '',
  rentalId: '',
  dispatchGuideId: '',
};

function ProductForm({ onSubmit, dispatchGuides, isSubmitting }) {
  const [values, setValues] = useState(initialState);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (event) => {
    const { value } = event.target;
    setValues((prev) => ({
      ...prev,
      type: value,
      rentalId: value === 'RENTAL' ? prev.rentalId : '',
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (values.type === 'RENTAL' && !values.rentalId) {
      setError('Debes ingresar el ID de arriendo.');
      return;
    }

    try {
      await onSubmit({
        name: values.name,
        description: values.description,
        type: values.type,
        serialNumber: values.serialNumber,
        partNumber: values.partNumber,
        inventoryNumber: values.type === 'PURCHASED' ? values.inventoryNumber : undefined,
        rentalId: values.type === 'RENTAL' ? values.rentalId : undefined,
        dispatchGuideId: values.dispatchGuideId || undefined,
      });
      setValues(initialState);
    } catch (submitError) {
      setError(submitError.message || 'No se pudo crear el producto');
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="card-header">
        <h2>Nuevo producto</h2>
        <p className="muted">Registra equipos provenientes de una compra o arriendo.</p>
      </div>
      <div className="form-grid">
        <label>
          Nombre
          <input name="name" value={values.name} onChange={handleChange} required />
        </label>
        <label>
          Descripción
          <input name="description" value={values.description} onChange={handleChange} />
        </label>
        <label>
          Tipo
          <select name="type" value={values.type} onChange={handleTypeChange}>
            <option value="PURCHASED">Compra</option>
            <option value="RENTAL">Arriendo</option>
          </select>
        </label>
        <label>
          N° de serie
          <input name="serialNumber" value={values.serialNumber} onChange={handleChange} required />
        </label>
        <label>
          N° de parte
          <input name="partNumber" value={values.partNumber} onChange={handleChange} required />
        </label>
        {values.type === 'PURCHASED' && (
          <label>
            N° de inventario (opcional)
            <input
              name="inventoryNumber"
              value={values.inventoryNumber}
              onChange={handleChange}
            />
          </label>
        )}
        {values.type === 'RENTAL' && (
          <label>
            ID de arriendo
            <input name="rentalId" value={values.rentalId} onChange={handleChange} required />
          </label>
        )}
        <label>
          Guía de despacho
          <select name="dispatchGuideId" value={values.dispatchGuideId} onChange={handleChange}>
            <option value="">Sin guía asociada</option>
            {dispatchGuides.map((guide) => (
              <option key={guide._id} value={guide._id}>
                {guide.guideNumber} — {new Date(guide.dispatchDate).toLocaleDateString('es-CL')}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="primary" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : 'Registrar producto'}
      </button>
    </form>
  );
}

ProductForm.defaultProps = {
  dispatchGuides: [],
  isSubmitting: false,
};

export default ProductForm;
