import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MappingApply } from '../MappingApply';

// Mock fetch globalement
global.fetch = vi.fn();

const mockMapping = {
  id: 'mapping-1',
  name: 'Test Mapping',
  source_file_id: 'file-1',
  mapping_rules: [
    { source: 'name', target: 'full_name', es_type: 'keyword' },
    { source: 'age', target: 'user_age', es_type: 'integer' }
  ],
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0
  }
};

const mockApplyResponse = {
  success: true,
  index_name: 'test_index',
  pipeline_name: 'test_pipeline',
  ilm_policy_name: 'test_ilm',
  status: 'created',
  message: 'Mapping applied successfully',
  processing_time_ms: 1500,
  details: {
    index_created: true,
    pipeline_created: true,
    ilm_policy_created: true,
    shards: 1,
    replicas: 0,
    settings: {
      number_of_shards: 1,
      number_of_replicas: 0,
      'index.mapping.total_fields.limit': 1000
    }
  }
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('MappingApply', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  it('should render header with title and expand button', () => {
    renderWithQueryClient(<MappingApply mapping={mockMapping} />);

    expect(screen.getByText('Application du Mapping')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument();
  });

  it('should expand content when expand button is clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MappingApply mapping={mockMapping} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    expect(screen.getByText(/Déployez votre mapping en créant l'index Elasticsearch/)).toBeInTheDocument();
    expect(screen.getByText('Configuration de l\'Index')).toBeInTheDocument();
  });

  it('should collapse content when expand button is clicked again', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MappingApply mapping={mockMapping} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    
    // Expand
    await user.click(expandButton);
    expect(screen.getByText('Configuration de l\'Index')).toBeInTheDocument();
    
    // Collapse
    await user.click(expandButton);
    expect(screen.queryByText('Configuration de l\'Index')).not.toBeInTheDocument();
  });

  it('should display configuration form fields', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MappingApply mapping={mockMapping} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    expect(screen.getByPlaceholderText('mon_index')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('mon_pipeline')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /Nombre de shards/i })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /Nombre de réplicas/i })).toBeInTheDocument();
  });

  it('should allow editing configuration values', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MappingApply mapping={mockMapping} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const indexNameInput = screen.getByPlaceholderText('mon_index');
    const pipelineNameInput = screen.getByPlaceholderText('mon_pipeline');
    const shardsInput = screen.getByRole('spinbutton', { name: /Nombre de shards/i });
    const replicasInput = screen.getByRole('spinbutton', { name: /Nombre de réplicas/i });

    await user.clear(indexNameInput);
    await user.type(indexNameInput, 'my_custom_index');
    
    await user.clear(pipelineNameInput);
    await user.type(pipelineNameInput, 'my_custom_pipeline');
    
    // FIX: Utiliser fireEvent.change pour les champs numériques.
    // userEvent.type concatène la valeur au lieu de la remplacer car l'événement `clear`
    // déclenche une mise à jour qui réinitialise la valeur à 1.
    fireEvent.change(shardsInput, { target: { value: '3' } });
    fireEvent.change(replicasInput, { target: { value: '2' } });

    expect(indexNameInput).toHaveValue('my_custom_index');
    expect(pipelineNameInput).toHaveValue('my_custom_pipeline');
    expect(shardsInput).toHaveValue(3);
    expect(replicasInput).toHaveValue(2);
  });

  it('should show compiled hash when provided', async () => {
    const user = userEvent.setup();
    const compiledHash = 'abc123def456';
    
    renderWithQueryClient(<MappingApply mapping={mockMapping} compiledHash={compiledHash} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    // FIX: Chercher l'élément parent pour vérifier le contenu textuel lorsque le texte est séparé.
    // getByText échoue car le texte est dans une balise <strong> et un nœud de texte.
    const hashElement = screen.getByText(/Hash de compilation:/).parentElement;
    expect(hashElement).toHaveTextContent(`Hash de compilation: ${compiledHash}`);
  });

  it('should not show compiled hash section when not provided', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MappingApply mapping={mockMapping} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    expect(screen.queryByText(/Hash de compilation:/)).not.toBeInTheDocument();
  });

  it('should call applyMapping when apply button is clicked', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApplyResponse,
    });

    renderWithQueryClient(<MappingApply mapping={mockMapping} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const applyButton = screen.getByText('Appliquer le Mapping');
    await user.click(applyButton);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/mappings/apply'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"create_index":true'),
      })
    );
  });

  it('should use default names when configuration is empty', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApplyResponse,
    });

    renderWithQueryClient(<MappingApply mapping={mockMapping} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const applyButton = screen.getByText('Appliquer le Mapping');
    await user.click(applyButton);

    const requestBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(requestBody.mapping.index_name).toMatch(/^index_\d+$/);
    expect(requestBody.mapping.pipeline_name).toMatch(/^pipeline_\d+$/);
  });

  it('should use custom configuration when provided', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApplyResponse,
    });

    renderWithQueryClient(<MappingApply mapping={mockMapping} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const indexNameInput = screen.getByPlaceholderText('mon_index');
    const pipelineNameInput = screen.getByPlaceholderText('mon_pipeline');
    const shardsInput = screen.getByRole('spinbutton', { name: /Nombre de shards/i });
    const replicasInput = screen.getByRole('spinbutton', { name: /Nombre de réplicas/i });

    await user.clear(indexNameInput);
    await user.type(indexNameInput, 'custom_index');
    
    await user.clear(pipelineNameInput);
    await user.type(pipelineNameInput, 'custom_pipeline');
    
    // FIX: Utiliser fireEvent.change pour s'assurer que la bonne valeur est envoyée.
    fireEvent.change(shardsInput, { target: { value: '5' } });
    fireEvent.change(replicasInput, { target: { value: '3' } });

    const applyButton = screen.getByText('Appliquer le Mapping');
    await user.click(applyButton);

    const requestBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(requestBody.mapping.index_name).toBe('custom_index');
    expect(requestBody.mapping.pipeline_name).toBe('custom_pipeline');
    expect(requestBody.mapping.settings.number_of_shards).toBe(5);
    expect(requestBody.mapping.settings.number_of_replicas).toBe(3);
  });

  it('should disable apply button while mutation is pending', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));

    renderWithQueryClient(<MappingApply mapping={mockMapping} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const applyButton = screen.getByText('Appliquer le Mapping');
    await user.click(applyButton);
    
    await screen.findByText('Application en cours...'); // attend l'état pending
    expect(applyButton).toBeDisabled();
  });

  it('should show error message when mutation fails', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    renderWithQueryClient(<MappingApply mapping={mockMapping} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const applyButton = screen.getByText('Appliquer le Mapping');
    await user.click(applyButton);

    await screen.findByText('Erreur lors de l\'application:');
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('should show success results when mutation succeeds', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApplyResponse,
    });

    renderWithQueryClient(<MappingApply mapping={mockMapping} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const applyButton = screen.getByText('Appliquer le Mapping');
    await user.click(applyButton);

    await screen.findByText('🎉 Mapping Appliqué avec Succès !');
    const successSection = screen.getByTestId('apply-success');
    expect(within(successSection).getByText('test_index')).toBeInTheDocument();
  });

  it('should display status with correct icon and color', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApplyResponse,
    });

    renderWithQueryClient(<MappingApply mapping={mockMapping} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const applyButton = screen.getByText('Appliquer le Mapping');
    await user.click(applyButton);

    const resultsSection = await screen.findByTestId('apply-results');
    expect(within(resultsSection).getByText('✅ Créé')).toBeInTheDocument();
    
    const summary = screen.getByTestId('apply-summary');
    expect(within(summary).getByText('1500ms')).toBeInTheDocument();
  });

  it('should show details section when toggle button is clicked', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApplyResponse,
    });

    renderWithQueryClient(<MappingApply mapping={mockMapping} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const applyButton = screen.getByText('Appliquer le Mapping');
    await user.click(applyButton);

    await screen.findByText('🎉 Mapping Appliqué avec Succès !');

    const toggleButton = screen.getByTestId('toggle-details');
    await user.click(toggleButton);

    await screen.findByTestId('apply-details-content');
    expect(screen.getByTestId('index-created')).toHaveTextContent('Index créé: Oui');
    expect(screen.getByTestId('pipeline-created')).toHaveTextContent('Pipeline créé: Oui');
    expect(screen.getByTestId('ilm-created')).toHaveTextContent('Politique ILM créée: Oui');
    expect(screen.getByTestId('shards')).toHaveTextContent('Shards: 1');
    expect(screen.getByTestId('replicas')).toHaveTextContent('Réplicas: 0');
  });

  it('should hide details section when toggle button is clicked again', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApplyResponse,
    });

    renderWithQueryClient(<MappingApply mapping={mockMapping} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const applyButton = screen.getByText('Appliquer le Mapping');
    await user.click(applyButton);

    await screen.findByText('🎉 Mapping Appliqué avec Succès !');

    const toggleButton = screen.getByTestId('toggle-details');
    await user.click(toggleButton);
    await user.click(toggleButton);

    expect(screen.queryByTestId('apply-details-content')).not.toBeInTheDocument();
  });

  it('should display index settings when available', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApplyResponse,
    });

    renderWithQueryClient(<MappingApply mapping={mockMapping} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const applyButton = screen.getByText('Appliquer le Mapping');
    await user.click(applyButton);

    await screen.findByText('🎉 Mapping Appliqué avec Succès !');

    const toggleButton = screen.getByTestId('toggle-details');
    await user.click(toggleButton);

    const settingsSection = await screen.findByTestId('settings-section');
    expect(settingsSection).toBeInTheDocument();
    const jsonOutput = screen.getByTestId('settings-output');
    expect(jsonOutput).toHaveTextContent('"number_of_shards": 1');
    expect(jsonOutput).toHaveTextContent('"number_of_replicas": 0');
  });

  it('should show next steps when mapping is successfully applied', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApplyResponse,
    });

    renderWithQueryClient(<MappingApply mapping={mockMapping} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const applyButton = screen.getByText('Appliquer le Mapping');
    await user.click(applyButton);

    await screen.findByText('🎉 Mapping Appliqué avec Succès !');

    const successSection = screen.getByTestId('apply-success');
    expect(within(successSection).getByText('Prochaines étapes :')).toBeInTheDocument();
    expect(within(successSection).getByText('Vérifiez que l\'index est visible dans Elasticsearch')).toBeInTheDocument();
    expect(within(successSection).getByText('Testez l\'ingestion avec quelques documents')).toBeInTheDocument();
    expect(within(successSection).getByText('Configurez la surveillance et les alertes si nécessaire')).toBeInTheDocument();
  });

  it('should call onApplyComplete when mutation succeeds', async () => {
    const user = userEvent.setup();
    const onApplyComplete = vi.fn();
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApplyResponse,
    });

    renderWithQueryClient(<MappingApply mapping={mockMapping} onApplyComplete={onApplyComplete} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const applyButton = screen.getByText('Appliquer le Mapping');
    await user.click(applyButton);

    await screen.findByText('🎉 Mapping Appliqué avec Succès !');

    expect(onApplyComplete).toHaveBeenCalledWith(mockApplyResponse);
  });

  it('should handle different status types correctly', async () => {
    const user = userEvent.setup();
    const updatedResponse = { ...mockApplyResponse, status: 'updated' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedResponse,
    });

    renderWithQueryClient(<MappingApply mapping={mockMapping} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const applyButton = screen.getByText('Appliquer le Mapping');
    await user.click(applyButton);

    const updatedElements = await screen.findAllByText('🔄 Mis à jour');
    expect(updatedElements.length).toBeGreaterThan(0);
  });

  it('should handle failed status correctly', async () => {
    const user = userEvent.setup();
    const failedResponse = { ...mockApplyResponse, status: 'failed', success: false };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => failedResponse,
    });

    renderWithQueryClient(<MappingApply mapping={mockMapping} />);

    const expandButton = screen.getByRole('button', { name: '+' });
    await user.click(expandButton);

    const applyButton = screen.getByText('Appliquer le Mapping');
    await user.click(applyButton);

    const failedElements = await screen.findAllByText('❌ Échec');
    expect(failedElements.length).toBeGreaterThan(0);
    expect(screen.queryByText('🎉 Mapping Appliqué avec Succès !')).not.toBeInTheDocument();
  });
});
