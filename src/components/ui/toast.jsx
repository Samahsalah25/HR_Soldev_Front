// import * as React from "react";
// import { cva } from "class-variance-authority";
// import { X } from "lucide-react";
// import { cn } from "@/lib/utils";

// const ToastProvider = React.forwardRef(({ ...props }, ref) => (
//   <div
//     ref={ref}
//     className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
//     {...props}
//   />
// ));
// ToastProvider.displayName = "ToastProvider";

// const ToastViewport = React.forwardRef(({ ...props }, ref) => (
//   <div
//     ref={ref}
//     className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
//     {...props}
//   />
// ));
// ToastViewport.displayName = "ToastViewport";

// const toastVariants = cva(
//   "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
//   {
//     variants: {
//       variant: {
//         default: "border bg-background text-foreground",
//         destructive:
//           "border-destructive bg-destructive text-destructive-foreground",
//       },
//     },
//     defaultVariants: {
//       variant: "default",
//     },
//   }
// );

// const Toast = React.forwardRef(
//   ({ className, variant, ...props }, ref) => {
//     return (
//       <div
//         ref={ref}
//         className={cn(toastVariants({ variant }), className)}
//         {...props}
//       />
//     );
//   }
// );
// Toast.displayName = "Toast";

// const ToastAction = React.forwardRef(
//   ({ className, ...props }, ref) => (
//     <button
//       ref={ref}
//       className={cn(
//         "inline-flex h-8 shrink-0 items-center justify-center rounded-md border px-3 text-sm font-medium",
//         className
//       )}
//       {...props}
//     />
//   )
// );
// ToastAction.displayName = "ToastAction";

// const ToastClose = React.forwardRef(
//   ({ className, ...props }, ref) => (
//     <button
//       ref={ref}
//       className={cn(
//         "absolute right-2 top-2 rounded-md p-1 text-foreground/50 hover:text-foreground",
//         className
//       )}
//       {...props}
//     >
//       <X className="h-4 w-4" />
//     </button>
//   )
// );
// ToastClose.displayName = "ToastClose";

// const ToastTitle = React.forwardRef(
//   ({ className, ...props }, ref) => (
//     <div
//       ref={ref}
//       className={cn("text-sm font-semibold", className)}
//       {...props}
//     />
//   )
// );
// ToastTitle.displayName = "ToastTitle";

// const ToastDescription = React.forwardRef(
//   ({ className, ...props }, ref) => (
//     <div
//       ref={ref}
//       className={cn("text-sm opacity-90", className)}
//       {...props}
//     />
//   )
// );
// ToastDescription.displayName = "ToastDescription";

// export {
//   ToastProvider,
//   ToastViewport,
//   Toast,
//   ToastTitle,
//   ToastDescription,
//   ToastClose,
//   ToastAction,
// };


// toast.jsx
import * as React from "react";
import { cva } from "class-variance-authority";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastProvider = ({ children }) => <>{children}</>;

// اتنقلت لتحت + محاذاة يمين (تقدري تغيريها لـ sm:left-6 لو عايزاها شمال)
const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed bottom-6 right-6 z-[100] flex max-h-screen w-full flex-col-reverse gap-3 sm:max-w-[380px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = "ToastViewport";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border-r-4 bg-white p-4 pr-5 shadow-xl shadow-black/10 transition-all duration-300 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-4",
  {
    variants: {
      variant: {
        default: "border-slate-400",
        destructive: "border-rose-500",
        success: "border-emerald-500",
        warning: "border-amber-500",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const iconMap = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
};

const badgeColorMap = {
  default: "bg-slate-100 text-slate-600",
  destructive: "bg-rose-100 text-rose-600",
  success: "bg-emerald-100 text-emerald-600",
  warning: "bg-amber-100 text-amber-600",
};

const progressColorMap = {
  default: "bg-slate-400",
  destructive: "bg-rose-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
};

const Toast = React.forwardRef(
  ({ className, variant = "default", duration = 4000, ...props }, ref) => {
    const Icon = iconMap[variant] || Info;

    return (
      <div ref={ref} className={cn(toastVariants({ variant }), className)} {...props}>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", badgeColorMap[variant])}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0 pt-0.5">{props.children}</div>

        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-100 overflow-hidden">
          <div
            className={cn("h-full", progressColorMap[variant])}
            style={{ animation: `toast-progress ${duration}ms linear forwards` }}
          />
        </div>
      </div>
    );
  }
);
Toast.displayName = "Toast";

const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border px-3 text-sm font-medium",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = "ToastAction";

const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors",
      className
    )}
    {...props}
  >
    <X className="h-4 w-4" />
  </button>
));
ToastClose.displayName = "ToastClose";

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm font-bold leading-tight text-slate-800", className)} {...props} />
));
ToastTitle.displayName = "ToastTitle";

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm text-slate-500 mt-0.5 leading-snug", className)} {...props} />
));
ToastDescription.displayName = "ToastDescription";

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};