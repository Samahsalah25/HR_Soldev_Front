// import { createContext, useContext, useState, useCallback, useRef } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogFooter,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import { buttonVariants } from "@/components/ui/button";
// import { cn } from "@/lib/utils";

// const ConfirmDialogContext = createContext(null);

// /**
//  * confirm({ title, message, confirmText, cancelText, variant })
//  * variant: "default" | "destructive" (destructive = زرار أحمر لإجراءات الحذف/الرفض)
//  * بترجع Promise<boolean> — true لو المستخدم أكد، false لو ألغى (بما فيها الدوس برة المربع أو Esc)
//  *
//  * مبني على Dialog العادي (مش AlertDialog) عشان يقفل لما تدوس برة المربع —
//  * Radix بيمنع ده بالقوة (preventDefault) جوه AlertDialogContent.
//  */
// export function ConfirmDialogProvider({ children }) {
//   const [options, setOptions] = useState(null);
//   const resolveRef = useRef(null);

//   const confirm = useCallback((opts = {}) => {
//     return new Promise((resolve) => {
//       resolveRef.current = resolve;
//       setOptions({
//         title: opts.title || "تأكيد الإجراء",
//         message: opts.message || "هل أنت متأكد؟",
//         confirmText: opts.confirmText || "تأكيد",
//         cancelText: opts.cancelText || "إلغاء",
//         variant: opts.variant || "default",
//       });
//     });
//   }, []);

//   const close = (result) => {
//     resolveRef.current?.(result);
//     resolveRef.current = null;
//     setOptions(null);
//   };

//   return (
//     <ConfirmDialogContext.Provider value={confirm}>
//       {children}
//       <Dialog open={!!options} onOpenChange={(open) => { if (!open) close(false); }}>
//         <DialogContent dir="rtl">
//           <DialogHeader>
//             <DialogTitle>{options?.title}</DialogTitle>
//             <DialogDescription>{options?.message}</DialogDescription>
//           </DialogHeader>
//           <DialogFooter>
//             <button
//               onClick={() => close(false)}
//               className={cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0")}>
//               {options?.cancelText}
//             </button>
//             <button
//               onClick={() => close(true)}
//               className={buttonVariants({ variant: options?.variant === "destructive" ? "destructive" : "default" })}>
//               {options?.confirmText}
//             </button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </ConfirmDialogContext.Provider>
//   );
// }

// export function useConfirm() {
//   const ctx = useContext(ConfirmDialogContext);
//   if (!ctx) throw new Error("useConfirm لازم يتستخدم جوه ConfirmDialogProvider");
//   return ctx;
// }

import { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle, ShieldCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ConfirmDialogContext = createContext(null);

const VARIANT_STYLES = {
  default: {
    ring: "ring-primary/15",
    iconWrap: "bg-primary/10 text-primary",
    Icon: ShieldCheck,
    confirmBtn: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20",
  },
  destructive: {
    ring: "ring-red-500/15",
    iconWrap: "bg-red-500/10 text-red-600",
    Icon: XCircle,
    confirmBtn: "bg-red-600 text-white hover:bg-red-700 shadow-red-500/20",
  },
  warning: {
    ring: "ring-amber-500/15",
    iconWrap: "bg-amber-500/10 text-amber-600",
    Icon: AlertTriangle,
    confirmBtn: "bg-amber-600 text-white hover:bg-amber-700 shadow-amber-500/20",
  },
};

/**
 * confirm({ title, message, confirmText, cancelText, variant })
 * variant: "default" | "destructive" | "warning"
 * بترجع Promise<boolean> — true لو المستخدم أكد، false لو ألغى (بما فيها الدوس برة المربع أو Esc)
 *
 * مبني على Dialog العادي (مش AlertDialog) عشان يقفل لما تدوس برة المربع —
 * Radix بيمنع ده بالقوة (preventDefault) جوه AlertDialogContent.
 */
export function ConfirmDialogProvider({ children }) {
  const [options, setOptions] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setOptions({
        title: opts.title || "تأكيد الإجراء",
        message: opts.message || "هل أنت متأكد؟",
        confirmText: opts.confirmText || "تأكيد",
        cancelText: opts.cancelText || "إلغاء",
        variant: opts.variant || "default",
      });
    });
  }, []);

  const close = (result) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setOptions(null);
  };

  const style = VARIANT_STYLES[options?.variant] || VARIANT_STYLES.default;
  const Icon = style.Icon;

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      <Dialog open={!!options} onOpenChange={(open) => { if (!open) close(false); }}>
        <DialogContent
          dir="rtl"
          className={cn(
            "max-w-[490px] rounded-3xl p-0 overflow-hidden border-0 shadow-2xl ring-1",
            style.ring
          )}
        >
          <div className="px-8 pt-8 pb-6 text-center">
            <div className={cn("w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4", style.iconWrap)}>
              <Icon className="w-7 h-7" strokeWidth={2} />
            </div>

            <DialogHeader className="space-y-0">
              <DialogTitle className="text-lg font-bold text-foreground text-center">
                {options?.title}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground text-center mt-2 leading-relaxed px-2">
                {options?.message}
              </DialogDescription>
            </DialogHeader>
          </div>

          <DialogFooter className="flex-row gap-2 px-8 pb-8 sm:justify-center">
            <button
              onClick={() => close(false)}
              className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-muted text-foreground hover:bg-muted/70 transition-colors"
            >
              {options?.cancelText}
            </button>
            <button
              onClick={() => close(true)}
              className={cn(
                "flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all shadow-lg active:scale-[0.98]",
                style.confirmBtn
              )}
            >
              {options?.confirmText}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) throw new Error("useConfirm لازم يتستخدم جوه ConfirmDialogProvider");
  return ctx;
}