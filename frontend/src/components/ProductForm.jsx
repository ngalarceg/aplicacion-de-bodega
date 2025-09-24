import { useEffect, useMemo, useState } from 'react';

const initialState = {
  productModelId: '',
  type: 'PURCHASED',
  serialNumber: '',
  inventoryNumber: '',
  rentalId: '',
  dispatchGuideId: '',
};

function ProductForm({ onSubmit, dispatchGuides, productModels, isSubmitting }) {
  const [values, setValues] = useState(initialState);
  const [error, setError] = useState('');
  const hasDispatchGuides = dispatchGuides.length > 0;
  const hasProductModels = productModels.length > 0;
  const selectedModel = useMemo(
    () => productModels.find((model) => model._id === values.productModelId) || null,
    [productModels, values.productModelId]
  );

  useEffect(() => {
    setValues((prev) => {
      if (!dispatchGuides.length) {
        if (!prev.dispatchGuideId) {
          return prev;
        }
        return { ...prev, dispatchGuideId: '' };
      }

      if (prev.dispatchGuideId && dispatchGuides.some((guide) => guide._id === prev.dispatchGuideId)) {
        return prev;
      }

      return { ...prev, dispatchGuideId: dispatchGuides[0]._id };
    });
  }, [dispatchGuides]);

  useEffect(() => {
    setValues((prev) => {
      if (!productModels.length) {
        if (!prev.productModelId) {
          return prev;
        }
        return { ...prev, productModelId: '' };
      }

      if (prev.productModelId && productModels.some((model) => model._id === prev.productModelId)) {
        return prev;
      }

      return { ...prev, productModelId: productModels[0]._id };
    });
  }, [productModels]);

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

    if (!values.productModelId) {
      setError('Selecciona el modelo de producto.');
      return;
    }

    if (values.type === 'RENTAL' && !values.rentalId) {
      setError('Debes ingresar el ID de arriendo.');
      return;
    }

    if (!values.dispatchGuideId) {
      setError('Selecciona la guía de despacho correspondiente al ingreso.');
      return;
    }

    try {
      await onSubmit({
        productModelId: values.productModelId,
        type: values.type,
        serialNumber: values.serialNumber,
        inventoryNumber: values.type === 'PURCHASED' ? values.inventoryNumber : undefined,
        rentalId: values.type === 'RENTAL' ? values.rentalId : undefined,
        dispatchGuideId: values.dispatchGuideId,
      });
      setValues(initialState);
    } catch (submitError) {
      setError(submitError.message || 'No se pudo crear el producto');
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="card-header">
        <h3>Nuevo producto</h3>
        <p className="muted">
          Registra equipos provenientes de una compra o arriendo y vincúlalos con su guía de despacho.
        </p>
      </div>
      {(!hasDispatchGuides || !hasProductModels) && (
        <p className="muted small-text">
          {hasProductModels
            ? 'Primero carga una guía de despacho para habilitar el registro de productos.'
            : 'Primero registra un modelo en el catálogo para habilitar el ingreso de productos.'}
        </p>
      )}
      <div className="form-grid">
        <label className="full-width">
          Modelo de producto
          <select
            name="productModelId"
            value={values.productModelId}
            onChange={handleChange}
            required
            disabled={!hasProductModels}
          >
            {productModels.map((model) => (
              <option key={model._id} value={model._id}>
                {model.name} — {model.partNumber}
              </option>
            ))}
          </select>
        </label>
        {selectedModel?.description && (
          <div className="full-width muted small-text">
            <strong>Descripción:</strong> {selectedModel.description}
          </div>
        )}
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
          <select
            name="dispatchGuideId"
            value={values.dispatchGuideId}
            onChange={handleChange}
            required
            disabled={!hasDispatchGuides}
          >
            {dispatchGuides.map((guide) => (
              <option key={guide._id} value={guide._id}>
                {guide.guideNumber} — {new Date(guide.dispatchDate).toLocaleDateString('es-CL')}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      <button
        type="submit"
        className="primary"
        disabled={isSubmitting || !hasDispatchGuides || !hasProductModels}
      >
        {isSubmitting ? 'Guardando...' : 'Registrar producto'}
      </button>
    </form>
  );
}

ProductForm.defaultProps = {
  dispatchGuides: [],
  productModels: [],
  isSubmitting: false,
};

export default ProductForm;
