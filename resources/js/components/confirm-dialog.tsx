import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface Props {
    /** Element that opens the dialog (e.g. a button). Rendered as the trigger. */
    trigger: React.ReactNode;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: 'default' | 'destructive';
    onConfirm: () => void;
}

/**
 * A small confirmation dialog to replace the browser's native confirm().
 * Wrap the triggering control with `trigger` and handle the action in `onConfirm`.
 */
export default function ConfirmDialog({
    trigger,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmVariant = 'default',
    onConfirm,
}: Props) {
    const [open, setOpen] = useState(false);

    const handleConfirm = () => {
        setOpen(false);
        onConfirm();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">{cancelLabel}</Button>
                    </DialogClose>
                    <Button variant={confirmVariant} onClick={handleConfirm}>
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
