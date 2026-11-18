// Harborline tuning constants — world size, speeds, colours and economy.
export const WORLD_W = 3200;
export const WORLD_H = 2600;
export const BLOCK = 400;
export const ROAD_W = 96;
export const WATER_Y = 2080;
export const PLAYER = { walkSpeed: 155, runSpeed: 265, radius: 13, maxHealth: 100 };
export const CAR = { accel: 540, brake: 760, maxSpeed: 440, reverse: 160, turnRate: 2.7 };
export const WANTED = { maxStars: 5, coolTime: 12 };
export const PALETTE = {
  grass: '#79c24f', sand: '#eed88f', pavement: '#cfc8b8', road: '#383d45',
  roadLine: '#f7e26b', water: '#1e82ad', waterDeep: '#125e82', pier: '#9a6b45',
  roofs: ['#e86a5e','#f2a65a','#5eb1c9','#8d7fd6','#e8c85e','#67b98a','#d97fb8','#f27d4d','#4fc3a1','#e0e6ee'],
};
export const DISTRICTS = [
  { name: 'Old Market', x: 0, y: 0, w: 1100, h: 950 },
  { name: 'Palm Heights', x: 1100, y: 0, w: 1050, h: 950 },
  { name: 'North Yards', x: 2150, y: 0, w: 1050, h: 950 },
  { name: 'Marina Row', x: 0, y: 950, w: 1100, h: 700 },
  { name: 'City Centre', x: 1100, y: 950, w: 1050, h: 700 },
  { name: 'Dockside', x: 2150, y: 950, w: 1050, h: 700 },
  { name: 'The Harbour', x: 0, y: 1650, w: 3200, h: 950 },
];
export const SAVE_KEY = 'harborline-save-v1';
export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
