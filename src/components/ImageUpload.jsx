import { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, X } from "lucide-react";

export default function ImageUpload({ value, onChange, label = "Upload", shape = "square", size = "h-24 w-24" }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      onChange(file_url);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${size} relative overflow-hidden glass flex items-center justify-center ${shape === "circle" ? "rounded-full" : "rounded-xl"}`}
      >
        {value ? (
          <>
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-black/80"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : busy ? (
          <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
        ) : (
          <Upload className="h-5 w-5 text-white/40" />
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm text-amber-400 hover:text-amber-300 font-medium"
        >
          {label}
        </button>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handle} />
      </div>
    </div>
  );
}