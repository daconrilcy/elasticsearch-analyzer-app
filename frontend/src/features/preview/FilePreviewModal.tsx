import React from 'react';
import { Modal } from './components/Modal';
import { FilePreview } from './components/FilePreview';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  filename: string;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  fileId,
  filename
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Aperçu de ${filename}`}
      showFullscreenToggle={true}
    >
      <FilePreview fileId={fileId} />
    </Modal>
  );
};
