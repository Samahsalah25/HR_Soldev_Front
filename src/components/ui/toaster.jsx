// import { useToast } from "@/components/ui/use-toast";
// import {
//   Toast,
//   ToastClose,
//   ToastDescription,
//   ToastProvider,
//   ToastTitle,
//   ToastViewport,
// } from "@/components/ui/toast";

// export function Toaster() {
//   const { toasts, dismiss } = useToast();

//   return (
//     <ToastProvider>
//       {toasts.map(function ({ id, title, description, action, ...props }) {
//         return (
//           <Toast key={id} {...props}>
//             <div className="grid gap-1">
//               {title && <ToastTitle>{title}</ToastTitle>}

//               {description && (
//                 <ToastDescription>
//                   {description}
//                 </ToastDescription>
//               )}
//             </div>

//             {action}

//             <ToastClose onClick={() => dismiss(id)} />
//           </Toast>
//         );
//       })}

//       <ToastViewport />
//     </ToastProvider>
//   );
// }


// Toaster.jsx
import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider>
      <ToastViewport>
        {toasts.map(function ({ id, title, description, action, ...props }) {
          return (
            <Toast key={id} {...props}>
              <div className="flex items-start justify-between gap-2 w-full">
                <div className="grid gap-0.5">
                  {title && <ToastTitle>{title}</ToastTitle>}
                  {description && <ToastDescription>{description}</ToastDescription>}
                </div>
                <ToastClose onClick={() => dismiss(id)} />
              </div>
              {action}
            </Toast>
          );
        })}
      </ToastViewport>
    </ToastProvider>
  );
}