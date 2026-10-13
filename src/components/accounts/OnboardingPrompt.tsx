import { Cloud, ShieldCheck, ArrowRight } from "lucide-react";

interface OnboardingPromptProps {
  onConnectDrive: (provider: string) => void;
}

export function OnboardingPrompt({ onConnectDrive }: OnboardingPromptProps) {
  return (
    <section className="p-8 rounded-2xl border border-neutral-800 bg-neutral-900/40 flex flex-col items-center text-center gap-6">
      <div className="max-w-md">
        <h3 className="text-xl font-bold tracking-tight text-white">
          Initialize Your Cloud Vault
        </h3>
        <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
          Baulr connects your existing free cloud storage tiers into one unified virtual
          drive with zero monthly fees. Connect at least one account to start offloading.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        <button
          onClick={() => onConnectDrive("gdrive")}
          className="p-4 rounded-xl border border-neutral-800 hover:border-amber-500/40 bg-neutral-900/60 hover:bg-amber-500/5 flex flex-col items-start text-left gap-3 transition cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-sm text-neutral-200 group-hover:text-white flex items-center gap-1.5">
              <span>Google Drive</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">15 GB free storage</p>
          </div>
        </button>

        <button
          onClick={() => onConnectDrive("onedrive")}
          className="p-4 rounded-xl border border-neutral-800 hover:border-sky-500/40 bg-neutral-900/60 hover:bg-sky-500/5 flex flex-col items-start text-left gap-3 transition cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-sm text-neutral-200 group-hover:text-white flex items-center gap-1.5">
              <span>OneDrive</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">5 GB free storage</p>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-neutral-400 pt-1">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Direct loopback OAuth. Tokens never leave your local machine.</span>
      </div>
    </section>
  );
}
