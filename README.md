# doc-tiles
SPFx Document Tiles web part.
**Doc Tiles (SPFx) — Grouped document Links as Modern Tiles From a SharePoint Document library/List**
SharePoint Framework (SPFx) web part that renders document links as modern tiles, grouped by any column (e.g., Category). Built with React + PnPjs, designed to be generic, theme-aware, and easy to configure by site owners.
What is in here
•	Clean, modern tile UI with category headers, counts, and “More…” + “View all” links
•	Works on any list/library (files only or items) grouped by a Choice / Text / Lookup / Taxonomy column
•	Fully configurable from the Property Pane
•	Fast, accessible, and matches Microsoft 365 look & feel
________________________________________
1) Requirements
Component	Version (tested)
Node.js	v18.19.1
npm	10.2.4
Yeoman	5.0.0
SPFx generator	@microsoft/generator-sharepoint@1.19.0
TypeScript	5.4.5
gulp (CLI / local)	2.3.0 / 4.0.2
⚠️ Use the hosted workbench (/_layouts/15/workbench.aspx) for testing. The local workbench can be blocked by modern auth.
________________________________________
2) Purpose & Use Cases
•	Turn a “wall of files” into scannable categories (Policies, Forms, Training, Benefits, etc.) 
•	Transform Document library group by view in to modern tiles with links
•	Provide a homepage portal experience for HR/IT/Legal sites
•	Reuse on any site—select the list and choose the column to group by
•	Keep performance tight: shows files only (ignores folders) and limits items per group (default 6)
________________________________________
3) Solution Overview
Technical stack: SPFx + React + SCSS, PnPjs v3
Key files:
src/webparts/docTiles/
 ├─ DocTilesWebPart.ts              # property pane + SPFI init + dropdown loaders
 ├─ IDocTilesWebPartProps.ts        # web part props
 └─ components/
     ├─ DocTiles.tsx                # UI rendering + PnPjs queries
     ├─ IDocTilesProps.ts           # component props
     └─ DocTiles.module.scss        # design tokens + tile styles
PnPjs note: v3 uses “side-effect imports” to extend the SPFI API (e.g., .web, .lists, .items). These are included in the solution.
________________________________________
4) Configure (Property Pane)
Property	What it does	Example / Tips
Title	Web part heading	“Policies & Procedures”
List/Library	Source list/library	Dropdown displays visible lists: Document Library (101) or List (100)
Group by column	Column to group by	Must be a Text / Choice / Lookup / Taxonomy column (internal name shown)
View URL	Used by View all and More… links	e.g. /sites/HR/Policies%20%20Procedures/Forms/Grouped%20by%20Category.aspx or AllItems.aspx
Max items per category	Tile count per group	Default 6
Show counts	Show number in header	On/Off
Clamp to two lines	Shortens long file names	On/Off (adds ellipsis after 2 lines)
Link behavior
•	Clicking a file pill opens the document in a new tab
•	More… under a category links to your View URL with ?FilterField1=<GroupColumn>&FilterValue1=<Category>
•	View all in the header links to the View URL (no filter)
URL Formula (for reference):
<ViewURL>?FilterField1=<InternalName>&FilterValue1=<CategoryValue>
________________________________________
5) How the Data Is Queried
•	PnPjs: sp.web.lists.getById(listId).items.select('Id,Title,FileRef,FSObjType,<GroupColumn>').filter('FSObjType eq 0')()
•	Files only (FSObjType eq 0). Folders are ignored.
•	Items are grouped client-side by <GroupColumn> value. Empty values go to “Uncategorized”.
Supported group column types: Text / Choice / Lookup / Taxonomy (single/multi).
Not supported: Managed metadata when the internal value isn’t in the default TaxCatchAll mapping (edge case). Works in practice for std. taxonomy fields.
________________________________________
6) Styling & Branding
The web part uses your site theme and these brand tokens in DocTiles.module.scss:
Fonts (recommended):
font-family: "Segoe UI Variable", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
Headers (cleaner “industry” style):
/* Section title */
.header h2{
  font-family: "Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif;
  font-size: 20px; font-weight: 600; letter-spacing: .3px; color:;
}

/* Category name */
.catname{
  text-transform: uppercase; font-size: 14px; font-weight: 700; letter-spacing: .8px;
}
Update only DocTiles.module.scss to customize colors, sizes, and focus rings. No code changes required.
________________________________________
7) Governance / Best Practices
•	Keep Max items at 6–8 per group for speed.
•	Prefer grouping by Choice columns (cleaner values).
•	Point View URL to a view that shows documents (not folders).
•	For large libraries, create topic views and use multiple web parts (Policies, Forms, Training).
•	Ensure users have Read access to the library.
________________________________________
8) Troubleshooting
A) “Property 'web' does not exist on type 'SPFI'”
You’re missing PnPjs side-effect imports. Ensure these exist:
// In DocTilesWebPart.ts
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/fields";

// In DocTiles.tsx
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
B) Workbench shows “Something went wrong – [object Object]”
Usually SPFI was created too early. In DocTilesWebPart.ts, initialize PnP in onInit():
private _sp!: SPFI;
public async onInit() {
  await super.onInit();
  this._sp = spfi().using(SPFx(this.context));
}
Also enabled visible error messages in the component:
catch(e){ console.error(e); setError(e?.message || String(e)); }
C) “Error loading files HTTP 400/404”
•	Check List/Library is selected
•	Check Group by column is valid (internal name)
•	Ensure permissions (you can open the View URL manually)
•	Verify View URL encoding (spaces as %20; double spaces become %20%20)
D) “No documents found”
•	Library may have folders only (FSObjType = 1). Add files at the root or adjust your content model.
•	Group column empty → files fall into Uncategorized.
________________________________________
9) Extending the Web Part (optional ideas)
•	Manual category ordering (prop: an array; sort groups per string index)
•	Show Modified / Owner on pills (add fields to the .select() and render small meta text)
•	Filter by another column (add a where textbox prop → append .filter(...))
•	Icons per category (map category → icon glyph; add <span class="icon"> before .title)
•	Multi-line clamp control (prop: 1/2/3 lines)
Open to PRs—see the structure above.
________________________________________
10) Security & Privacy
•	Web part reads from the selected list/library using the current user context.
•	No external calls; no telemetry.
•	Honors standard SharePoint permissions.
________________________________________
 Appendix — Useful Snippets
Get List GUID from List Settings URL
.../listedit.aspx?List=%7Bfc38d97-0f8d-4bff-befc-4d0df4515e5b%7D → GUID: fc38d97-0f8d-4bff-befc-4d0df4515e5b (remove {}, keep hyphens).
Encoded View URL with filter
/sites/HumanResources/Policies%20%20Procedures/Forms/Grouped%20by%20Category.aspx
  ?FilterField1=Category
  &FilterValue1=Compliance
Recommended font stack
"Segoe UI Variable", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif
________________________________________
Screenshots

<img width="1083" height="341" alt="image" src="https://github.com/user-attachments/assets/fa6b66c7-858f-43a5-96e7-add85d27a421" />

App Properties:
<img width="340" height="751" alt="image" src="https://github.com/user-attachments/assets/149b2397-90b3-4f0c-b92b-0e84471e9273" />




