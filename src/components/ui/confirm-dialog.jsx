import { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ConfirmDialogContext = createContext(null);

/**
 * confirm({ title, message, confirmText, cancelText, variant })
 * variant: "default" | "destructive" (destructive = زرار أحمر لإجراءات الحذف/الرفض)
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

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      <Dialog open={!!options} onOpenChange={(open) => { if (!open) close(false); }}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{options?.title}</DialogTitle>
            <DialogDescription>{options?.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => close(false)}
              className={cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0")}>
              {options?.cancelText}
            </button>
            <button
              onClick={() => close(true)}
              className={buttonVariants({ variant: options?.variant === "destructive" ? "destructive" : "default" })}>
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
