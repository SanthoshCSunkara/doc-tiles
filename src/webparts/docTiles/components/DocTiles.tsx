import * as React from 'react';
import styles from './DocTiles.module.scss';
import { IDocTilesProps } from './IDocTilesProps';

/** PnPjs side-effect imports (enable .web .lists .items) */
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";

type GroupMap = Record<string, Array<{ Id: number; Title: string; FileRef: string }>>;
type ItemRow = { Id: number; Title: string; FileRef: string; FSObjType: number; [k: string]: any };

export default function DocTiles(props: IDocTilesProps) {
  const { sp, title, listId, groupField, viewUrl, maxPer, showCounts, twoLineClamp } = props;

  const [loading, setLoading] = React.useState<boolean>(true);
  const [groups, setGroups] = React.useState<GroupMap>({});
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      if (!listId) { setGroups({}); setLoading(false); return; }

      setError(null);
      setLoading(true);
      try {
        // Only files: FSObjType = 0
        const raw: ItemRow[] = await sp.web.lists.getById(listId).items
          .select(`Id,Title,FileRef,FSObjType,${groupField}`)
          .filter('FSObjType eq 0')();

        const map: GroupMap = {};
        raw.forEach((r: ItemRow) => {
          const key = (r as any)[groupField] || 'Uncategorized';
          (map[key] ||= []).push({ Id: r.Id, Title: r.Title, FileRef: r.FileRef });
        });
        setGroups(map);
      } catch (e: any) {
        console.error("DocTiles load error", e);
        setError(e?.message || String(e));
        setGroups({});
      } finally {
        setLoading(false);
      }
    })();
  }, [sp, listId, groupField]);

  const cats = React.useMemo(() => Object.keys(groups).sort((a,b)=>a.localeCompare(b)), [groups]);

  const catLink = (cat: string) =>
    viewUrl ? `${viewUrl}?FilterField1=${encodeURIComponent(groupField)}&FilterValue1=${encodeURIComponent(cat)}` : '#';

  return (
    <div className={styles.host}>
      <div className={styles.header}>
        <h2>{title}</h2>
        {viewUrl && <a href={viewUrl} target="_blank" rel="noopener">View all</a>}
      </div>

      {error && <div className={styles.status} style={{color:"#d83b01"}}>Failed to load: {error}</div>}
      {loading && !error && <div className={styles.status}>Loading…</div>}

      {!loading && !error && (
        <div className={styles.grid}>
          {cats.map(cat => {
            const docs = groups[cat] || [];
            return (
              <div key={cat} className={styles.card}>
                <div className={styles.catbar}>
                  <div className={styles.catname}>{cat}</div>
                  {showCounts && <div className={styles.count}>{docs.length}</div>}
                </div>

                <div className={styles.doclist}>
                  {docs.slice(0, maxPer).map(d => (
                    <a key={d.Id}
                       className={`${styles.pill} ${twoLineClamp ? styles.clamp2 : ''}`}
                       href={d.FileRef} target="_blank" rel="noopener"
                       aria-label={`${d.Title || d.FileRef} (opens in new tab)`}>
                      <span className={styles.dot} />
                      <span className={styles.title}>{d.Title || (d.FileRef || '').split('/').pop()}</span>
                    </a>
                  ))}
                </div>

                {(docs.length > maxPer && viewUrl) && (
                  <div className={styles.foot}>
                    <a className={styles.more} href={catLink(cat)} target="_blank" rel="noopener">More…</a>
                  </div>
                )}
              </div>
            );
          })}
          {cats.length === 0 && <div className={styles.status}>No documents found.</div>}
        </div>
      )}
    </div>
  );
}
