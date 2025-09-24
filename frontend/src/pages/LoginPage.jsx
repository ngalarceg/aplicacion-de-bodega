import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import brandLogo from '../assets/chileatiende-logo.svg';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formValues, setFormValues] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formValues.email, formValues.password);
      const redirectPath = location.state?.from?.pathname || '/';
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <div className="auth-hero__brand">
          <img src={brandLogo} alt="ChileAtiende" />
          <span>Red de Atención a la Ciudadanía</span>
        </div>
        <div className="auth-hero__content">
          <h1>Gestión de Bodega ChileAtiende</h1>
          <p>
            Integra el control de inventario con la cercanía y transparencia del servicio
            ChileAtiende. Centraliza la información de equipos críticos y facilita la atención a
            funcionarias y funcionarios.
          </p>
          <ul className="auth-hero__list">
            <li>Inventario actualizado y trazable en todo momento.</li>
            <li>Asignaciones y devoluciones con respaldo documental.</li>
            <li>Experiencia de uso alineada a la identidad institucional.</li>
          </ul>
        </div>
        <div className="auth-hero__footer">
          <span>Ministerio de Desarrollo Social y Familia</span>
        </div>
      </section>

      <section className="auth-content">
        <form className="card auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__header">
            <img src={brandLogo} alt="Logotipo ChileAtiende" className="auth-form__logo" />
            <h2>Inicia sesión</h2>
            <p className="muted">Ingresa con tu correo corporativo y contraseña.</p>
          </div>

          <label>
            Correo electrónico
            <input
              type="email"
              name="email"
              value={formValues.email}
              onChange={handleChange}
              placeholder="nombre@institucion.cl"
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              name="password"
              value={formValues.password}
              onChange={handleChange}
              placeholder="Ingresa tu clave"
              required
            />
          </label>

          {error && (
            <p className="alert alert-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar al sistema'}
          </button>

          <p className="muted small-text auth-form__support">
            ¿Necesitas ayuda? Contáctanos mediante la mesa de servicios institucional o revisa el
            manual rápido de la plataforma.
          </p>
        </form>
      </section>
    </div>
  );
}

export default LoginPage;
