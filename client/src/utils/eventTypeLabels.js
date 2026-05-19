const EVENT_TYPE_LABELS = {
  'Trivalent vaccine': 'Vacuna trivalente',
  'Rabies vaccine': 'Vacuna antirrábica',
  'Internal deworming': 'Desparasitación interna',
  'External deworming': 'Desparasitación externa',
  'General checkup': 'Revisión general',
  Treatment: 'Tratamiento',
};

export const translateEventType = (name) => EVENT_TYPE_LABELS[name] || name || 'Evento';
