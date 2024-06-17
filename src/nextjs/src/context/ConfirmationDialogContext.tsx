import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
  type PropsWithChildren,
  createContext,
  useContext,
  useRef,
  useState,
} from "react";

export type ConfirmationOptions = {
  catchOnCancel?: boolean;
  variant?: "danger" | "info";
  title: string;
  description: string;
  cancel?: string;
  submit?: string;
};

const ConfirmationServiceContext = createContext<
  (options: ConfirmationOptions) => Promise<void>
>(Promise.reject);

export const useConfirmation = () => useContext(ConfirmationServiceContext);

export const ConfirmationServiceProvider = ({
  children,
}: PropsWithChildren) => {
  const [confirmationState, setConfirmationState] =
    useState<ConfirmationOptions | null>(null);

  const awaitingPromiseRef = useRef<{
    resolve: () => void;
    reject: () => void;
  }>();

  const openConfirmation = (options: ConfirmationOptions) => {
    setConfirmationState(options);
    return new Promise<void>((resolve, reject) => {
      awaitingPromiseRef.current = { resolve, reject };
    });
  };

  const handleClose = () => {
    if (confirmationState?.catchOnCancel && awaitingPromiseRef.current) {
      awaitingPromiseRef.current.reject();
    }

    setConfirmationState(null);
  };

  const handleSubmit = () => {
    if (awaitingPromiseRef.current) {
      awaitingPromiseRef.current.resolve();
    }

    setConfirmationState(null);
  };

  return (
    <>
      <ConfirmationServiceContext.Provider value={openConfirmation}>
        {children}
      </ConfirmationServiceContext.Provider>

      <ConfirmationDialog
        state={confirmationState}
        onSubmit={handleSubmit}
        onClose={handleClose}
      />
    </>
  );
};

type ConfirmationDialogProps = {
  onSubmit: () => void;
  onClose: () => void;
  state: ConfirmationOptions | null;
};
const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  state,
  onSubmit,
  onClose,
}) => {
  // TODO state.variant
  return (
    <AlertDialog open={!!state}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>{state?.title}</AlertDialogTitle>
          <AlertDialogDescription>{state?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {state?.cancel && (
            <AlertDialogCancel onClick={onClose} asChild>
              <button className="btn btn-ghost">{state.cancel}</button>
            </AlertDialogCancel>
          )}
          {state?.submit && (
            <AlertDialogAction onClick={onSubmit} asChild>
              <button className="btn btn-outline">{state.submit}</button>
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
