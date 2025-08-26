import { SPFI } from "@pnp/sp";

export interface IDocTilesProps {
  sp: SPFI;
  title: string;
  listId?: string;
  groupField: string;
  viewUrl?: string;
  maxPer: number;
  showCounts: boolean;
  twoLineClamp: boolean;
}
