export interface IDocTilesWebPartProps {
  title: string;
  listId?: string;                 // GUID string, no braces
  groupFieldInternalName?: string; // e.g., "Category" or "Category0"
  viewUrl?: string;                // /sites/.../Forms/AllItems.aspx or Grouped view
  maxPerCategory: number;          // default 6
  showCounts: boolean;             // show count in category header
  twoLineClamp: boolean;           // clamp file title to 2 lines
}
