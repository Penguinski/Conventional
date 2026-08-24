export const PERIODS = ['morning', 'afternoon', 'evening', 'night'];

export function getTimePeriod(hour = new Date().getHours()) {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

export function resolveTimePeriod(search = window.location.search, date = new Date()) {
  const override = new URLSearchParams(search).get('time');
  return PERIODS.includes(override) ? override : getTimePeriod(date.getHours());
}

const defaultState = { light: false, shutter: 0, curtain: 'open', open: false, detail: 'none' };

export const apartmentWindows = [
  {
    id: 'floor-3-left', resident: 'Arturo', floor: 3, side: 'left',
    states: {
      morning: { shutter: 76, curtain: 'closed', detail: 'mug' },
      afternoon: { shutter: 88, curtain: 'closed', detail: 'none' },
      evening: { shutter: 42, curtain: 'half', light: false, detail: 'books' },
      night: { shutter: 12, curtain: 'half', light: true, open: true, detail: 'books' },
    },
  },
  {
    id: 'floor-3-right', resident: 'Jannel', floor: 3, side: 'right',
    states: {
      morning: { shutter: 8, curtain: 'open', light: false, open: true, detail: 'cat' },
      afternoon: { shutter: 0, curtain: 'open', detail: 'plant' },
      evening: { shutter: 12, curtain: 'half', light: true, detail: 'cat' },
      night: { shutter: 62, curtain: 'closed', light: false, detail: 'cat' },
    },
  },
  {
    id: 'floor-2-left', resident: 'Paolo', floor: 2, side: 'left',
    states: {
      morning: { shutter: 28, curtain: 'half', detail: 'plant' },
      afternoon: { shutter: 10, curtain: 'open', open: true, detail: 'laundry' },
      evening: { shutter: 20, curtain: 'open', light: true, detail: 'lamp' },
      night: { shutter: 90, curtain: 'closed', detail: 'none' },
    },
  },
  {
    id: 'floor-2-right', resident: 'Famiglia Rossi', floor: 2, side: 'right',
    states: {
      morning: { shutter: 4, curtain: 'half', light: true, detail: 'plant' },
      afternoon: { shutter: 0, curtain: 'open', open: true, detail: 'laundry' },
      evening: { shutter: 0, curtain: 'half', light: true, detail: 'lamp' },
      night: { shutter: 54, curtain: 'closed', light: false, detail: 'none' },
    },
  },
  {
    id: 'floor-1-left', resident: 'Nuovo inquilino', floor: 1, side: 'left',
    states: {
      morning: { shutter: 16, curtain: 'open', detail: 'box' },
      afternoon: { shutter: 0, curtain: 'open', open: true, detail: 'box' },
      evening: { shutter: 8, curtain: 'half', light: true, detail: 'box' },
      night: { shutter: 70, curtain: 'closed', detail: 'box' },
    },
  },
  {
    id: 'floor-1-right', resident: 'Maria', floor: 1, side: 'right',
    states: {
      morning: { shutter: 0, curtain: 'half', light: true, open: true, detail: 'laundry' },
      afternoon: { shutter: 18, curtain: 'half', detail: 'plant' },
      evening: { shutter: 22, curtain: 'closed', light: true, detail: 'lamp' },
      night: { shutter: 86, curtain: 'closed', detail: 'none' },
    },
  },
];

export function getApartmentState(apartment, period) {
  return { ...defaultState, ...apartment.states[period] };
}
