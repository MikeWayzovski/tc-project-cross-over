import React from 'react';
import ModusIcon from '../Modus/ModusIcon';

const LoginScreen = ({
  isLoading,
  isCallback,
  isConfigured,
  error,
  onLogin,
}) => {
  const title = isCallback ? 'Aanmelden afronden' : isLoading ? 'Sessie controleren' : 'Inloggen';
  const body = isCallback
    ? 'Je Trimble ID-aanmelding wordt afgerond. Dit duurt even.'
    : isLoading
      ? 'We kijken of je nog bent aangemeld.'
      : 'Log in met je Trimble ID om projecten, gebruikers en groepen te beheren.';

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-3">
      <div className="card shadow-sm border-0" style={{ maxWidth: '28rem', width: '100%' }}>
        <div className="card-body p-4 text-center">
          <ModusIcon name="shield-check" type="duotone" size="48px" extraClasses="text-primary mb-3" />
          <h1 className="h4 fw-bold mb-2">{title}</h1>
          <p className="text-muted mb-4">{body}</p>

          {error && (
            <div className="alert alert-danger text-start small" role="alert">
              Aanmelden is niet gelukt. {error}
            </div>
          )}

          {!isConfigured && !isLoading && (
            <div className="alert alert-warning text-start small" role="alert">
              Trimble ID is niet geconfigureerd voor deze build. Open de app vanuit Trimble Connect,
              of zet de VITE_ configuratie in de deployment.
            </div>
          )}

          {(isLoading || isCallback) && (
            <div className="d-flex justify-content-center mb-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Bezig</span>
              </div>
            </div>
          )}

          {!isLoading && !isCallback && (
            <button
              type="button"
              className="btn btn-primary d-inline-flex align-items-center"
              onClick={onLogin}
              disabled={!isConfigured}
            >
              <ModusIcon name="person" type="duotone" size="18px" extraClasses="me-2" />
              Inloggen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
