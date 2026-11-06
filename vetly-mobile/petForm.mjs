export const petTypes = { Dog: 'Σκύλος', Cat: 'Γάτα', Bird: 'Πτηνό', Rabbit: 'Κουνέλι', Hamster: 'Χάμστερ', Fish: 'Ψάρι', Reptile: 'Ερπετό', Other: 'Άλλο' };
export function petPayload(form, editing = false) {
  const name = form.name.trim(), breed = form.breed.trim();
  const ageText = form.age.trim(), weightText = form.weight.trim().replace(',', '.');
  const age = Number(ageText), weight = Number(weightText), chip = form.chip_number.trim();
  if (name.length < 2 || name.length > 30) throw new Error('Το όνομα πρέπει να έχει 2–30 χαρακτήρες.');
  if (breed.length < 2 || breed.length > 100) throw new Error('Η ράτσα πρέπει να έχει 2–100 χαρακτήρες.');
  if ((!editing || ageText) && (!/^\d+$/.test(ageText) || age > 50)) throw new Error('Η ηλικία πρέπει να είναι ακέραιος αριθμός από 0 έως 50.');
  if ((!editing || weightText) && (!/^\d+(\.\d+)?$/.test(weightText) || weight <= 0 || weight > 200)) throw new Error('Το βάρος πρέπει να είναι μεγαλύτερο από 0 και έως 200 kg.');
  if (chip && !/^\d{15}$/.test(chip)) throw new Error('Το microchip πρέπει να έχει ακριβώς 15 ψηφία.');
  return { name, breed, ...(ageText ? { age } : {}), ...(weightText ? { weight } : {}), ...(chip ? { chip_number: chip } : {}), ...(!editing ? { type: form.type, gender: form.gender } : {}) };
}
