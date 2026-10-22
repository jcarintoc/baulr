export const PROVIDER_ICON_MAP: Record<string, string> = {
  gdrive: "/providers/google-drive.svg",
  google: "/providers/google-drive.svg",
  "google-drive": "/providers/google-drive.svg",
  drive: "/providers/google-drive.svg",
  onedrive: "/providers/onedrive.svg",
  microsoft: "/providers/onedrive.svg",
  dropbox: "/providers/dropbox.svg",
  box: "/providers/box.svg",
  blomp: "/providers/blomp.webp",
  drime: "/providers/drime.webp",
  filelu: "/providers/filelu.webp",
  filen: "/providers/filen.webp",
  huawei: "/providers/huawei.svg",
  icloud: "/providers/icloud.svg",
  apple: "/providers/icloud.svg",
  internxt: "/providers/internxt.webp",
  jottacloud: "/providers/jottacloud.webp",
  koofr: "/providers/koofr.webp",
  mega: "/providers/mega-icon.svg",
  opendrive: "/providers/opendrive.webp",
  pcloud: "/providers/pcloud.webp",
  pikpak: "/providers/pikpak.webp",
  proton: "/providers/proton-drive.webp",
  "proton-drive": "/providers/proton-drive.webp",
  protondrive: "/providers/proton-drive.webp",
  yandex: "/providers/yandex-360.webp",
  "yandex-360": "/providers/yandex-360.webp",
};

export function getProviderIconSrc(provider?: string | null): string | null {
  if (!provider) return null;
  const p = provider.toLowerCase().trim();
  if (PROVIDER_ICON_MAP[p]) return PROVIDER_ICON_MAP[p];
  for (const [key, src] of Object.entries(PROVIDER_ICON_MAP)) {
    if (p.includes(key)) return src;
  }
  return null;
}

export function ProviderIcon({
  provider,
  className = "size-5",
}: {
  provider?: string | null;
  className?: string;
}) {
  const src = getProviderIconSrc(provider);
  if (!src) return null;

  return (
    <img
      src={src}
      alt={provider ?? "Cloud Provider"}
      className={`object-contain shrink-0 ${className}`}
      loading="lazy"
    />
  );
}

export function GoogleDriveIcon({ className = "size-5" }: { className?: string }) {
  return <ProviderIcon provider="gdrive" className={className} />;
}

export function OneDriveIcon({ className = "size-5" }: { className?: string }) {
  return <ProviderIcon provider="onedrive" className={className} />;
}

export function DropboxIcon({ className = "size-5" }: { className?: string }) {
  return <ProviderIcon provider="dropbox" className={className} />;
}

export function BoxIcon({ className = "size-5" }: { className?: string }) {
  return <ProviderIcon provider="box" className={className} />;
}
