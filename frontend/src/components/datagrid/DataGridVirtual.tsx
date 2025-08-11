import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useState, useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import styles from './DataGridVirtual.module.scss';

interface DataGridVirtualProps {
  rows: Record<string, any>[];
  height?: number;
  maxColumnWidth?: number;
  minColumnWidth?: number;
}

export function DataGridVirtual({ 
  rows, 
  height = 400, 
  maxColumnWidth = 300, 
  minColumnWidth = 100 
}: DataGridVirtualProps) {
  const [columnSizes, setColumnSizes] = useState<Record<string, number>>({});
  const bodyRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Créer les colonnes dynamiquement basées sur les données
  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (!rows.length) return [];
    
    return Object.keys(rows[0]).map(key => ({
      accessorKey: key,
      header: key,
      size: columnSizes[key] || Math.min(Math.max(key.length * 8 + 20, minColumnWidth), maxColumnWidth),
      minSize: minColumnWidth,
      maxSize: maxColumnWidth,
    }));
  }, [rows, columnSizes, maxColumnWidth, minColumnWidth]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    onColumnSizingChange: setColumnSizes,
  });

  const { rows: tableRows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => bodyRef.current,
    estimateSize: () => 35,
    overscan: 20, // Augmenté pour pré-rendre plus de lignes
    scrollPaddingEnd: 100, // Padding supplémentaire en bas
    scrollPaddingStart: 100, // Padding supplémentaire en haut
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => bodyRef.current,
    estimateSize: () => 150,
    overscan: 5, // Augmenté pour les colonnes
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start || 0 : 0;
  const paddingBottom = virtualRows.length > 0 ? virtualRows[virtualRows.length - 1].end || 0 : 0;

  // Synchronisation du scroll horizontal entre header et body
  const onBodyScroll = () => {
    if (headerRef.current && bodyRef.current) {
      // Synchronisation plus précise avec requestAnimationFrame
      requestAnimationFrame(() => {
        if (headerRef.current && bodyRef.current) {
          headerRef.current.scrollLeft = bodyRef.current.scrollLeft;
        }
      });
    }
  };

  if (!rows.length) {
    return (
      <div className={styles.dataGrid} style={{ height }}>
        <div className={styles.emptyState}>
          <p>Aucune donnée à afficher</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dataGrid} style={{ height }}>
      {/* Header fixe - en dehors du conteneur de défilement */}
      <div className={styles.fixedHeader} ref={headerRef}>
        <table style={{ 
          minWidth: 'max-content', 
          width: `${columnVirtualizer.getTotalSize()}px`,
          tableLayout: 'fixed'
        }}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    style={{
                      width: header.getSize(),
                      backgroundColor: '#ffffff',
                      whiteSpace: 'nowrap',
                      padding: '8px 12px',
                      borderBottom: '2px solid #e5e7eb',
                      fontSize: 13,
                      fontWeight: '600',
                      color: '#374151',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext())
                    }
                  </th>
                ))}
              </tr>
            ))}
          </thead>
        </table>
      </div>

      {/* Body scrollable - séparé du header */}
      <div 
        ref={bodyRef}
        className={styles.scrollableBody}
        onScroll={onBodyScroll}
        style={{
          height: `calc(100% - 50px)`, // Hauteur totale moins le header
          overflow: 'auto',
          overflowX: 'scroll',
          overflowY: 'auto',
          willChange: 'scroll-position', // Optimisation GPU
          WebkitOverflowScrolling: 'touch', // Smooth scroll sur iOS
        }}
      >
        <div 
          className={styles.tableWrapper}
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: `${columnVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          <table style={{ 
            minWidth: 'max-content', 
            width: `${columnVirtualizer.getTotalSize()}px`,
            tableLayout: 'fixed'
          }}>
            <tbody>
              {paddingTop > 0 && (
                <tr>
                  <td style={{ height: `${paddingTop}px` }} />
                </tr>
              )}
              {virtualRows.map(virtualRow => {
                const row = tableRows[virtualRow.index];
                return (
                  <tr 
                    key={`row-${virtualRow.index}-${row.id}`}
                    data-index={virtualRow.index}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td
                        key={`${row.id}-${cell.id}`}
                        style={{
                          width: cell.column.getSize(),
                          whiteSpace: 'nowrap',
                          padding: '8px 12px',
                          borderBottom: '1px solid #e5e7eb',
                          fontSize: 13,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {paddingBottom > 0 && (
                <tr>
                  <td style={{ height: `${paddingBottom}px` }} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

