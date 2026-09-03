export function synchronizedWhatsapp(
  phone: string,
  current: string,
  synchronized: boolean,
) {
  return synchronized ? phone : current;
}
