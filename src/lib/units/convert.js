/**
 * Unit conversions used across AeroLex. Exact definitions:
 *   1 ft = 0.3048 m (international foot)   1 NM = 1852 m   1 lb = 0.45359237 kg
 * Educational use only: not for operational calculations.
 */
export const M_PER_FT = 0.3048;
export const M_PER_NM = 1852;
export const KG_PER_LB = 0.45359237;
/** 1 statute mile = 1609.344 m; 1 inHg = 33.8638866667 hPa (at 0 °C, standard gravity). */
export const M_PER_SM = 1609.344;
export const HPA_PER_INHG = 33.8638866667;

export const mToFt = (m) => m / M_PER_FT;
export const ftToM = (ft) => ft * M_PER_FT;
export const nmToKm = (nm) => (nm * M_PER_NM) / 1000;
export const kmToNm = (km) => (km * 1000) / M_PER_NM;
export const kgToLb = (kg) => kg / KG_PER_LB;
export const lbToKg = (lb) => lb * KG_PER_LB;
export const ktToKmh = (kt) => nmToKm(kt);
export const kmhToKt = (kmh) => kmToNm(kmh);
export const mpsToKmh = (mps) => mps * 3.6;
export const smToM = (sm) => sm * M_PER_SM;
export const inHgToHpa = (inHg) => inHg * HPA_PER_INHG;
export const hpaToInHg = (hpa) => hpa / HPA_PER_INHG;

/** Round to a number of decimals (avoids floating noise like 35.800000000004). */
export function round(value, decimals = 0) {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/** 33.84 m -> "111 ft 0 in" */
export function feetInches(m) {
  const totalIn = Math.round(mToFt(m) * 12);
  return `${Math.floor(totalIn / 12)} ft ${totalIn % 12} in`;
}
