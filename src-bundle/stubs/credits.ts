// Site build stub: the credits profiles and their photographs are not part of the site.
// The title screen only constructs these inside its own popups, which the site never opens.
export const CREDITS: never[] = [];
export class ProfileCard {
  update(_dt: number): void {}
  draw(): void {}
  onMove(): boolean {
    return false;
  }
  onClick(): boolean {
    return false;
  }
}
export function drawPortrait(): void {}
export function photoFor(): null {
  return null;
}
