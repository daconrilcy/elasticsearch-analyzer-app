import React, { useState, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import styles from './DocsPreviewVirtualized.module.scss';

interface Document {
  _id: string;
  _source: any;
  [key: string]: any;
}

interface DocsPreviewVirtualizedProps {
  documents: Document[];
  height?: number;
  itemSize?: number;
  initialLimit?: number;
  incrementSize?: number;
}

const DocumentRow: React.FC<{ index: number; style: React.CSSProperties; data: Document }> = ({ 
  index, 
  style, 
  data 
}) => (
  <div style={style} className={styles.row}>
    <div className={styles.docId}>{data._id}</div>
    <div className={styles.docContent}>
      <pre>{JSON.stringify(data._source, null, 2)}</pre>
    </div>
  </div>
);

export const DocsPreviewVirtualized: React.FC<DocsPreviewVirtualizedProps> = ({
  documents,
  height = 320,
  itemSize = 24,
  initialLimit = 100,
  incrementSize = 100,
}) => {
  const [displayLimit, setDisplayLimit] = useState(initialLimit);

  const displayedDocs = useMemo(() => {
    return documents.slice(0, displayLimit);
  }, [documents, displayLimit]);

  const hasMore = documents.length > displayLimit;
  const totalCount = documents.length;

  const loadMore = () => {
    setDisplayLimit(prev => Math.min(prev + incrementSize, documents.length));
  };

  if (documents.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Aucun document à afficher</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4>Prévisualisation des documents</h4>
        <span className={styles.count}>
          {displayedDocs.length} / {totalCount} documents
        </span>
      </div>

      <div className={styles.listContainer}>
        <List
          height={height}
          itemCount={displayedDocs.length}
          itemSize={itemSize}
          width="100%"
          itemData={displayedDocs}
        >
          {({ index, style }) => (
            <DocumentRow
              index={index}
              style={style}
              data={displayedDocs[index]}
            />
          )}
        </List>
      </div>

      {hasMore && (
        <div className={styles.loadMore}>
          <button
            onClick={loadMore}
            className={styles.loadMoreButton}
            aria-label={`Charger ${Math.min(incrementSize, documents.length - displayLimit)} documents supplémentaires`}
          >
            Charger plus (+{Math.min(incrementSize, documents.length - displayLimit)})
          </button>
        </div>
      )}
    </div>
  );
};

export default DocsPreviewVirtualized;
