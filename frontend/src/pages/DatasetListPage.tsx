import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getDatasets, createDataset } from '@/features/apiClient';
import toast from 'react-hot-toast';

// Define props for the modal component to resolve 'any' type errors.
interface CreateDatasetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, description: string) => void;
}

// A simple component for the creation modal
const CreateDatasetModal: React.FC<CreateDatasetModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        if (!name.trim()) {
            toast.error("Le nom du dataset est requis.");
            return;
        }
        onCreate(name, description);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Créer un nouveau Dataset</h2>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nom du dataset" />
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optionnel)" />
                <div className="modal-footer">
                    <button onClick={onClose}>Annuler</button>
                    <button onClick={handleSubmit} className="primary">Créer</button>
                </div>
            </div>
        </div>
    );
};

export const DatasetListPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: datasets, isLoading, isError, error } = useQuery({
        queryKey: ['datasets'],
        queryFn: getDatasets
    });

    const createMutation = useMutation({
        mutationFn: ({ name, description }: { name: string, description: string }) => createDataset(name, description),
        onSuccess: (newDataset) => {
            toast.success(`Dataset "${newDataset.name}" créé !`);
            queryClient.invalidateQueries({ queryKey: ['datasets'] });
            setIsModalOpen(false);
            navigate(`/datasets/${newDataset.id}`);
        },
        onError: (e: Error) => toast.error(e.message),
    });

    if (isLoading) return <div>Chargement des datasets...</div>;
    if (isError) return <div>Erreur: {error.message}</div>;

    return (
        <div className="dataset-list-page">
            <header>
                <h1>Vos Datasets</h1>
                <button className="primary" onClick={() => setIsModalOpen(true)} disabled={createMutation.isPending}>
                    Créer un nouveau dataset
                </button>
            </header>
            <main>
                {datasets && datasets.length > 0 ? (
                    <ul>
                        {datasets.map(dataset => (
                            <li key={dataset.id}>
                                <Link to={`/datasets/${dataset.id}`}>
                                    <h3>{dataset.name}</h3>
                                    <p>{dataset.description || 'Pas de description'}</p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Vous n'avez encore aucun dataset. Créez-en un pour commencer !</p>
                )}
            </main>
            <CreateDatasetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={(name, description) => createMutation.mutate({ name, description })}
            />
        </div>
    );
};