import React from 'react';

/** Penjaga render: kalau satu tampak crash, jangan layar putih — tawarkan muat ulang. */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Kesalahan tampilan aplikasi:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex flex-col justify-center items-center p-4 text-center">
        <div className="w-full max-w-[400px] bg-surface rounded-[28px] p-8 shadow-card border border-border space-y-4">
          <div className="w-12 h-12 mx-auto rounded-[14px] bg-alert-tint flex items-center justify-center text-alert font-black text-xl">
            !
          </div>
          <h1 className="text-lg font-black text-text">Terjadi kesalahan tampilan</h1>
          <p className="text-xs text-muted leading-relaxed">
            Aplikasi gagal menampilkan halaman ini. Data aman di cloud — muat ulang untuk kembali.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bk-btn primary w-full"
          >
            Muat Ulang Aplikasi
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
