//src/pages/DatasetDetail.tsx

import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { getDatasetDetails, uploadFile } from '../features/apiClient';
import { FileList } from '../features/components/FileList';
import { MappingList } from '../features/components/MappingList';
import { UploadButton } from '../features/components/UploadButton';
import { CreateMappingModal } from '../features/components/CreateMappingModal';

import { FileStatus } from '@/types/api.v1';
import type { FileOut, DatasetDetailOut } from '@/types/api.v1';
import { ApiError } from '@/features/errors';
import { useSSEFileStatus } from "@/hooks/useSSEFileStatus";

export const DatasetDetailPage: React.FC = () => {
    const { datasetId } = useParams<{ datasetId: string }>();
    if (!datasetId) {
        return <div>ID de dataset manquant.</div>;
    }
    const queryClient = useQueryClient();

    // 1. Récupération des données du dataset (inchangé)
    const { data: dataset, isLoading, isError, error } = useQuery<DatasetDetailOut, Error>({
        queryKey: ['dataset', datasetId],
        queryFn: () => getDatasetDetails(datasetId),
    });

    // 2. Logique pour identifier les fichiers en cours de traitement (inchangé)
    const processingFiles = useMemo(() =>
        dataset?.files.filter(file =>
            file.status === FileStatus.PARSING || file.status === FileStatus.PENDING
        ) || [],
        [dataset?.files]
    );

    // 3. Logique de suivi par SSE (simplifiée)
    useSSEFileStatus({ processingFiles, datasetId, queryClient });

    // 4. Mutation pour l'upload de fichier (inchangé)
    const uploadMutation = useMutation({
        mutationFn: (file: File) => uploadFile(datasetId, file),
        onMutate: () => {
            toast.loading('Upload en cours...', { id: 'upload-toast' });
        },
        onSuccess: () => {
            toast.success('Fichier téléversé ! Le traitement commence.', { id: 'upload-toast' });
            queryClient.invalidateQueries({ queryKey: ['dataset', datasetId] });
        },
        onError: (error) => {

            let errorMessage = "Une erreur inattendue est survenue.";
          
            if (error instanceof ApiError || error.name === 'ApiError') {
                errorMessage = error.message;
            }
          
            toast.error(`${errorMessage}`, { id: 'upload-toast' });
        },
    });

    // 5. Gestion de la modale (inchangé)
    const [selectedFileForMapping, setSelectedFileForMapping] = useState<FileOut | null>(null);

    const handleCreateMappingClick = (file: FileOut) => {
        if (file.status === FileStatus.READY) {
            setSelectedFileForMapping(file);
        } else {
            toast.error("Le fichier doit avoir le statut 'Ready' pour créer un mapping.");
        }
    };

    if (isLoading) return <div className="loading-fullscreen">Chargement du dataset...</div>;
    if (isError) return <div>Erreur: {error.message}</div>;
    if (!dataset) return <div>Dataset non trouvé.</div>;


    const sortedFiles = [...(dataset.files || [])].sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return (
        <div className="dataset-hub">
            <header>
                <h1>{dataset.name}</h1>
                <p>{dataset.description || 'Pas de description.'}</p>
                <UploadButton
                    onUpload={(file) => uploadMutation.mutate(file)}
                    isLoading={uploadMutation.isPending}
                />
            </header>
            <main>
                <section className="files-section card">
                    <FileList
                        datasetId={dataset.id}
                        files={sortedFiles || []}
                        onCreateMapping={handleCreateMappingClick}
                    />
                </section>
                <section className="mappings-section card">
                    <MappingList mappings={dataset.mappings || []} />
                </section>
            </main>
            {selectedFileForMapping && (
                <CreateMappingModal
                    isOpen={!!selectedFileForMapping}
                    onClose={() => setSelectedFileForMapping(null)}
                    file={selectedFileForMapping}
                    datasetId={dataset.id || ''}
                />
            )}
        </div>
    );
};