import { useState, useEffect } from "react";
import { Warehouse } from "lucide-react";
import api from "@/api/axios";

export default function UnitPhoto({
  unit,
  className = "w-full h-36 object-cover",
  placeholderClassName = "w-full h-36 bg-muted/50 flex items-center justify-center",
  iconClassName = "w-10 h-10 text-muted-foreground/30",
}) {
  const [blobUrl, setBlobUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = unit?.image_url;

  useEffect(() => {
    // Cleanup previous blob URL
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  useEffect(() => {
    if (!src) {
      setBlobUrl("");
      setFailed(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFailed(false);

    api
      .get(src, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        const contentType = res.headers["content-type"] || "";
        // If the response is not an image (e.g. ngrok warning HTML page), treat as failed
        if (!contentType.startsWith("image")) {
          setFailed(true);
          setLoading(false);
          return;
        }
        const url = URL.createObjectURL(res.data);
        setBlobUrl(url);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (blobUrl && !failed) {
    return (
      <img
        src={blobUrl}
        alt={unit?.unit_number || ""}
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }

  if (loading) {
    return (
      <div className={placeholderClassName}>
        <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={placeholderClassName}>
      <Warehouse className={iconClassName} />
    </div>
  );
}
