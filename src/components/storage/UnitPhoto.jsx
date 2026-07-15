import { useState } from "react";
import { Warehouse } from "lucide-react";

export default function UnitPhoto({
  unit,
  className = "w-full h-36 object-cover",
  placeholderClassName = "w-full h-36 bg-muted/50 flex items-center justify-center",
  iconClassName = "w-10 h-10 text-muted-foreground/30",
}) {
  const [failed, setFailed] = useState(false);
  const src = unit?.image_url;

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={unit?.unit_number || ""}
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={placeholderClassName}>
      <Warehouse className={iconClassName} />
    </div>
  );
}
