export abstract class ChartBaseModel {
  private valid = false;
  private loading = false;
  private hidden = false;

  markAsValid(): this {
    this.valid = true;
    return this;
  }

  markAsInvalid(): this {
    this.valid = false;
    return this;
  }

  isValid(): boolean {
    return this.valid;
  }

  hide(): this {
    this.hidden = true;
    return this;
  }

  show(): this {
    this.hidden = false;
    return this;
  }

  isHidden(): boolean {
    return this.hidden;
  }

  showLoading(): this {
    this.loading = true;
    return this;
  }

  hideLoading(): this {
    this.loading = false;
    return this;
  }

  isLoading(): boolean {
    return this.loading;
  }

  protected addOpacityToColor(color: string, opacity: number): string {
    if (!color.startsWith("#") || color.length !== 7) return color;

    const r = Number.parseInt(color.slice(1, 3), 16);
    const g = Number.parseInt(color.slice(3, 5), 16);
    const b = Number.parseInt(color.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
}
