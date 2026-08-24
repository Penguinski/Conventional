export function shouldUseMobileElevatorFocus({ coarsePointer, landscape, force = false }) {
  return (force || coarsePointer) && landscape;
}
