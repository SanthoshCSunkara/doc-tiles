import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import {
  IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneTextField,
  PropertyPaneToggle,
  IPropertyPaneDropdownOption
} from '@microsoft/sp-property-pane';

import { spfi, SPFx, SPFI } from "@pnp/sp";
/** PnPjs side-effect imports for typing + features */
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/fields";

import { IDocTilesWebPartProps } from './IDocTilesWebPartProps';
import DocTiles from './components/DocTiles';
import { IDocTilesProps } from './components/IDocTilesProps';

/** Type helpers (satisfy TS strict mode) */
interface ISPList { Id: string; Title: string; BaseTemplate: number; Hidden: boolean; }
interface ISPField { InternalName: string; Title: string; Hidden: boolean; ReadOnlyField: boolean; TypeAsString: string; }

export default class DocTilesWebPart extends BaseClientSideWebPart<IDocTilesWebPartProps> {
  private _sp!: SPFI;

  private _listOptions: IPropertyPaneDropdownOption[] = [];
  private _fieldOptions: IPropertyPaneDropdownOption[] = [];
  private _loadingLists = false;
  private _loadingFields = false;

  public async onInit(): Promise<void> {
    await super.onInit();

    // ✅ Initialize PnPjs here (context ready)
    this._sp = spfi().using(SPFx(this.context));

    // Populate property pane options
    await this._loadLists();
    if (this.properties.listId) {
      await this._loadFields(this.properties.listId);
    }

    // Defaults
    if (this.properties.maxPerCategory === undefined) this.properties.maxPerCategory = 6;
    if (this.properties.title === undefined) this.properties.title = "Document Hub";
    if (this.properties.showCounts === undefined) this.properties.showCounts = true;
    if (this.properties.twoLineClamp === undefined) this.properties.twoLineClamp = true;
  }

  private async _loadLists(): Promise<void> {
    if (this._loadingLists) return;
    this._loadingLists = true;
    try {
      const lists: ISPList[] = await this._sp.web.lists
        .select("Id,Title,BaseTemplate,Hidden")();

      const visible: ISPList[] = lists.filter((l: ISPList) =>
        !l.Hidden && (l.BaseTemplate === 101 || l.BaseTemplate === 100) // 101=DocLib, 100=List
      );
      this._listOptions = visible.map((l: ISPList) => ({ key: l.Id, text: l.Title }));
    } catch (e) {
      console.error("List load error", e);
      this._listOptions = [];
    } finally {
      this._loadingLists = false;
    }
  }

  private async _loadFields(listId: string): Promise<void> {
    if (this._loadingFields) return;
    this._loadingFields = true;
    try {
      const fields: ISPField[] = await this._sp.web.lists.getById(listId).fields
        .select("InternalName,Title,Hidden,ReadOnlyField,TypeAsString")();

      const allowed = new Set(["Text","Choice","Lookup","TaxonomyFieldType","TaxonomyFieldTypeMulti"]);
      this._fieldOptions = fields
        .filter((f: ISPField) => !f.Hidden && !f.ReadOnlyField && allowed.has(f.TypeAsString))
        .map((f: ISPField) => ({ key: f.InternalName, text: `${f.Title} (${f.InternalName})` }));
    } catch (e) {
      console.error("Field load error", e);
      this._fieldOptions = [];
    } finally {
      this._loadingFields = false;
    }
  }

  public async onPropertyPaneConfigurationStart(): Promise<void> {
    await this._loadLists();
    if (this.properties.listId) {
      await this._loadFields(this.properties.listId);
    }
    this.context.propertyPane.refresh();
  }

  public async onPropertyPaneFieldChanged(propertyPath: string, oldValue: any, newValue: any): Promise<void> {
    if (propertyPath === "listId" && newValue && newValue !== oldValue) {
      await this._loadFields(newValue as string);
      this.properties.groupFieldInternalName = undefined; // reset on list change
      this.context.propertyPane.refresh();
    }
    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);
    this.render();
  }

  public render(): void {
    const element: React.ReactElement<IDocTilesProps> = React.createElement(DocTiles, {
      sp: this._sp,
      title: this.properties.title || "Document Hub",
      listId: this.properties.listId,
      groupField: this.properties.groupFieldInternalName || "Category",
      viewUrl: this.properties.viewUrl,
      maxPer: this.properties.maxPerCategory || 6,
      showCounts: !!this.properties.showCounts,
      twoLineClamp: !!this.properties.twoLineClamp
    });

    ReactDom.render(element, this.domElement);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [{
        header: { description: "Doc Tiles — Generic grouped document view" },
        groups: [{
          groupName: "Basics",
          groupFields: [
            PropertyPaneTextField('title', { label: 'Title', placeholder: 'Document Hub' }),
            PropertyPaneDropdown('listId', {
              label: 'List/Library',
              options: this._listOptions,
              selectedKey: this.properties.listId,
              disabled: this._listOptions.length === 0
            }),
            PropertyPaneDropdown('groupFieldInternalName', {
              label: 'Group by column',
              options: this._fieldOptions,
              selectedKey: this.properties.groupFieldInternalName,
              disabled: !this.properties.listId || this._fieldOptions.length === 0
            }),
            PropertyPaneTextField('viewUrl', {
              label: 'View URL (for "View all" & "More…")',
              placeholder: '/sites/Dept/Library/Forms/AllItems.aspx'
            }),
            PropertyPaneTextField('maxPerCategory', {
              label: 'Max items per category',
              value: String(this.properties.maxPerCategory || 6)
            }),
            PropertyPaneToggle('showCounts', { label: 'Show counts in header', checked: this.properties.showCounts }),
            PropertyPaneToggle('twoLineClamp', { label: 'Clamp file title to two lines', checked: this.properties.twoLineClamp })
          ]
        }]
      }]
    };
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
