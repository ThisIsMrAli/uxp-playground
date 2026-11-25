export const HOSTS = [
  { id: 'PS', label: 'Photoshop', module: 'photoshop', minVersion: '24.4.0', previewVersion: '27.4.0', uxp: '9.2', menu: 'Plugins', setup: '' },
  { id: 'premierepro', label: 'Premiere Pro', module: 'premierepro', minVersion: '25.6.0', previewVersion: '26.0.0', uxp: '9.0', menu: 'Window → UXP Plugins', setup: 'In Plugins preferences, enable Developer Mode and restart Premiere Pro.' },
  { id: 'ID', label: 'InDesign', module: 'indesign', minVersion: '18.5.0', previewVersion: '21.0.0', uxp: '9.0', menu: 'Plugins', setup: '' },
  { id: 'ame', label: 'Media Encoder (UXP Beta)', module: 'mediaencoder', minVersion: '27.0.0', previewVersion: '27.0.0', uxp: '9.4', menu: 'Window → UXP Plugins', setup: 'UXP support is in public beta. In Plugins preferences, enable Developer Mode and restart Media Encoder. Use UDT 2.2.1.18 or later.' },
  { id: 'aftereffects', label: 'After Effects (Beta)', module: 'aftereffects', minVersion: '27.1.0', previewVersion: '27.1.0', uxp: '9.4', menu: 'Window', setup: 'Use After Effects Beta build 27.1.0.045 or later and UDT 2.4 or later.' }
] as const;

export type HostApp = (typeof HOSTS)[number]['id'];

export function hostInfo(id: unknown) {
  return HOSTS.find((host) => host.id === id);
}
