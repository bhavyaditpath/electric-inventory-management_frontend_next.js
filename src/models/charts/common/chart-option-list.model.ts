export class ChartOptionListModel {
  key: string;
  label: string;
  selected: boolean;
  color: string;

  constructor(key = "", label = "", selected = false, color = "") {
    this.key = key;
    this.label = label;
    this.selected = selected;
    this.color = color;
  }

  setSelected(selected: boolean): ChartOptionListModel {
    this.selected = selected;
    return this;
  }
}
