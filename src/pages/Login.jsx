import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, KeyRound, QrCode, ArrowLeft } from 'lucide-react';

const Login = () => {
  const [step, setStep] = useState('credentials'); // credentials, totp_verify, totp_setup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [preAuthToken, setPreAuthToken] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [tempSecret, setTempSecret] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { loginStep1, verifyTOTP, setupTOTP } = useAuth();
  const navigate = useNavigate();

  /**
   * Step 1: Submit Credentials
   */
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await loginStep1(email, password);
      setPreAuthToken(result.preAuthToken);
      
      if (result.status === 'REQUIRES_SETUP') {
        setQrCodeDataUrl(result.qrCodeDataUrl);
        setTempSecret(result.secret);
        setStep('totp_setup');
      } else {
        setStep('totp_verify');
      }
    } catch (err) {
      setError(err.message || 'Error al validar credenciales');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Step 2 (Option A): Verify TOTP Code
   */
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await verifyTOTP(preAuthToken, totpCode);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Código de verificación incorrecto');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Step 2 (Option B): Confirm TOTP Setup
   */
  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      await setupTOTP(preAuthToken, totpCode, newPassword);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al validar el código 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset flow to credentials step
   */
  const handleBackToCredentials = () => {
    setStep('credentials');
    setTotpCode('');
    setPreAuthToken('');
    setQrCodeDataUrl('');
    setTempSecret('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[var(--color-nux-bg)] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Decorative ambient glowing background circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-nux-primary)]/10 rounded-full blur-[120px] pointer-events-none animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--color-nux-accent)]/10 rounded-full blur-[120px] pointer-events-none animate-float-delayed"></div>

      <div className="w-full max-w-md bg-[var(--color-nux-surface)]/80 backdrop-blur-xl border border-[var(--color-nux-border)] rounded-2xl p-8 shadow-[0_0_50px_rgba(124,58,237,0.15)] relative z-10 transition-all duration-300">
        
        {/* Step back navigation icon */}
        {step !== 'credentials' && (
          <button 
            onClick={handleBackToCredentials}
            className="absolute top-6 left-6 text-[var(--color-nux-text-muted)] hover:text-white transition-colors"
            title="Atrás"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-[var(--color-nux-primary)]/10 border border-[var(--color-nux-primary)]/30 rounded-full shadow-[0_0_20px_rgba(124,58,237,0.2)]">
              <Shield size={32} className="text-[var(--color-nux-primary)] animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-[var(--color-nux-primary)] to-[var(--color-nux-accent)] bg-clip-text text-transparent">
            NUXELIT
          </h1>
          <p className="text-[var(--color-nux-text-muted)] text-sm mt-1 uppercase tracking-widest font-semibold">
            Portal Privado de Administración
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm text-center font-medium animate-dribbble-pop">
            {error}
          </div>
        )}

        {/* Dynamic Forms Render */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--color-nux-text-muted)] mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                className="w-full bg-[var(--color-nux-bg)]/80 border border-[var(--color-nux-border)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-nux-primary)] focus:ring-1 focus:ring-[var(--color-nux-primary)] transition-all font-sans"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@nuxelit.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-nux-text-muted)] mb-2">
                Contraseña
              </label>
              <input
                type="password"
                required
                className="w-full bg-[var(--color-nux-bg)]/80 border border-[var(--color-nux-border)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-nux-primary)] focus:ring-1 focus:ring-[var(--color-nux-primary)] transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--color-nux-primary)] hover:bg-[var(--color-nux-primary-hover)] text-white font-bold py-3.5 rounded-lg transition-all shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_4px_25px_rgba(124,58,237,0.5)] active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span>Validando...</span>
              ) : (
                <>
                  <KeyRound size={18} />
                  <span>Continuar</span>
                </>
              )}
            </button>
          </form>
        )}

        {step === 'totp_verify' && (
          <form onSubmit={handleVerifySubmit} className="space-y-6 animate-dribbble-pop">
            <div className="text-center mb-4">
              <h2 className="text-white font-bold text-lg">Verificación de 2 Factores</h2>
              <p className="text-[var(--color-nux-text-muted)] text-xs mt-1">
                Ingresa el código de 6 dígitos de tu aplicación autenticadora.
              </p>
            </div>

            <div>
              <input
                type="text"
                required
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
                className="w-full bg-[var(--color-nux-bg)]/80 border border-[var(--color-nux-border)] rounded-lg px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] text-white focus:outline-none focus:border-[var(--color-nux-primary)] focus:ring-1 focus:ring-[var(--color-nux-primary)] transition-all"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || totpCode.length !== 6}
              className="w-full bg-[var(--color-nux-primary)] hover:bg-[var(--color-nux-primary-hover)] text-white font-bold py-3.5 rounded-lg transition-all shadow-[0_4px_20px_rgba(124,58,237,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>
        )}

        {step === 'totp_setup' && (
          <form onSubmit={handleSetupSubmit} className="space-y-6 animate-dribbble-pop max-h-[80vh] overflow-y-auto custom-scrollbar pr-1">
            <div className="text-center">
              <h2 className="text-white font-bold text-lg flex items-center justify-center gap-2">
                <QrCode size={20} className="text-[var(--color-nux-accent)]" />
                Configurar Seguridad 2FA
              </h2>
              <p className="text-[var(--color-nux-text-muted)] text-xs mt-1">
                Es tu primer inicio de sesión. Escanea el código QR con Google Authenticator, Microsoft Authenticator o Authy.
              </p>
            </div>

            {/* Displaying QR Code from backend */}
            <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl border border-[var(--color-nux-border)] w-48 h-48 mx-auto shadow-inner relative group">
              <img src={qrCodeDataUrl} alt="Código QR 2FA" className="w-full h-full object-contain" />
            </div>

            <div className="text-center bg-[var(--color-nux-bg)]/80 border border-[var(--color-nux-border)] p-3 rounded-lg">
              <span className="block text-[10px] text-[var(--color-nux-text-muted)] uppercase tracking-wider">Clave secreta manual:</span>
              <span className="text-xs font-mono text-white select-all font-bold tracking-wider">{tempSecret}</span>
            </div>

            <div>
              <label className="block text-center text-xs font-medium text-[var(--color-nux-text-muted)] mb-2">
                Introduce el código de 6 dígitos generado:
              </label>
              <input
                type="text"
                required
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
                className="w-full bg-[var(--color-nux-bg)]/80 border border-[var(--color-nux-border)] rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-[0.3em] text-white focus:outline-none focus:border-[var(--color-nux-primary)] focus:ring-1 focus:ring-[var(--color-nux-primary)] transition-all"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                disabled={isLoading}
              />
            </div>

            <div className="border-t border-[var(--color-nux-border)] pt-4 space-y-4">
              <span className="block text-center text-xs font-bold text-white uppercase tracking-wider">
                Establecer Contraseña Definitiva
              </span>
              
              <div>
                <label className="block text-xs font-medium text-[var(--color-nux-text-muted)] mb-1.5">
                  Nueva Contraseña (mínimo 8 caracteres)
                </label>
                <input
                  type="password"
                  required
                  className="w-full bg-[var(--color-nux-bg)]/80 border border-[var(--color-nux-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-nux-primary)] transition-all text-xs"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nueva contraseña"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-nux-text-muted)] mb-1.5">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  required
                  className="w-full bg-[var(--color-nux-bg)]/80 border border-[var(--color-nux-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-nux-primary)] transition-all text-xs"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar contraseña"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || totpCode.length !== 6}
              className="w-full bg-[var(--color-nux-accent)] hover:bg-[var(--color-nux-accent)]/80 text-white font-bold py-3.5 rounded-lg transition-all shadow-[0_4px_20px_rgba(6,182,212,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? 'Habilitando...' : 'Verificar y Registrar'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;
