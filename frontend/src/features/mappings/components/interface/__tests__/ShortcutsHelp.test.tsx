import { render, screen, fireEvent } from '@testing-library/react';
import { ShortcutsHelp } from '../ShortcutsHelp';

describe('ShortcutsHelp', () => {
  it('renders the trigger button', () => {
    render(<ShortcutsHelp />);
    expect(screen.getByText('⌨️ Raccourcis')).toBeInTheDocument();
  });

  it('opens and closes the modal', () => {
    render(<ShortcutsHelp />);
    const button = screen.getByText('⌨️ Raccourcis');
    fireEvent.click(button);
    expect(screen.getByText('Raccourcis clavier')).toBeInTheDocument();

    const closeButton = screen.getByLabelText("Fermer l'aide");
    fireEvent.click(closeButton);
    expect(screen.queryByText('Raccourcis clavier')).not.toBeInTheDocument();
  });
});