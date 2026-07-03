"use client";

import { Dialog } from "@/components/ui/dialog";
import { SearchModal } from "./search-modal";
import { CommandDialog } from "../ui/command";
import useKeybind from "@/hooks/use-keybind";
import { Modals } from "@/lib/enums";
import { useModalState } from "@/hooks/nuqs/use-modal-state";

// Placeholder component for unimplemented modals
const PlaceholderModal: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-2">Modal Coming Soon</h2>
    <p className="text-muted-foreground">This modal functionality will be implemented soon.</p>
  </div>
);

const modalComponents: Record<Modals, React.FC> = {
  [Modals.SEARCH]: SearchModal,
  [Modals.NOTIFICATIONS]: PlaceholderModal,
  [Modals.FIELD_TRANSFORMATION]: PlaceholderModal,
  [Modals.TRANSFORMATION_RULE]: PlaceholderModal,
  [Modals.HYDRANT]: PlaceholderModal,
  [Modals.DISPATCH_TYPE]: PlaceholderModal,
  [Modals.VIEW_TOKEN]: PlaceholderModal,
};

export function ModalRouter() {
  const [modal, setModal] = useModalState();

  useKeybind(["ctrl", "k"], () => {
    setModal((prev) => (prev === Modals.SEARCH ? null : Modals.SEARCH));
  });

  if (!modal) return null;

  const ModalComponent = modalComponents[modal];

  const Slot = modal === Modals.SEARCH ? CommandDialog : Dialog;

  return (
    <Slot open={!!modal} onOpenChange={(open) => setModal(open ? modal : null)}>
      <ModalComponent />
    </Slot>
  );
}
