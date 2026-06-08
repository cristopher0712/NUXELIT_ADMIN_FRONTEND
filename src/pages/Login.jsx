import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { KeyRound, QrCode, ArrowLeft, Mail, Lock, Cpu, Globe, Activity, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import LogoMark from '../components/brand/LogoMark';

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

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    <div className="min-h-screen bg-[var(--color-nux-bg)] grid grid-cols-1 lg:grid-cols-12 relative overflow-hidden select-none">
      
      {/* Visual Side (Left Column) - Hidden on Mobile */}
      <div className="hidden lg:flex lg:col-span-6 bg-[var(--color-nux-bg)] relative overflow-hidden flex-col justify-between p-12 border-r border-[var(--color-nux-border)]/50">
        {/* Decorative ambient glowing background circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-nux-primary)]/10 rounded-full blur-[120px] pointer-events-none animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--color-nux-accent)]/10 rounded-full blur-[120px] pointer-events-none animate-float-delayed"></div>
        
        {/* Tech Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

        {/* Top Brand Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <LogoMark size={36} />
          <span className="font-sans font-black tracking-[0.2em] text-white text-lg">NUXELIT</span>
        </div>

        {/* Middle Tech Message */}
        <div className="my-auto relative z-10 max-w-md">
          <span className="text-xs uppercase tracking-[0.25em] text-[var(--color-nux-primary)] font-bold mb-3 block">Consola de Control</span>
          <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Acceso de Seguridad para el Portal de Administración
          </h2>
          <p className="text-[var(--color-nux-text-muted)] leading-relaxed text-sm mb-8">
            Plataforma protegida con cifrado AES-256 y autenticación de doble factor (2FA). Las operaciones realizadas en esta consola quedan registradas en la bitácora de auditoría.
          </p>

          {/* System info tags */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-[var(--color-nux-surface)]/40 border border-[var(--color-nux-border)]/50 rounded-xl flex items-center gap-3">
              <Activity size={18} className="text-emerald-400" />
              <div>
                <span className="block text-[10px] text-[var(--color-nux-text-muted)] uppercase tracking-wider">Estado del Sistema</span>
                <span className="text-xs text-white font-bold">ONLINE / ESTABLE</span>
              </div>
            </div>
            <div className="p-4 bg-[var(--color-nux-surface)]/40 border border-[var(--color-nux-border)]/50 rounded-xl flex items-center gap-3">
              <Cpu size={18} className="text-[var(--color-nux-accent)]" />
              <div>
                <span className="block text-[10px] text-[var(--color-nux-text-muted)] uppercase tracking-wider">Cifrado de Sesión</span>
                <span className="text-xs text-white font-bold">AES-256 GCM</span>
              </div>
            </div>
          </div>

          {/* Simulated Terminal Audit Stream */}
          <div className="p-5 bg-black/50 border border-[var(--color-nux-border)]/60 rounded-xl font-mono text-[11px] text-emerald-400/80 space-y-1.5 shadow-[inset_0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-[var(--color-nux-border)]/40 pb-2 mb-3 text-[var(--color-nux-text-muted)] text-[10px]">
              <span className="flex items-center gap-1.5 font-sans uppercase font-bold tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Security Feed Live
              </span>
              <span className="font-sans">SSL / TLS 1.3</span>
            </div>
            <p className="opacity-90"><span className="text-[var(--color-nux-text-muted)]">[08:44:02]</span> Initializing Nuxelit Control Gateway v2.4...</p>
            <p className="text-cyan-400"><span className="text-[var(--color-nux-text-muted)]">[08:44:03]</span> Session handshake completed successfully.</p>
            <p className="text-white/60"><span className="text-[var(--color-nux-text-muted)]">[08:44:03]</span> Secure node connection verified via port 443.</p>
            <p className="text-[var(--color-nux-primary)]"><span className="text-[var(--color-nux-text-muted)]">[08:44:04]</span> Audit daemon actively logging terminal queries.</p>
            <p className="animate-pulse"><span className="text-[var(--color-nux-text-muted)]">[08:44:05]</span> Awaiting secure administrator credentials...</p>
          </div>
        </div>

        {/* Bottom micro copy */}
        <div className="flex justify-between items-center text-[10px] text-[var(--color-nux-text-muted)] uppercase tracking-wider relative z-10">
          <span>© {new Date().getFullYear()} NUXELIT Corp.</span>
          <span>Nivel de Acceso: Administrador</span>
        </div>
      </div>

      {/* Form Side (Right Column) */}
      <div className="lg:col-span-6 flex flex-col justify-center p-6 md:p-12 relative z-10 w-full min-h-screen">
        {/* Decorative background glows for mobile layout */}
        <div className="lg:hidden absolute top-1/4 left-1/4 w-80 h-80 bg-[var(--color-nux-primary)]/10 rounded-full blur-[100px] pointer-events-none animate-float"></div>
        <div className="lg:hidden absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--color-nux-accent)]/10 rounded-full blur-[100px] pointer-events-none animate-float-delayed"></div>

        <div className="w-full max-w-md mx-auto relative">
          
          {/* Floating back button */}
          {step !== 'credentials' && (
            <button 
              onClick={handleBackToCredentials}
              className="absolute -top-12 left-0 text-[var(--color-nux-text-muted)] hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
              title="Atrás"
            >
              <ArrowLeft size={16} />
              <span>Atrás</span>
            </button>
          )}

          {/* Main glassmorphic card */}
          <div className="bg-[var(--color-nux-surface)]/60 backdrop-blur-xl border border-[var(--color-nux-border)]/65 rounded-2xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.4)] relative overflow-hidden transition-all duration-300">
            
            {/* Glow effect on top-right border */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-nux-primary)]/15 rounded-full blur-2xl pointer-events-none"></div>

            {/* Small header brand logo for mobile view */}
            <div className="flex justify-center mb-6 lg:hidden">
              <div className="p-1 border border-[var(--color-nux-primary)]/30 rounded-2xl shadow-[0_0_20px_rgba(99,45,225,0.2)]">
                <LogoMark size={48} />
              </div>
            </div>

            {/* Header Title */}
            <div className="text-center lg:text-left mb-8">
              <h1 className="text-2xl font-extrabold text-white tracking-tight uppercase">
                {step === 'credentials' && 'Iniciar Sesión'}
                {step === 'totp_verify' && 'Verificación 2FA'}
                {step === 'totp_setup' && 'Configurar 2FA'}
              </h1>
              <p className="text-[var(--color-nux-text-muted)] text-xs mt-1">
                {step === 'credentials' && 'Introduce tus credenciales para acceder.'}
                {step === 'totp_verify' && 'Ingresa el código de 6 dígitos de tu autenticador.'}
                {step === 'totp_setup' && 'Escanea el código QR y establece tu nueva contraseña.'}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/25 text-red-400 p-3 rounded-lg mb-6 text-xs text-center font-medium animate-dribbble-pop flex items-center justify-center gap-2">
                <ShieldAlert size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Credentials Form */}
            {step === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-6">
                <div className="relative group">
                  <label className="block text-xs font-semibold text-[var(--color-nux-text-muted)] mb-2 uppercase tracking-wider">
                    Correo Electrónico
                  </label>
                  <div className="relative flex items-center">
                    <Mail size={16} className="absolute left-3 text-[var(--color-nux-text-muted)] group-focus-within:text-[var(--color-nux-primary)] transition-colors" />
                    <input
                      type="email"
                      required
                      className="w-full bg-[var(--color-nux-bg)]/60 border border-[var(--color-nux-border)] rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[var(--color-nux-primary)] focus:ring-1 focus:ring-[var(--color-nux-primary)] transition-all font-sans text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="relative group">
                  <label className="block text-xs font-semibold text-[var(--color-nux-text-muted)] mb-2 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={16} className="absolute left-3 text-[var(--color-nux-text-muted)] group-focus-within:text-[var(--color-nux-primary)] transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full bg-[var(--color-nux-bg)]/60 border border-[var(--color-nux-border)] rounded-lg pl-10 pr-10 py-3 text-white focus:outline-none focus:border-[var(--color-nux-primary)] focus:ring-1 focus:ring-[var(--color-nux-primary)] transition-all text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-[var(--color-nux-text-muted)] hover:text-white transition-colors cursor-pointer"
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative overflow-hidden group bg-[var(--color-nux-primary)] hover:bg-[var(--color-nux-primary-hover)] text-white font-bold py-3.5 rounded-lg transition-all shadow-[0_4px_20px_rgba(99,45,225,0.3)] hover:shadow-[0_4px_25px_rgba(99,45,225,0.5)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                  {isLoading ? (
                    <span>Validando Acceso...</span>
                  ) : (
                    <>
                      <KeyRound size={16} />
                      <span>Ingresar</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TOTP Verify Form */}
            {step === 'totp_verify' && (
              <form onSubmit={handleVerifySubmit} className="space-y-6 animate-dribbble-pop">
                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    className="w-full bg-[var(--color-nux-bg)]/80 border border-[var(--color-nux-border)] rounded-lg px-4 py-4 text-center text-3xl font-mono tracking-[0.4em] text-white focus:outline-none focus:border-[var(--color-nux-primary)] focus:ring-1 focus:ring-[var(--color-nux-primary)] transition-all"
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
                  className="w-full relative overflow-hidden group bg-[var(--color-nux-primary)] hover:bg-[var(--color-nux-primary-hover)] text-white font-bold py-3.5 rounded-lg transition-all shadow-[0_4px_20px_rgba(99,45,225,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                  {isLoading ? 'Verificando Código...' : 'Confirmar Código'}
                </button>
              </form>
            )}

            {/* TOTP Setup Form */}
            {step === 'totp_setup' && (
              <form onSubmit={handleSetupSubmit} className="space-y-6 animate-dribbble-pop max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
                {/* Displaying QR Code from backend */}
                <div className="flex flex-col items-center justify-center bg-white p-3 rounded-xl border border-[var(--color-nux-border)] w-44 h-44 mx-auto shadow-lg relative group">
                  <img src={qrCodeDataUrl} alt="Código QR 2FA" className="w-full h-full object-contain" />
                </div>

                <div className="text-center bg-[var(--color-nux-bg)]/80 border border-[var(--color-nux-border)] p-3 rounded-lg">
                  <span className="block text-[9px] text-[var(--color-nux-text-muted)] uppercase tracking-wider">Clave secreta manual:</span>
                  <span className="text-xs font-mono text-white select-all font-bold tracking-wider">{tempSecret}</span>
                </div>

                <div>
                  <label className="block text-center text-xs font-semibold text-[var(--color-nux-text-muted)] mb-2 uppercase tracking-wider">
                    Introduce el código de 6 dígitos:
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

                <div className="border-t border-[var(--color-nux-border)]/50 pt-4 space-y-4">
                  <span className="block text-center text-xs font-bold text-white uppercase tracking-wider">
                    Nueva Contraseña Definitiva
                  </span>
                  
                  <div className="relative group">
                    <label className="block text-[10px] font-semibold text-[var(--color-nux-text-muted)] mb-1.5 uppercase tracking-wider">
                      Nueva Contraseña (mínimo 8 caracteres)
                    </label>
                    <div className="relative flex items-center">
                      <Lock size={14} className="absolute left-3 text-[var(--color-nux-text-muted)] group-focus-within:text-[var(--color-nux-primary)] transition-colors" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        className="w-full bg-[var(--color-nux-bg)]/60 border border-[var(--color-nux-border)] rounded-lg pl-9 pr-9 py-2 text-white focus:outline-none focus:border-[var(--color-nux-primary)] transition-all text-xs"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 text-[var(--color-nux-text-muted)] hover:text-white transition-colors cursor-pointer"
                        tabIndex="-1"
                      >
                        {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="relative group">
                    <label className="block text-[10px] font-semibold text-[var(--color-nux-text-muted)] mb-1.5 uppercase tracking-wider">
                      Confirmar Contraseña
                    </label>
                    <div className="relative flex items-center">
                      <Lock size={14} className="absolute left-3 text-[var(--color-nux-text-muted)] group-focus-within:text-[var(--color-nux-primary)] transition-colors" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        className="w-full bg-[var(--color-nux-bg)]/60 border border-[var(--color-nux-border)] rounded-lg pl-9 pr-9 py-2 text-white focus:outline-none focus:border-[var(--color-nux-primary)] transition-all text-xs"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 text-[var(--color-nux-text-muted)] hover:text-white transition-colors cursor-pointer"
                        tabIndex="-1"
                      >
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || totpCode.length !== 6}
                  className="w-full relative overflow-hidden group bg-[var(--color-nux-accent)] hover:bg-[var(--color-nux-accent)]/80 text-white font-bold py-3.5 rounded-lg transition-all shadow-[0_4px_20px_rgba(6,182,212,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                  {isLoading ? 'Habilitando...' : 'Verificar y Registrar'}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Login;
