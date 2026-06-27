'use client';

type Props = {
  loading?: boolean;
  error?: string | null;
  folioError?: string | null;
  cashError?: string | null;
};

export function ReceptionLoading({ loading, error, folioError, cashError }: Props) {
  if (!loading && !error && !folioError && !cashError) return null;
  return (
    <div className="roomio-reception-status" role="status">
      {loading ? <p className="roomio-page-desc">Rezervasyonlar yükleniyor…</p> : null}
      {error ? <p className="roomio-text-warn" role="alert">{error}</p> : null}
      {folioError ? <p className="roomio-text-warn" role="alert">Folyo bakiyeleri: {folioError}</p> : null}
      {cashError ? <p className="roomio-text-warn" role="alert">Kasa: {cashError}</p> : null}
    </div>
  );
}
